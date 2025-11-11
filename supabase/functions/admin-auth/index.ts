// @ts-nocheck
// Supabase Edge Function: admin-auth
// Admin-specific authentication endpoint

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';
import { SignJWT } from 'https://esm.sh/jose@5.2.3';
import { handleOptions, withCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
const JWT_SECRET = Deno.env.get('JWT_SECRET');

// Validate required environment variables
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is not set!');
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const ACCESS_TTL_SEC = 7 * 24 * 60 * 60; // 7d
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60; // 30d

function badRequest(message: string, origin?: string, status = 400) {
  return withCors(
    new Response(JSON.stringify({ success: false, message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
    origin
  );
}

function ok(data: unknown, message = 'OK', origin?: string) {
  return withCors(
    new Response(JSON.stringify({ success: true, data, message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
    origin
  );
}

function toSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

async function createToken(payload: Record<string, unknown>, ttlSec: number) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('autosaaz-admin')
    .setAudience('autosaaz-admin-client')
    .setExpirationTime(`${ttlSec}s`)
    .sign(toSecret(JWT_SECRET));
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !JWT_SECRET) {
    return badRequest('Function not configured', origin, 500);
  }

  if (req.method !== 'POST') {
    return withCors(new Response('Method Not Allowed', { status: 405 }), origin);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch },
  });

  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body) return badRequest('Invalid JSON body', origin);

  const { email, password } = body;
  if (!email || !password) {
    return badRequest('Email and password are required', origin);
  }

  // Fetch user by email
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (userErr?.code === 'PGRST116' || !user) {
    return badRequest('Invalid email or password', origin, 401);
  }

  if (userErr) {
    return badRequest('Login failed', origin, 500);
  }

  // CRITICAL: Verify user has admin role
  if (user.role !== 'admin') {
    return badRequest('Access denied. Admin privileges required.', origin, 403);
  }

  // Check lockout
  if (user.locked_until) {
    const now = new Date();
    const lockedUntil = new Date(user.locked_until);
    if (now < lockedUntil) {
      return badRequest(
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        origin,
        423
      );
    }
  }

  // Verify password
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const updates: Record<string, unknown> = {
      failed_login_attempts: attempts,
      updated_at: new Date().toISOString(),
    };

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const locked = new Date();
      locked.setMinutes(locked.getMinutes() + LOCKOUT_MINUTES);
      updates.locked_until = locked.toISOString();
    }

    await supabase.from('users').update(updates).eq('id', user.id);

    return badRequest(
      attempts >= MAX_LOGIN_ATTEMPTS
        ? 'Account locked due to multiple failed login attempts. Please try again later.'
        : 'Invalid email or password',
      origin,
      attempts >= MAX_LOGIN_ATTEMPTS ? 423 : 401
    );
  }

  // Reset failed attempts and update last login
  await supabase
    .from('users')
    .update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (user.status && user.status !== 'active') {
    return badRequest('Account is not active', origin, 403);
  }

  // Generate tokens
  let accessToken: string;
  let refreshToken: string;
  
  try {
    accessToken = await createToken(
      { userId: user.id, email: user.email, role: user.role, type: 'access' },
      ACCESS_TTL_SEC
    );
    refreshToken = await createToken({ userId: user.id, type: 'refresh' }, REFRESH_TTL_SEC);
  } catch (error) {
    console.error('Token generation failed:', error);
    return badRequest('Token generation failed: ' + (error as Error).message, origin, 500);
  }

  // Get admin profile info (if exists in garage_profiles or create minimal admin profile)
  const { data: profile } = await supabase
    .from('garage_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { password: _, ...userWithoutPassword } = user;

  return ok(
    {
      user: userWithoutPassword,
      profile: profile
        ? {
            fullName: profile.full_name,
            email: profile.email,
            phoneNumber: profile.phone_number,
            role: user.role,
          }
        : {
            fullName: userWithoutPassword.email.split('@')[0],
            email: userWithoutPassword.email,
            role: user.role,
          },
      accessToken,
      refreshToken,
    },
    'Admin login successful',
    origin
  );
});
