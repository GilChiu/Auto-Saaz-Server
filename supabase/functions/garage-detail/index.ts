import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get garageId from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const garageId = pathParts[pathParts.length - 1]

    if (!garageId || garageId === 'garage-detail') {
      return new Response(
        JSON.stringify({ success: false, message: 'Garage ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch garage profile with user details
    const { data: garage, error: garageError } = await supabase
      .from('garage_profiles')
      .select(`
        id,
        user_id,
        full_name,
        garage_name,
        email,
        phone_number,
        address,
        street,
        state,
        location,
        coordinates,
        company_legal_name,
        emirates_id_url,
        trade_license_number,
        vat_certification,
        status,
        rating,
        suspended_at,
        suspended_by,
        suspension_reason,
        deleted_at,
        deleted_by,
        created_at,
        updated_at,
        users!inner(
          id,
          email,
          role,
          status,
          created_at
        )
      `)
      .eq('id', garageId)
      .single()

    if (garageError || !garage) {
      return new Response(
        JSON.stringify({ success: false, message: 'Garage not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch booking statistics
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('garage_id', garage.user_id)

    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('garage_id', garage.user_id)
      .eq('status', 'completed')

    const { count: cancelledBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('garage_id', garage.user_id)
      .eq('status', 'cancelled')

    // Fetch revenue (if available)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('garage_id', garage.user_id)
      .eq('status', 'completed')

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Get suspended/deleted by admin details if applicable
    let suspendedByAdmin = null
    let deletedByAdmin = null

    if (garage.suspended_by) {
      const { data: admin } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', garage.suspended_by)
        .single()
      suspendedByAdmin = admin
    }

    if (garage.deleted_by) {
      const { data: admin } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', garage.deleted_by)
        .single()
      deletedByAdmin = admin
    }

    // Transform data
    const transformedGarage = {
      id: garage.id,
      userId: garage.user_id,
      name: garage.garage_name || garage.full_name || 'Unnamed Garage',
      owner: garage.full_name,
      email: garage.email,
      phone: garage.phone_number,
      contact: garage.phone_number,
      address: garage.address,
      street: garage.street,
      state: garage.state,
      location: garage.location || garage.address,
      area: garage.location || garage.address,
      coordinates: garage.coordinates,
      companyLegalName: garage.company_legal_name,
      emiratesIdUrl: garage.emirates_id_url,
      tradeLicenseNumber: garage.trade_license_number,
      vatCertification: garage.vat_certification,
      status: garage.suspended_at ? 'Suspended' : (garage.deleted_at ? 'Deleted' : garage.status || 'Active'),
      rating: garage.rating || 0,
      isSuspended: !!garage.suspended_at,
      isDeleted: !!garage.deleted_at,
      suspendedAt: garage.suspended_at,
      suspendedBy: suspendedByAdmin,
      suspensionReason: garage.suspension_reason,
      deletedAt: garage.deleted_at,
      deletedBy: deletedByAdmin,
      createdAt: garage.created_at,
      updatedAt: garage.updated_at,
      user: garage.users,
      stats: {
        totalBookings: totalBookings || 0,
        completedBookings: completedBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalRevenue: totalRevenue
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedGarage
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in garage-detail function:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
