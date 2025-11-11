import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { handleOptions, withCors } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req)
  }

  const origin = req.headers.get('origin') || '*'

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    
    // GET: List garages with pagination, search, filtering
    if (req.method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const search = url.searchParams.get('search') || ''
      const status = url.searchParams.get('status') || ''
      const includeDeleted = url.searchParams.get('includeDeleted') === 'true'

      const offset = (page - 1) * limit

      // Build query
      let query = supabase
        .from('garage_profiles')
        .select(`
          id,
          user_id,
          full_name,
          garage_name,
          email,
          phone_number,
          address,
          location,
          status,
          rating,
          suspended_at,
          deleted_at,
          created_at,
          users!inner(
            id,
            email,
            role,
            status
          )
        `, { count: 'exact' })

      // Filter: Only garage_owner role
      query = query.eq('users.role', 'garage_owner')

      // Filter: Exclude deleted by default
      if (!includeDeleted) {
        query = query.is('deleted_at', null)
      }

      // Filter: By status
      if (status) {
        query = query.eq('status', status)
      }

      // Search: By name, email, phone, location
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,garage_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%,location.ilike.%${search}%`)
      }

      // Pagination
      const { data: garages, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching garages:', error)
        return withCors(
          new Response(
            JSON.stringify({ success: false, message: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        )
      }

      // Get booking counts for each garage
      const garageIds = garages?.map((g: any) => g.user_id) || []
      const { data: bookingCounts } = await supabase
        .from('bookings')
        .select('garage_id')
        .in('garage_id', garageIds)

      // Count bookings per garage
      const bookingMap = new Map<string, number>()
      bookingCounts?.forEach((b: any) => {
        bookingMap.set(b.garage_id, (bookingMap.get(b.garage_id) || 0) + 1)
      })

      // Transform data to match frontend expectations
      const transformedGarages = garages?.map((garage: any) => ({
        id: garage.id,
        userId: garage.user_id,
        name: garage.garage_name || garage.full_name || 'Unnamed Garage',
        owner: garage.full_name,
        email: garage.email,
        contact: garage.phone_number,
        phone: garage.phone_number,
        area: garage.location || garage.address || 'N/A',
        location: garage.location || garage.address,
        rating: garage.rating || 0,
        status: garage.suspended_at ? 'Suspended' : (garage.deleted_at ? 'Deleted' : garage.status || 'Active'),
        isSuspended: !!garage.suspended_at,
        isDeleted: !!garage.deleted_at,
        suspendedAt: garage.suspended_at,
        deletedAt: garage.deleted_at,
        totalBookings: bookingMap.get(garage.user_id) || 0,
        createdAt: garage.created_at,
      })) || []

      const totalPages = Math.ceil((count || 0) / limit)

      return withCors(
        new Response(
          JSON.stringify({
            success: true,
            data: transformedGarages,
            meta: {
              total: count || 0,
              page,
              limit,
              totalPages
            }
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // PATCH: Update garage (suspend/unsuspend)
    if (req.method === 'PATCH') {
      const { garageId, action, reason, adminId } = await req.json()

      if (!garageId || !action) {
        return withCors(
          new Response(
            JSON.stringify({ success: false, message: 'Missing garageId or action' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        )
      }

      let updateData: any = {}

      if (action === 'suspend') {
        updateData = {
          suspended_at: new Date().toISOString(),
          suspended_by: adminId,
          suspension_reason: reason || 'Suspended by admin',
          status: 'suspended'
        }
      } else if (action === 'unsuspend') {
        updateData = {
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null,
          status: 'active'
        }
      } else {
        return withCors(
          new Response(
            JSON.stringify({ success: false, message: 'Invalid action. Use "suspend" or "unsuspend"' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        )
      }

      const { data, error } = await supabase
        .from('garage_profiles')
        .update(updateData)
        .eq('id', garageId)
        .select()
        .single()

      if (error) {
        console.error('Error updating garage:', error)
        return withCors(
          new Response(
            JSON.stringify({ success: false, message: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        )
      }

      return withCors(
        new Response(
          JSON.stringify({ success: true, data, message: `Garage ${action}ed successfully` }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    // DELETE: Soft delete garage
    if (req.method === 'DELETE') {
      const garageId = url.searchParams.get('garageId')
      const adminId = url.searchParams.get('adminId')

      if (!garageId) {
        return withCors(
          new Response(
            JSON.stringify({ success: false, message: 'Missing garageId' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        )
      }

      const { data, error } = await supabase
        .from('garage_profiles')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: adminId,
          status: 'deleted'
        })
        .eq('id', garageId)
        .select()
        .single()

      if (error) {
        console.error('Error deleting garage:', error)
        return withCors(
          new Response(
            JSON.stringify({ success: false, message: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        )
      }

      return withCors(
        new Response(
          JSON.stringify({ success: true, data, message: 'Garage deleted successfully' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      )
    }

    return withCors(
      new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      ),
      origin
    )

  } catch (error) {
    console.error('Error in garages function:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return withCors(
      new Response(
        JSON.stringify({ success: false, message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      origin
    )
  }
})
