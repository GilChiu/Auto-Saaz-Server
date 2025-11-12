import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function handleOptions(req: Request) {
  return new Response('ok', { headers: corsHeaders });
}

function withCors(response: Response, origin: string) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const orderId = url.pathname.split('/').filter(Boolean).pop();

    if (req.method === 'GET' && orderId) {
      // Fetch booking details
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('id', orderId)
        .single();

      if (bookingError) throw bookingError;
      if (!booking) {
        const response = new Response(
          JSON.stringify({ error: 'Order not found' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
        return withCors(response, origin);
      }

      // Fetch garage profile
      const { data: garage } = await supabaseClient
        .from('garage_profiles')
        .select('user_id, full_name, garage_name, phone_number, email, location, rating, address')
        .eq('user_id', booking.garage_id)
        .single();

      // Format response
      const orderDetail = {
        id: booking.id,
        orderNumber: booking.booking_number,
        
        // Customer info
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerEmail: booking.customer_email,
        
        // Garage info
        garageId: booking.garage_id,
        garageName: garage?.garage_name || garage?.full_name || 'Unknown Garage',
        garageLocation: garage?.location || 'N/A',
        garageAddress: garage?.address || 'N/A',
        garagePhone: garage?.phone_number || 'N/A',
        garageEmail: garage?.email || 'N/A',
        garageRating: garage?.rating || 0,
        
        // Vehicle info
        vehicleMake: booking.vehicle_make,
        vehicleModel: booking.vehicle_model,
        vehicleYear: booking.vehicle_year,
        vehiclePlate: booking.vehicle_plate_number,
        
        // Service info
        serviceType: booking.service_type,
        serviceDescription: booking.service_description,
        
        // Scheduling
        bookingDate: booking.booking_date,
        scheduledTime: booking.scheduled_time,
        pickupSchedule: booking.scheduled_time ? 
          `${new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${booking.scheduled_time}` :
          new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        
        // Status and financials
        status: booking.status,
        recoveryStatus: booking.recovery_status || 'awaiting_confirmation',
        paymentStatus: booking.payment_status,
        quotation: booking.quotation || booking.estimated_cost || 0,
        estimatedCost: booking.estimated_cost,
        actualCost: booking.actual_cost,
        
        // Technical details
        inspectionReport: booking.inspection_report || '',
        assignedTechnician: booking.assigned_technician,
        
        // Notes
        notes: booking.notes,
        internalNotes: booking.internal_notes,
        
        // Timestamps
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        completionDate: booking.completion_date
      };

      const response = new Response(
        JSON.stringify(orderDetail),
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
