// @ts-nocheck
// Supabase Edge Function: auth-register-step2
// Mirrors POST /api/auth/register/step2

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleOptions, withCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function badRequest(message: string, origin?: string) {
  return withCors(new Response(JSON.stringify({ success: false, message }), { status: 400, headers: { 'Content-Type': 'application/json' } }), origin);
}
function ok(data: unknown, message = 'OK', origin?: string) {
  return withCors(new Response(JSON.stringify({ success: true, data, message }), { status: 200, headers: { 'Content-Type': 'application/json' } }), origin);
}
function serverError(message = 'Internal server error', origin?: string, extra?: unknown) {
  return withCors(new Response(JSON.stringify({ success: false, message, ...(extra ? { error: extra } : {}) }), { status: 500, headers: { 'Content-Type': 'application/json' } }), origin);
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return serverError('Function not configured', origin);
  if (req.method !== 'POST') return withCors(new Response('Method Not Allowed', { status: 405 }), origin);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });

  const body = await req.json().catch(() => null) as {
    sessionId?: string;
    address?: string;
    street?: string;
    state?: string;
    location?: string;
    coordinates?: unknown;
  } | null;
  if (!body) return badRequest('Invalid JSON body', origin);
  const { sessionId, address, street, state, location, coordinates } = body;
  if (!sessionId || !address || !street || !state || !location) return badRequest('Missing required fields', origin);

  // Load session
  const { data: session, error: sessErr } = await supabase
    .from('registration_sessions').select('*').eq('session_id', sessionId).single();
  if (sessErr?.code === 'PGRST116' || !session) return badRequest('Invalid or expired session', origin);
  if (sessErr) return serverError('Failed to load session', origin, sessErr);
  if ((session.step_completed ?? 0) < 1) return badRequest('Please complete Step 1 first', origin);

  // Update
  const { error: updErr } = await supabase
    .from('registration_sessions')
    .update({ address, street, state, location, coordinates, step_completed: 2, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId);
  if (updErr) return serverError('Failed to save business location', origin, updErr);

  return ok({ nextStep: 3 }, 'Business location saved successfully', origin);
});
