// @ts-nocheck
// Supabase Edge Function: auth-profile
// GET -> returns user and profile
// PUT -> updates profile fields (email, phone, language, timezone) and optional password

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';
import { handleOptions } from '../_shared/cors.ts';
import { requireAuth, ok, badRequest, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return badRequest('Function not configured', origin, 500);

  const { user, errorResponse } = await requireAuth(req, origin);
  if (!user) return errorResponse!;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });

  if (req.method === 'GET') {
    const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    const { data: profile } = await supabase.from('garage_profiles').select('*').eq('user_id', user.id).maybeSingle();
    const safeUser = dbUser ? { id: dbUser.id, email: dbUser.email, role: dbUser.role, status: dbUser.status } : { id: user.id, email: user.email, role: user.role };
    const profileDto = profile ? {
      fullName: profile.full_name,
      email: profile.email,
      phoneNumber: profile.phone_number,
      companyLegalName: profile.company_legal_name,
      status: profile.status,
      language: (profile.language || null),
      timezone: (profile.timezone || null),
    } : null;
    return ok({ user: safeUser, profile: profileDto }, 'Profile fetched', origin);
  }

  if (req.method === 'PUT') {
    const body = await req.json().catch(() => ({}));
    const email = (body.email ?? '').toString().trim().toLowerCase();
    const phone = (body.phone ?? '').toString().trim();
    const password = (body.password ?? '').toString();
    const language = (body.language ?? null) as string | null;
    const timezone = (body.timezone ?? null) as string | null;

    // Update email in users (unique check)
    if (email) {
      // Check for duplicates on other users
      const { data: dup, error: dupErr } = await supabase.from('users').select('id').eq('email', email).neq('id', user.id).maybeSingle();
      if (dup) return badRequest('Email already in use', origin, 409);
      if (dupErr && dupErr.code !== 'PGRST116') return badRequest('Failed to check email uniqueness', origin, 500);
      const { error: updUserErr } = await supabase.from('users').update({ email, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (updUserErr) return badRequest('Failed to update email', origin, 500);
    }

    // Update profile fields
    const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (email) profileUpdates.email = email;
    if (phone) profileUpdates.phone_number = phone;
    if (language !== undefined) profileUpdates.language = language;
    if (timezone !== undefined) profileUpdates.timezone = timezone;

    if (Object.keys(profileUpdates).length > 1) {
      const { error: profErr } = await supabase.from('garage_profiles').update(profileUpdates).eq('user_id', user.id);
      if (profErr) return badRequest('Failed to update profile', origin, 500);
    }

    // Optional password change
    if (password) {
      const hashed = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      const { error: passErr } = await supabase.from('users').update({ password: hashed, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (passErr) return badRequest('Failed to update password', origin, 500);
    }

    // Return fresh snapshot
    const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    const { data: profile } = await supabase.from('garage_profiles').select('*').eq('user_id', user.id).maybeSingle();
    const safeUser = dbUser ? { id: dbUser.id, email: dbUser.email, role: dbUser.role, status: dbUser.status } : { id: user.id, email: user.email, role: user.role };
    const profileDto = profile ? {
      fullName: profile.full_name,
      email: profile.email,
      phoneNumber: profile.phone_number,
      companyLegalName: profile.company_legal_name,
      status: profile.status,
      language: (profile.language || null),
      timezone: (profile.timezone || null),
    } : null;

    return ok({ user: safeUser, profile: profileDto }, 'Profile updated', origin);
  }

  return methodNotAllowed(origin);
});
