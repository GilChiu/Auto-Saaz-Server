// @ts-nocheck
// Supabase Edge Function: support-tickets
// POST /support-tickets -> create a support ticket for the authenticated garage user

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions, withCors } from '../_shared/cors.ts';
import { requireAuth, badRequest, ok, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return badRequest('Function not configured', origin, 500);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch },
  });

  // Only POST is supported for now
  if (req.method !== 'POST') return methodNotAllowed(origin);

  // Require application access token
  const { user, errorResponse } = await requireAuth(req, origin);
  if (!user) return errorResponse!;

  try {
    const body = await req.json().catch(() => ({}));
    const contact_name = (body.contactName || body.name || '').toString().trim();
    const contact_email = (body.contactEmail || body.email || '').toString().trim();
    const subject = (body.subject || '').toString().trim();
    const message = (body.message || '').toString().trim();
    const source = (body.source || 'garage-portal').toString().trim();

    if (!contact_name || !contact_email || !subject || !message) {
      return badRequest('Name, email, subject, and message are required', origin);
    }

    const now = new Date().toISOString();
    const insert = {
      garage_id: user.id,
      contact_name,
      contact_email,
      subject,
      message,
      source,
      status: 'open',
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([insert])
      .select('*')
      .single();

    if (error) {
      return badRequest('Failed to create support ticket', origin);
    }

    return withCors(
      new Response(
        JSON.stringify({ success: true, data, message: 'Support ticket created successfully' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      ),
      origin
    );
  } catch (e) {
    return badRequest('Internal error', origin, 500);
  }
});
