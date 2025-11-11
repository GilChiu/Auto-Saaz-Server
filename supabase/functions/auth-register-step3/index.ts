// @ts-nocheck
// Supabase Edge Function: auth-register-step3
// Mirrors POST /api/auth/register/step3

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions, withCors } from '../_shared/cors.ts';
import { sendVerificationEmail } from '../_shared/email.ts';

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

function generateOTP(len = 6) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < len; i++) code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return serverError('Function not configured', origin);
  if (req.method !== 'POST') return withCors(new Response('Method Not Allowed', { status: 405 }), origin);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });

  const body = await req.json().catch(() => null) as {
    sessionId?: string;
    companyLegalName?: string;
    emiratesIdUrl?: string;
    tradeLicenseNumber?: string;
    vatCertification?: string;
  } | null;
  if (!body) return badRequest('Invalid JSON body', origin);
  const { sessionId, companyLegalName, emiratesIdUrl, tradeLicenseNumber, vatCertification } = body;
  if (!sessionId || !companyLegalName || !tradeLicenseNumber) return badRequest('Missing required fields', origin);

  // Load session
  const { data: session, error: sessErr } = await supabase
    .from('registration_sessions').select('*').eq('session_id', sessionId).single();
  if (sessErr?.code === 'PGRST116' || !session) return badRequest('Invalid or expired session', origin);
  if (sessErr) return serverError('Failed to load session', origin, sessErr);
  if ((session.step_completed ?? 0) < 2) return badRequest('Please complete Step 2 first', origin);

  // Update session with business data
  const { error: updErr } = await supabase
    .from('registration_sessions')
    .update({
      company_legal_name: companyLegalName,
      emirates_id_url: emiratesIdUrl ?? null,
      trade_license_number: tradeLicenseNumber,
      vat_certification: vatCertification ?? null,
      step_completed: 3,
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId);
  if (updErr) return serverError('Failed to save business details', origin, updErr);

  // Generate OTP and store, then send via email provider if configured
  const code = generateOTP(6);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 min
  const { error: otpErr } = await supabase.from('verification_codes').insert([
    {
      email: session.email?.toLowerCase(),
      phone_number: session.phone_number,
      code,
      method: 'both',
      attempts: 0,
      is_used: false,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    },
  ]);
  if (otpErr) return serverError('Saved business details but failed to create verification code', origin, otpErr);

  // Try to send email (non-blocking failure)
  if (session.email) {
    try {
      const result = await sendVerificationEmail(String(session.email), code, String(session.full_name || ''));
      if (!result.ok) {
        console.warn('Email send failed', result);
      }
    } catch (e) {
      console.warn('Email provider error', e);
    }
  }

  // Return message (and code in dev if needed). We won’t include the code by default.
  return ok({ nextStep: 4 }, 'Business details saved. If email is configured, a verification code was sent to your inbox.', origin);
});
