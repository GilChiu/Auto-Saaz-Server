import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

function handleOptions(req: Request) {
  return new Response('ok', { headers: corsHeaders });
}

function withCors(response: Response, origin: string) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  try {
    // Use service role key for admin operations (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // pathParts will be like ['orders'] or ['orders', 'some-id']
    const orderId = pathParts.length > 1 ? pathParts[1] : null;

    // GET - List orders with pagination and search
    if (req.method === 'GET' && !orderId) {
      const searchParams = url.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      
      const offset = (page - 1) * limit;

      // Build query
      let query = supabaseClient
        .from('bookings')
        .select('*', { count: 'exact' });

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Search by customer name or garage (we'll filter garage after fetching)
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,booking_number.ilike.%${search}%`);
      }

      // Pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: bookings, error, count } = await query;

      console.log('Query result:', { bookingsCount: bookings?.length, totalCount: count, status, search, error: error?.message });
      
      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      // Get unique garage IDs
      const garageIds = [...new Set(bookings?.map(b => b.garage_id).filter(Boolean))];

      // Fetch garage profiles separately (only if there are garage IDs)
      let garageProfiles = [];
      if (garageIds.length > 0) {
        const { data } = await supabaseClient
          .from('garage_profiles')
          .select('user_id, full_name, garage_name, phone_number, location, rating')
          .in('user_id', garageIds);
        garageProfiles = data || [];
      }

      // Create a map for quick lookup
      const garageMap = new Map(garageProfiles?.map(g => [g.user_id, g]) || []);

      // If searching, filter by garage name
      let filteredBookings = bookings || [];
      if (search && garageProfiles) {
        const matchingGarageIds = garageProfiles
          .filter(g => 
            (g.garage_name?.toLowerCase().includes(search.toLowerCase())) ||
            (g.full_name?.toLowerCase().includes(search.toLowerCase()))
          )
          .map(g => g.user_id);
        
        if (matchingGarageIds.length > 0) {
          filteredBookings = bookings?.filter(b => 
            matchingGarageIds.includes(b.garage_id) ||
            b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            b.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
            b.customer_phone?.includes(search) ||
            b.booking_number?.toLowerCase().includes(search.toLowerCase())
          ) || [];
        }
      }

      // Format response
      const formattedOrders = filteredBookings.map(booking => {
        const garage = garageMap.get(booking.garage_id);
        return {
          id: booking.id,
          orderNumber: booking.booking_number,
          customerName: booking.customer_name,
          customerPhone: booking.customer_phone,
          customerEmail: booking.customer_email,
          garageId: booking.garage_id,
          garageName: garage?.garage_name || garage?.full_name || 'Unknown Garage',
          garageLocation: garage?.location || 'N/A',
          garageRating: garage?.rating || 0,
          pickupSchedule: booking.scheduled_time ? 
            `${new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${booking.scheduled_time}` :
            new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          recoveryStatus: booking.recovery_status || 'awaiting_confirmation',
          quotation: booking.quotation || booking.estimated_cost || 0,
          inspectionReport: booking.inspection_report || '',
          status: booking.status,
          paymentStatus: booking.payment_status,
          serviceType: booking.service_type,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        };
      });

      const response = new Response(
        JSON.stringify({
          orders: formattedOrders,
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

      return withCors(response, origin);
    }

    // PATCH - Assign/change garage for an order OR update status
    if (req.method === 'PATCH' && orderId) {
      const { garageId, adminId, status } = await req.json();

      if (!garageId) {
        const response = new Response(
          JSON.stringify({ error: 'garageId is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
        return withCors(response, origin);
      }

      // Build update object
      const updateData: any = {
        garage_id: garageId,
        updated_at: new Date().toISOString(),
      };

      // If status is provided, update it; otherwise set recovery_status to 'assigned'
      if (status) {
        updateData.status = status;
      } else {
        updateData.recovery_status = 'assigned';
      }

      // Update the booking
      const { data, error } = await supabaseClient
        .from('bookings')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      const response = new Response(
        JSON.stringify({ success: true, order: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

      return withCors(response, origin);
    }

    // Method not allowed
    const response = new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );

    return withCors(response, origin);

  } catch (error) {
    const response = new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );

    return withCors(response, origin);
  }
});
