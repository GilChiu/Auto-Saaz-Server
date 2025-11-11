// @ts-nocheck
// Supabase Edge Function: chats
// Handles conversation and message APIs for web/mobile chat

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions } from '../_shared/cors.ts';
import { requireAuth, badRequest, ok, notFound, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function partsAfterSlug(urlStr: string, slug: string) {
  const u = new URL(urlStr);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex(p => p === slug);
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

async function ensureParticipant(supabase: any, conversationId: string, userId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('id, last_read_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { ok: false, error };
  if (!data) return { ok: false, error: { message: 'Not a participant' } };
  return { ok: true, participant: data };
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

  const parts = partsAfterSlug(req.url, 'chats');

  try {
    // /functions/v1/chats/conversations
    if (parts.length >= 1 && parts[0] === 'conversations') {
      // GET /conversations -> list conversations for current user
      if (parts.length === 1 && req.method === 'GET') {
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') ?? '20');
        const offset = parseInt(url.searchParams.get('offset') ?? '0');

        const { data: memberships, error: memErr } = await supabase
          .from('conversation_participants')
          .select('conversation_id, last_read_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (memErr) return badRequest('Failed to load conversations', origin);
        const convIds = (memberships || []).map((m: any) => m.conversation_id);
        if (convIds.length === 0) return ok({ conversations: [], total: 0 }, 'No conversations', origin);

        const { data: convs, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .in('id', convIds);
        if (convErr) return badRequest('Failed to load conversations', origin);

        // Get last message per conversation
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false });
        const lastMap: Record<string, any> = {};
        (msgs || []).forEach((m: any) => { if (!lastMap[m.conversation_id]) lastMap[m.conversation_id] = m; });

        // Fetch participants for each conversation
        const { data: parts } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, role')
          .in('conversation_id', convIds);
        const convToParts: Record<string, any[]> = {};
        const userIds = new Set<string>();
        (parts || []).forEach((p: any) => {
          convToParts[p.conversation_id] = convToParts[p.conversation_id] || [];
          convToParts[p.conversation_id].push(p);
          userIds.add(p.user_id);
        });

        // Try to enrich with customer profile names; fallback to users.email if needed
        const uidArr = Array.from(userIds);
        const namesMap: Record<string, { name?: string; email?: string }> = {};
        if (uidArr.length > 0) {
          const { data: profiles } = await supabase
            .from('customer_profiles')
            .select('user_id, full_name')
            .in('user_id', uidArr);
          (profiles || []).forEach((r: any) => {
            namesMap[r.user_id] = { ...(namesMap[r.user_id] || {}), name: r.full_name };
          });
          const { data: usersList } = await supabase
            .from('users')
            .select('id, email')
            .in('id', uidArr);
          (usersList || []).forEach((u: any) => {
            namesMap[u.id] = { ...(namesMap[u.id] || {}), email: u.email };
          });
        }

        // Compute unread counts per conversation
        const results: any[] = [];
        for (const m of memberships) {
          const convId = m.conversation_id;
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .gt('created_at', m.last_read_at || '1970-01-01')
            .neq('sender_id', user.id);
          const participants = (convToParts[convId] || []).map((p: any) => ({
            user_id: p.user_id,
            role: p.role,
            name: namesMap[p.user_id]?.name || namesMap[p.user_id]?.email || undefined,
          }));
          results.push({
            conversation: convs.find((c: any) => c.id === convId),
            lastMessage: lastMap[convId] || null,
            unreadCount: count || 0,
            participants,
          });
        }

        return ok({ conversations: results, total: results.length }, 'Conversations fetched', origin);
      }

      // POST /conversations -> create or get a conversation with another user
      if (parts.length === 1 && req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        const otherUserId = body.otherUserId as string | undefined; // required if pairing users directly
        if (!otherUserId) return badRequest('otherUserId is required', origin);

        // Find existing conversation that includes both users
        const { data: myConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);
        const myIds = new Set((myConvs || []).map((r: any) => r.conversation_id));
        const { data: theirConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId);
        const existing = (theirConvs || []).find((r: any) => myIds.has(r.conversation_id));
        if (existing) {
          const { data: conv } = await supabase.from('conversations').select('*').eq('id', existing.conversation_id).single();
          return ok(conv, 'Conversation already exists', origin);
        }

        // Create conversation
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert([{ created_by: user.id, last_message_at: null }])
          .select('*')
          .single();
        if (convErr) return badRequest('Failed to create conversation', origin);

        // Add both participants
        const inserts = [
          { conversation_id: conv.id, user_id: user.id, role: 'garage_owner', last_read_at: new Date().toISOString() },
          { conversation_id: conv.id, user_id: otherUserId, role: 'mobile_user', last_read_at: null },
        ];
        const { error: partErr } = await supabase.from('conversation_participants').insert(inserts);
        if (partErr) return badRequest('Failed to add participants', origin);

        return ok(conv, 'Conversation created', origin);
      }

      // GET /conversations/:id -> basic conversation info (and participants)
      if (parts.length === 2 && req.method === 'GET') {
        const id = parts[1];
        const check = await ensureParticipant(supabase, id, user.id);
        if (!check.ok) return notFound('Conversation not found', origin);

        const { data: conv } = await supabase.from('conversations').select('*').eq('id', id).single();
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id, role, last_read_at')
          .eq('conversation_id', id);
        return ok({ ...conv, participants }, 'Conversation fetched', origin);
      }

      // GET/POST under /conversations/:id/messages
      if (parts.length >= 2 && parts[2] === 'messages') {
        const id = parts[1];
        const check = await ensureParticipant(supabase, id, user.id);
        if (!check.ok) return notFound('Conversation not found', origin);

        if (req.method === 'GET') {
          const url = new URL(req.url);
          const limit = parseInt(url.searchParams.get('limit') ?? '50');
          const before = url.searchParams.get('before') ?? undefined;
          const after = url.searchParams.get('after') ?? undefined;

          let query = supabase.from('messages').select('*').eq('conversation_id', id);
          if (before) query = query.lt('created_at', before);
          if (after) query = query.gt('created_at', after);
          query = query.order('created_at', { ascending: true }).limit(limit);

          const { data, error } = await query;
          if (error) return badRequest('Failed to fetch messages', origin);
          return ok({ messages: data ?? [] }, 'Messages fetched', origin);
        }

        if (req.method === 'POST') {
          const body = await req.json().catch(() => ({}));
          const content = body.content as string | undefined;
          const attachment_url = body.attachment_url as string | undefined;
          const message_type = (body.message_type as string | undefined) || (attachment_url ? 'file' : 'text');
          if (!content && !attachment_url) return badRequest('content or attachment_url is required', origin);

          const now = new Date().toISOString();
          const insert = {
            conversation_id: id,
            sender_id: user.id,
            message_type,
            content: content ?? null,
            attachment_url: attachment_url ?? null,
            created_at: now,
            updated_at: now,
          };
          const { data: msg, error } = await supabase.from('messages').insert([insert]).select('*').single();
          if (error) return badRequest('Failed to send message', origin);

          await supabase.from('conversations').update({ last_message_at: now }).eq('id', id);
          await supabase
            .from('conversation_participants')
            .update({ last_read_at: now })
            .eq('conversation_id', id)
            .eq('user_id', user.id);

          return ok(msg, 'Message sent', origin);
        }

        return methodNotAllowed(origin);
      }

      // POST /conversations/:id/read -> mark as read up to now
      if (parts.length === 3 && parts[2] === 'read' && req.method === 'POST') {
        const id = parts[1];
        const check = await ensureParticipant(supabase, id, user.id);
        if (!check.ok) return notFound('Conversation not found', origin);

        const body = await req.json().catch(() => ({}));
        const upTo = (body.upTo as string | undefined) || new Date().toISOString();
        const { error } = await supabase
          .from('conversation_participants')
          .update({ last_read_at: upTo })
          .eq('conversation_id', id)
          .eq('user_id', user.id);
        if (error) return badRequest('Failed to mark read', origin);
        return ok({ last_read_at: upTo }, 'Marked as read', origin);
      }

      return methodNotAllowed(origin);
    }

    return methodNotAllowed(origin);
  } catch (e) {
    return badRequest('Internal error', origin, 500);
  }
});
