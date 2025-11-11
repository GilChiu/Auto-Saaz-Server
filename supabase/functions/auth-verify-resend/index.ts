// @ts-nocheck
// Supabase Edge Function: auth-verify-resend
// Mirrors POST /api/auth/verify/resend

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions, withCors } from '../_shared/cors.ts';
import { sendVerificationEmail } from '../_shared/email.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function ok(data: unknown, message = 'OK', origin?: string) {
  return withCors(new Response(JSON.stringify({ success: true, data, message }), { status: 200, headers: { 'Content-Type': 'application/json' } }), origin);
}
function bad(message: string, origin?: string, status = 400) {
  return withCors(new Response(JSON.stringify({ success: false, message }), { status, headers: { 'Content-Type': 'application/json' } }), origin);
}

function generateOTP(len = 6) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < len; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return bad('Function not configured', origin, 500);
  if (req.method !== 'POST') return withCors(new Response('Method Not Allowed', { status: 405 }), origin);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });
  const { sessionId } = await req.json().catch(() => ({}));
  if (!sessionId) return bad('Session ID is required', origin);

  const { data: session, error: sessErr } = await supabase.from('registration_sessions').select('*').eq('session_id', sessionId).maybeSingle();
  if (sessErr || !session) return bad('Invalid or expired session', origin, 404);
  if ((session.step_completed ?? 0) < 2) return bad('Please complete previous steps first', origin);

  const code = generateOTP(6);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: insErr } = await supabase.from('verification_codes').insert([
    {
      email: session.email?.toLowerCase(),
      phone_number: session.phone_number,
      code,
      method: 'both',
      attempts: 0,
      is_used: false,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    },
  ]);
  if (insErr) return bad('Failed to create verification code', origin, 500);

  // Attempt to send verification email
  if (session.email) {
    try {
      const result = await sendVerificationEmail(String(session.email), code, String(session.full_name || ''));
      if (!result.ok) console.warn('Email send failed', result);
    } catch (e) {
      console.warn('Email provider error', e);
    }
  }

  return ok({}, 'Verification code resent (check your email)', origin);
});
