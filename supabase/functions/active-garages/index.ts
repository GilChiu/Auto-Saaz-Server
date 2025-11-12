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

    if (req.method === 'GET') {
      // Fetch all active garages (not suspended, not deleted)
      const { data: garages, error } = await supabaseClient
        .from('garage_profiles')
        .select('user_id, full_name, garage_name, phone_number, location, rating, address')
        .eq('status', 'active')
        .is('suspended_at', null)
        .is('deleted_at', null)
        .order('garage_name');

      if (error) throw error;

      // Format response
      const formattedGarages = (garages || []).map(garage => ({
        id: garage.user_id,
        name: garage.garage_name || garage.full_name,
        location: garage.location || 'N/A',
        rating: garage.rating || 0,
        phone: garage.phone_number,
        address: garage.address,
        // Display format for dropdown: "Name - Location ★ Rating"
        displayName: `${garage.garage_name || garage.full_name} - ${garage.location || 'N/A'} ★ ${garage.rating || 0}`
      }));

      const response = new Response(
        JSON.stringify({ garages: formattedGarages }),
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
