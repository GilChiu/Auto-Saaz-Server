// @ts-nocheck
// Supabase Edge Function: users
// Get users list with search, pagination, and filtering

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

function ok(data: unknown, origin?: string, meta?: Record<string, unknown>) {
  return withCors(
    new Response(
      JSON.stringify({
        success: true,
        data,
        ...(meta && { meta }),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    ),
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

  // Parse query parameters
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || '';
  const status = url.searchParams.get('status') || '';

  const offset = (page - 1) * limit;

  try {
    // Build query with joins
    let query = supabase
      .from('garage_profiles')
      .select(`
        *,
        user:users!garage_profiles_user_id_fkey (
          id,
          email,
          role,
          status,
          created_at
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    // Apply role filter via user relation
    if (role) {
      query = query.eq('user.role', role);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      return badRequest('Failed to fetch users', origin, 500);
    }

    // Transform data to match expected format
    const users = (profiles || []).map((profile: any) => ({
      id: profile.user?.id || profile.user_id,
      name: profile.full_name,
      phone: profile.phone_number,
      email: profile.email,
      carModel: 'N/A', // Will be enhanced later with actual car data
      bookings: 0, // Will be counted separately if needed
      verification: profile.is_email_verified ? 'Validated' : 'Unvalidated',
      totalSale: '0 AED', // Will be calculated from bookings
      role: profile.user?.role || 'garage_owner',
      status: profile.status,
      created_at: profile.created_at,
      profile_id: profile.id,
    }));

    return ok(users, origin, {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Function error:', err);
    return badRequest('Internal server error', origin, 500);
  }
});
