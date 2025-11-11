// @ts-nocheck
// Supabase Edge Function: auth-register-step1
// Mirrors Express endpoint POST /api/auth/register/step1

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders, handleOptions, withCors } from '../_shared/cors.ts';

// Env provided by Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function badRequest(message: string, origin?: string) {
  return withCors(new Response(JSON.stringify({ success: false, message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  }), origin);
}

function conflict(message: string, origin?: string) {
  return withCors(new Response(JSON.stringify({ success: false, message }), {
    status: 409,
    headers: { 'Content-Type': 'application/json' },
  }), origin);
}

function created(data: unknown, message = 'OK', origin?: string) {
  return withCors(new Response(JSON.stringify({ success: true, data, message }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  }), origin);
}

function serverError(message = 'Internal server error', origin?: string, extra?: unknown) {
  return withCors(new Response(JSON.stringify({ success: false, message, ...(extra ? { error: extra } : {}) }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  }), origin);
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return serverError('Function not configured', origin);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch },
    });

    if (req.method !== 'POST') {
      return withCors(new Response('Method Not Allowed', { status: 405 }), origin);
    }

    const body = await req.json().catch((e) => {
      console.error('JSON parse error', e);
      return null;
    }) as {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
    } | null;

    if (!body) return badRequest('Invalid JSON body', origin);

    const { fullName, email, phoneNumber } = body;

    if (!fullName || !email || !phoneNumber) {
      return badRequest('Full name, email, and phone number are required', origin);
    }

    // Check if email already exists in custom users table
    const { data: existingUsers, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (userCheckError) {
      console.error('Error checking existing user:', userCheckError);
      return serverError('Registration failed (check user)', origin, userCheckError);
    }

    if (existingUsers && existingUsers.length > 0) {
      return conflict('Email already registered', origin);
    }

    // Create registration session
    const sessionId = generateSessionId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: insertError } = await supabase.from('registration_sessions').insert([
      {
        session_id: sessionId,
        email: email.toLowerCase(),
        phone_number: phoneNumber,
        full_name: fullName,
        step_completed: 1,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error('Error creating registration session:', insertError);
      return serverError('Failed to create registration session', origin, insertError);
    }

    return created(
      {
        sessionId,
        expiresAt: expiresAt.toISOString(),
        nextStep: 2,
      },
      'Personal information saved. Please continue to business location.',
      origin,
    );
  } catch (err) {
    console.error('Unhandled error:', err);
    return serverError('Registration failed', req.headers.get('origin') || '*');
  }
});
