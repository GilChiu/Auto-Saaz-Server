// @ts-nocheck
// Supabase Edge Function: auth-refresh
// Mirrors POST /api/auth/refresh

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { SignJWT, jwtVerify } from 'https://esm.sh/jose@5.2.3';
import { handleOptions, withCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
const JWT_SECRET = Deno.env.get('JWT_SECRET') || '';

const ACCESS_TTL_SEC = 7 * 24 * 60 * 60; // 7d

function badRequest(message: string, origin?: string, status = 400) {
  return withCors(new Response(JSON.stringify({ success: false, message }), { status, headers: { 'Content-Type': 'application/json' } }), origin);
}
function ok(data: unknown, message = 'OK', origin?: string) {
  return withCors(new Response(JSON.stringify({ success: true, data, message }), { status: 200, headers: { 'Content-Type': 'application/json' } }), origin);
}

function toSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

async function createAccessToken(userId: string, email: string, role: string) {
  return await new SignJWT({ userId, email, role, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('autosaaz-api')
    .setAudience('autosaaz-client')
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(toSecret(JWT_SECRET));
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !JWT_SECRET) return badRequest('Function not configured', origin, 500);
  if (req.method !== 'POST') return withCors(new Response('Method Not Allowed', { status: 405 }), origin);

  const { refreshToken } = await req.json().catch(() => ({} as any));
  if (!refreshToken) return badRequest('Refresh token is required', origin);

  try {
    const { payload } = await jwtVerify(refreshToken, toSecret(JWT_SECRET), { issuer: 'autosaaz-api', audience: 'autosaaz-client' });
    if (!payload || payload.type !== 'refresh' || !payload.userId) return badRequest('Invalid refresh token', origin, 401);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });
    const { data: user } = await supabase.from('users').select('*').eq('id', payload.userId as string).single();
    if (!user) return badRequest('User not found', origin, 404);
    if (user.status !== 'active') return badRequest('Account is not active', origin, 403);

    const accessToken = await createAccessToken(user.id, user.email, user.role);
    return ok({ accessToken }, 'Token refreshed successfully', origin);
  } catch (e) {
    return badRequest('Invalid refresh token', origin, 401);
  }
});
