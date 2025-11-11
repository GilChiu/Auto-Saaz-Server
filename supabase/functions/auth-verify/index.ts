// @ts-nocheck
// Supabase Edge Function: auth-verify
// Mirrors POST /api/auth/verify

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';
import { SignJWT } from 'https://esm.sh/jose@5.2.3';
import { handleOptions, withCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
const JWT_SECRET = Deno.env.get('JWT_SECRET') || '';

function badRequest(message: string, origin?: string) {
  return withCors(new Response(JSON.stringify({ success: false, message }), { status: 400, headers: { 'Content-Type': 'application/json' } }), origin);
}
function ok(data: unknown, message = 'OK', origin?: string) {
  return withCors(new Response(JSON.stringify({ success: true, data, message }), { status: 200, headers: { 'Content-Type': 'application/json' } }), origin);
}
function serverError(message = 'Internal server error', origin?: string, extra?: unknown) {
  return withCors(new Response(JSON.stringify({ success: false, message, ...(extra ? { error: extra } : {}) }), { status: 500, headers: { 'Content-Type': 'application/json' } }), origin);
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !JWT_SECRET) return serverError('Function not configured', origin);
  if (req.method !== 'POST') return withCors(new Response('Method Not Allowed', { status: 405 }), origin);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });

  const body = await req.json().catch(() => null) as { sessionId?: string; code?: string } | null;
  if (!body) return badRequest('Invalid JSON body', origin);
  const { sessionId, code } = body;
  if (!sessionId || !code) return badRequest('Session ID and verification code are required', origin);

  // Load session
  const { data: session, error: sessErr } = await supabase.from('registration_sessions').select('*').eq('session_id', sessionId).single();
  if (sessErr?.code === 'PGRST116' || !session) return badRequest('Invalid or expired session', origin);
  if (sessErr) return serverError('Failed to load session', origin, sessErr);
  if ((session.step_completed ?? 0) < 3) return badRequest('Please complete all previous steps first', origin);

  // Try strict verification first
  const nowIso = new Date().toISOString();
  const { data: foundCode, error: codeErr } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', session.email?.toLowerCase())
    .eq('code', code)
    .eq('is_used', false)
    .gt('expires_at', nowIso)
    .limit(1)
    .maybeSingle();
  if (codeErr) {
    // Log and continue to fallback; we mirror "accept any 6-digit" behavior if strict fails
    console.warn('Code lookup error', codeErr);
  }

  if (!foundCode) {
    if (!/^\d{6}$/.test(code)) {
      return badRequest('Invalid verification code format. Must be 6 digits.', origin);
    }
    // Accept any 6-digit in temporary mode
  }

  // Generate password and hash
  const plain = generatePassword(12);
  const salt = bcrypt.genSaltSync(10);
  const hashed = bcrypt.hashSync(plain, salt);

  // Create user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert([
      {
        email: session.email?.toLowerCase(),
        password: hashed,
        role: 'garage_owner',
        status: 'active',
        failed_login_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select('*')
    .single();
  if (userErr) return serverError('Failed to create user', origin, userErr);

  // Create profile
  const { error: profErr } = await supabase
    .from('garage_profiles')
    .insert([
      {
        user_id: user.id,
        full_name: session.full_name,
        email: session.email,
        phone_number: session.phone_number,
        address: session.address,
        street: session.street,
        state: session.state,
        location: session.location,
        coordinates: session.coordinates,
        company_legal_name: session.company_legal_name,
        emirates_id_url: session.emirates_id_url,
        trade_license_number: session.trade_license_number,
        vat_certification: session.vat_certification,
        role: 'garage_owner',
        status: 'active',
        is_email_verified: true,
        is_phone_verified: true,
        email_verified_at: new Date().toISOString(),
        phone_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  if (profErr) return serverError('User created but failed to create profile', origin, profErr);

  // Mark code used if we matched it
  if (foundCode) {
    const { error: markErr } = await supabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', foundCode.id);
    if (markErr) console.warn('Failed to mark code used', markErr);
  }

  // Delete session
  const { error: delErr } = await supabase.from('registration_sessions').delete().eq('session_id', sessionId);
  if (delErr) console.warn('Failed to delete registration session', delErr);

  // Issue tokens (same shape as auth-login)
  const toSecret = (s: string) => new TextEncoder().encode(s);
  const createToken = async (payload: Record<string, unknown>, ttlSec: number) => {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('autosaaz-api')
      .setAudience('autosaaz-client')
      .setExpirationTime(`${ttlSec}s`)
      .sign(toSecret(JWT_SECRET));
  };
  const ACCESS_TTL_SEC = 7 * 24 * 60 * 60; // 7d
  const REFRESH_TTL_SEC = 30 * 24 * 60 * 60; // 30d

  const accessToken = await createToken({ userId: user.id, email: user.email, role: user.role, type: 'access' }, ACCESS_TTL_SEC);
  const refreshToken = await createToken({ userId: user.id, type: 'refresh' }, REFRESH_TTL_SEC);

  // Load profile preview (optional)
  const { data: profile } = await supabase.from('garage_profiles').select('*').eq('user_id', user.id).maybeSingle();

  return ok(
    {
      user: { id: user.id, email: user.email, role: user.role, status: user.status },
      profile: profile ? {
        fullName: profile.full_name,
        email: profile.email,
        phoneNumber: profile.phone_number,
        companyLegalName: profile.company_legal_name,
        status: profile.status,
      } : null,
      accessToken,
      refreshToken,
      generatedPassword: plain, // development helper
    },
    'Registration successful! You are now logged in.',
    origin,
  );
});
