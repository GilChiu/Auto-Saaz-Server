// @ts-nocheck
// Supabase Edge Function: auth-me
// Returns the current authenticated user based on x-autosaaz-token

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions } from '../_shared/cors.ts';
import { requireAuth, ok, badRequest, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return badRequest('Function not configured', origin, 500);
  if (req.method !== 'GET') return methodNotAllowed(origin);

  const { user, errorResponse } = await requireAuth(req, origin);
  if (!user) return errorResponse!;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });

  // Load user and profile data
  const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
  const { data: profile } = await supabase.from('garage_profiles').select('*').eq('user_id', user.id).maybeSingle();

  const safeUser = dbUser ? { id: dbUser.id, email: dbUser.email, role: dbUser.role, status: dbUser.status } : { id: user.id, email: user.email, role: user.role };
  const profileDto = profile ? {
    fullName: profile.full_name,
    email: profile.email,
    phoneNumber: profile.phone_number,
    companyLegalName: profile.company_legal_name,
    status: profile.status,
  } : null;

  return ok({ user: safeUser, profile: profileDto }, 'Current user', origin);
});
