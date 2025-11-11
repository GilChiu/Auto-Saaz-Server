// @ts-nocheck
// Supabase Edge Function: user-detail
// Get detailed user information

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions, withCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function badRequest(message: string, origin?: string, status = 400) {
  return withCors(
    new Response(JSON.stringify({ success: false, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
    origin
  );
}

function ok(data: unknown, origin?: string) {
  return withCors(
    new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
    origin
  );
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return badRequest('Function not configured', origin, 500);
  }

  if (req.method !== 'GET') {
    return withCors(new Response('Method Not Allowed', { status: 405 }), origin);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch },
  });

  // Extract user ID from URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const userId = pathParts[pathParts.length - 1];

  if (!userId) {
    return badRequest('User ID is required', origin);
  }

  try {
    // Fetch user with profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        status,
        created_at,
        last_login_at
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return badRequest('User not found', origin, 404);
    }

    // Fetch garage profile
    const { data: profile } = await supabase
      .from('garage_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Fetch bookings count (if bookings table exists)
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('garage_id', userId);

    // Build detailed response
    const userDetail = {
      id: user.id,
      name: profile?.full_name || 'N/A',
      email: user.email,
      phone: profile?.phone_number || 'N/A',
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
      profile: profile ? {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        address: profile.address,
        street: profile.street,
        state: profile.state,
        location: profile.location,
        company_legal_name: profile.company_legal_name,
        trade_license_number: profile.trade_license_number,
        vat_certification: profile.vat_certification,
        is_email_verified: profile.is_email_verified,
        is_phone_verified: profile.is_phone_verified,
        email_verified_at: profile.email_verified_at,
        phone_verified_at: profile.phone_verified_at,
      } : null,
      stats: {
        total_bookings: bookingsCount || 0,
      },
    };

    return ok(userDetail, origin);
  } catch (err) {
    console.error('Function error:', err);
    return badRequest('Internal server error', origin, 500);
  }
});
