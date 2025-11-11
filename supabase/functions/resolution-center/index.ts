// @ts-nocheck
// Supabase Edge Function: resolution-center
// Endpoints for dispute tickets and messages between admin and garage owner

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions } from '../_shared/cors.ts';
import { requireAuth, ok, badRequest, notFound, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function partsAfterSlug(urlStr: string, slug: string) {
  const u = new URL(urlStr);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex(p => p === slug);
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return badRequest('Function not configured', origin, 500);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch },
  });

  const { user, errorResponse } = await requireAuth(req, origin);
  if (!user) return errorResponse!;

  const parts = partsAfterSlug(req.url, 'resolution-center');

  try {
    // GET /resolution-center?status=new|resolved
    if (parts.length === 0 && req.method === 'GET') {
      const url = new URL(req.url);
      const status = (url.searchParams.get('status') || 'new').toLowerCase();
      // new => open/in_progress; resolved => resolved/closed
      const unresolved = ['open', 'in_progress'];
      const resolved = ['resolved', 'closed'];

      const { data: tickets, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('garage_id', user.id)
        .in('status', status === 'resolved' ? resolved : unresolved)
        .order('created_at', { ascending: false });
      if (error) return badRequest('Failed to load disputes', origin);

      // Optionally include count of messages
      const ids = (tickets || []).map(t => t.id);
      const countsMap: Record<string, number> = {};
      if (ids.length) {
        const { data: msgs, error: cntErr } = await supabase
          .from('dispute_messages')
          .select('ticket_id')
          .in('ticket_id', ids);
        if (!cntErr && Array.isArray(msgs)) {
          for (const m of msgs) {
            countsMap[m.ticket_id] = (countsMap[m.ticket_id] || 0) + 1;
          }
        }
      }

      const payload = (tickets || []).map(t => ({
  id: t.id,
  code: (t as any).code,
        disputeId: t.id, // expose id directly; UI can label as needed
        customerName: t.contact_name,
        customerEmail: t.contact_email,
        subject: t.subject,
        raisedAt: t.created_at,
        status: t.status,
        messageCount: countsMap[t.id] || 0,
        resolution: t.status === 'resolved' || t.status === 'closed' ? t.message : null,
        resolvedAt: (t.status === 'resolved' || t.status === 'closed') ? t.updated_at : null,
      }));

      return ok(payload, 'Disputes fetched', origin);
    }

    // POST /resolution-center -> create a new dispute (garage)
  if (parts.length === 0 && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const subject = (body.subject || '').toString().trim();
      const initialMessage = (body.message || body.initialMessage || '').toString().trim();
      let contactName = (body.contactName || '').toString().trim();
      let contactEmail = (body.contactEmail || '').toString().trim();
      if (!subject) return badRequest('Subject is required', origin);

      // Fallback contact email from users table if not provided
      if (!contactEmail) {
        try {
          const { data: adminRes } = await supabase.auth.admin.getUserById(user.id);
          contactEmail = adminRes?.user?.email || '';
          // Try name from metadata
          const metaName = (adminRes?.user?.user_metadata?.full_name || adminRes?.user?.user_metadata?.name || '').toString().trim();
          if (!contactName && metaName) contactName = metaName;
        } catch (_) {
          // ignore
        }
      }
      if (!contactName) {
        // Derive a simple name from email if available
        const local = contactEmail?.split('@')[0] || 'Garage User';
        contactName = local.charAt(0).toUpperCase() + local.slice(1);
      }
      if (!contactEmail) contactEmail = 'unknown@autosaaz.local';

      const now = new Date().toISOString();
      const insertTicket = {
        garage_id: user.id,
        subject,
        contact_name: contactName,
        contact_email: contactEmail,
        status: 'open',
        message: initialMessage || subject,
        created_at: now,
        updated_at: now,
      } as any;

      const { data: ticket, error: insErr } = await supabase
        .from('disputes')
        .insert([insertTicket])
        .select('*')
        .single();
      if (insErr) return badRequest('Failed to create dispute', origin);

      if (initialMessage) {
        await supabase
          .from('dispute_messages')
          .insert([{ ticket_id: ticket.id, sender_id: user.id, body: initialMessage, created_at: now, updated_at: now }]);
      }

      const payload = {
        id: ticket.id,
        code: ticket.code,
        disputeId: ticket.id,
        customerName: ticket.contact_name,
        customerEmail: ticket.contact_email,
        subject: ticket.subject,
        raisedAt: ticket.created_at,
        status: ticket.status,
      };

      return ok(payload, 'Dispute created', origin, 201);
    }

    // GET /resolution-center/:id -> ticket + messages
    if (parts.length === 1 && req.method === 'GET') {
      const id = parts[0];
      const { data: ticket } = await supabase
        .from('disputes')
        .select('*')
        .eq('id', id)
        .eq('garage_id', user.id)
        .single();
      if (!ticket) return notFound('Dispute not found', origin);

      const { data: msgs } = await supabase
        .from('dispute_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      const detail = {
  id: ticket.id,
  code: ticket.code,
        disputeId: ticket.id,
        customerName: ticket.contact_name,
        customerEmail: ticket.contact_email,
        subject: ticket.subject,
        raisedAt: ticket.created_at,
        status: ticket.status,
        resolution: (ticket.status === 'resolved' || ticket.status === 'closed') ? ticket.message : null,
        resolvedAt: (ticket.status === 'resolved' || ticket.status === 'closed') ? ticket.updated_at : null,
        messages: (msgs || []).map((m: any) => ({
          id: m.id,
          from: m.sender_id === user.id ? 'customer' : 'admin',
          text: m.body,
          ts: m.created_at,
        })),
      };

      return ok(detail, 'Dispute fetched', origin);
    }

    // POST /resolution-center/:id/messages -> add a message (from garage)
    if (parts.length === 2 && parts[1] === 'messages' && req.method === 'POST') {
      const id = parts[0];
      const body = await req.json().catch(() => ({}));
      const text = (body.text || body.message || '').toString().trim();
      if (!text) return badRequest('Message text is required', origin);

      // Ensure ticket belongs to this garage
      const { data: ticket } = await supabase
        .from('disputes')
        .select('id')
        .eq('id', id)
        .eq('garage_id', user.id)
        .single();
      if (!ticket) return notFound('Dispute not found', origin);

      const now = new Date().toISOString();
      const insert = { ticket_id: id, sender_id: user.id, body: text, created_at: now, updated_at: now };
      const { data: msg, error } = await supabase
        .from('dispute_messages')
        .insert([insert])
        .select('*')
        .single();
      if (error) return badRequest('Failed to send message', origin);

      return ok({ id: msg.id, from: 'customer', text: msg.body, ts: msg.created_at }, 'Message sent', origin);
    }

    // PUT /resolution-center/:id/resolve -> resolve a ticket with a note
    if (parts.length === 2 && parts[1] === 'resolve' && req.method === 'PUT') {
      const id = parts[0];
      const body = await req.json().catch(() => ({}));
      const resolution = (body.resolution || body.note || body.message || '').toString().trim();
      if (!resolution) return badRequest('Resolution note is required', origin);

      // Ensure ticket belongs to this garage
      const { data: ticket } = await supabase
        .from('disputes')
        .select('*')
        .eq('id', id)
        .eq('garage_id', user.id)
        .single();
      if (!ticket) return notFound('Dispute not found', origin);

      const now = new Date().toISOString();

      // Update ticket status and resolution message
      const { data: updated, error: updErr } = await supabase
        .from('disputes')
        .update({ status: 'resolved', message: resolution, updated_at: now })
        .eq('id', id)
        .eq('garage_id', user.id)
        .select('*')
        .single();
      if (updErr) return badRequest('Failed to resolve dispute', origin);

      // Append resolution as a message in the thread for audit trail
      await supabase
        .from('dispute_messages')
        .insert([{ ticket_id: id, sender_id: user.id, body: `Resolution: ${resolution}`, created_at: now, updated_at: now }]);

      const payload = {
        id: updated.id,
        code: updated.code,
        disputeId: updated.id,
        customerName: updated.contact_name,
        customerEmail: updated.contact_email,
        subject: updated.subject,
        raisedAt: updated.created_at,
        status: updated.status,
        resolution: updated.message,
        resolvedAt: updated.updated_at,
      };

      return ok(payload, 'Dispute resolved', origin);
    }

    return methodNotAllowed(origin);
  } catch (e) {
    return badRequest('Internal error', origin, 500);
  }
});
