// @ts-nocheck
// Supabase Edge Function: bookings
// Handles routes under /api/bookings and some dashboard endpoints used via booking routes

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions, withCors } from '../_shared/cors.ts';
import { requireAuth, badRequest, ok, notFound, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function generateBookingNumber(): string {
  const prefix = 'BK';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

function getPathParts(urlStr: string) {
  const url = new URL(urlStr);
  const parts = url.pathname.split('/').filter(Boolean);
  // function path is .../functions/v1/bookings[/...]
  const idx = parts.findIndex(p => p === 'bookings');
  return idx >= 0 ? parts.slice(idx + 1) : [];
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') return handleOptions(req);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return badRequest('Function not configured', origin, 500);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch } });
  const { user, errorResponse } = await requireAuth(req, origin);
  if (!user) return errorResponse!;

  const parts = getPathParts(req.url);

  // Helpers
  const getById = async (id: string) => {
    const cleanId = id.replace('#', '');
    // Try UUID first
    let resp = await supabase.from('bookings').select('*').eq('id', cleanId).eq('garage_id', user.id).maybeSingle();
    if (!resp.data) {
      resp = await supabase.from('bookings').select('*').eq('booking_number', cleanId).eq('garage_id', user.id).maybeSingle();
    }
    return resp.data as any | null;
  };

  try {
    // /functions/v1/bookings
    if (parts.length === 0) {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const status = url.searchParams.get('status') ?? undefined;
        const service_type = url.searchParams.get('service_type') ?? undefined;
        const payment_status = url.searchParams.get('payment_status') ?? undefined;
        const date_from = url.searchParams.get('date_from') ?? undefined;
        const date_to = url.searchParams.get('date_to') ?? undefined;
        const search = url.searchParams.get('search') ?? undefined;
        const limit = parseInt(url.searchParams.get('limit') ?? '50');
        const offset = parseInt(url.searchParams.get('offset') ?? '0');

        let query = supabase.from('bookings').select('*', { count: 'exact' }).eq('garage_id', user.id);
        if (status) query = query.eq('status', status);
        if (service_type) query = query.eq('service_type', service_type);
        if (payment_status) query = query.eq('payment_status', payment_status);
        if (date_from) query = query.gte('booking_date', date_from);
        if (date_to) query = query.lte('booking_date', date_to);
        if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,booking_number.ilike.%${search}%`);
        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) return badRequest('Failed to fetch bookings', origin);
        return ok({ bookings: data ?? [], total: count ?? 0 }, 'Bookings fetched successfully', origin);
      }
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        const required = ['customer_name', 'customer_phone', 'service_type', 'booking_date'];
        for (const k of required) if (!body[k]) return badRequest('Customer name, phone, service type, and booking date are required', origin);

        const booking_number = generateBookingNumber();
        const insert = {
          booking_number,
          garage_id: user.id,
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          customer_email: body.customer_email ?? null,
          service_type: body.service_type,
          service_description: body.service_description ?? null,
          booking_date: body.booking_date,
          scheduled_time: body.scheduled_time ?? null,
          vehicle_make: body.vehicle_make ?? null,
          vehicle_model: body.vehicle_model ?? null,
          vehicle_year: body.vehicle_year ?? null,
          vehicle_plate_number: body.vehicle_plate_number ?? null,
          estimated_cost: body.estimated_cost ?? null,
          notes: body.notes ?? null,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('bookings').insert([insert]).select('*').single();
        if (error) return badRequest('Failed to create booking', origin);
        return withCors(new Response(JSON.stringify({ success: true, data, message: 'Booking created successfully' }), { status: 201, headers: { 'Content-Type': 'application/json' } }), origin);
      }
      return methodNotAllowed(origin);
    }

    // /functions/v1/bookings/:id
    if (parts.length >= 1) {
      const id = parts[0];
      if (req.method === 'GET') {
        const booking = await getById(id);
        if (!booking) return notFound('Booking not found', origin);
        return ok(booking, 'Booking fetched successfully', origin);
      }
      if (req.method === 'PATCH') {
        const exists = await getById(id);
        if (!exists) return notFound('Booking not found', origin);
        const updates = await req.json().catch(() => ({}));
        const { data, error } = await supabase.from('bookings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', exists.id).eq('garage_id', user.id).select('*').single();
        if (error) return badRequest('Failed to update booking', origin);
        return ok(data, 'Booking updated successfully', origin);
      }
      if (req.method === 'DELETE') {
        const exists = await getById(id);
        if (!exists) return notFound('Booking not found', origin);
        const { error } = await supabase.from('bookings').delete().eq('id', exists.id).eq('garage_id', user.id);
        if (error) return badRequest('Failed to delete booking', origin);
        return ok(null, 'Booking deleted successfully', origin);
      }
      return methodNotAllowed(origin);
    }

    return methodNotAllowed(origin);
  } catch (e) {
    return badRequest('Internal error', origin, 500);
  }
});
