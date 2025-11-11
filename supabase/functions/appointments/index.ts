// @ts-nocheck
// Supabase Edge Function: appointments
// Handles routes under /api/appointments

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions } from '../_shared/cors.ts';
import { requireAuth, badRequest, ok, notFound, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function getPathParts(urlStr: string) {
  const url = new URL(urlStr);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex(p => p === 'appointments');
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

  try {
    // /functions/v1/appointments
    if (parts.length === 0) {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const status = url.searchParams.get('status') ?? undefined;
        const priority = url.searchParams.get('priority') ?? undefined;
        const service_type = url.searchParams.get('service_type') ?? undefined;
        const date_from = url.searchParams.get('date_from') ?? undefined;
        const date_to = url.searchParams.get('date_to') ?? undefined;
        const search = url.searchParams.get('search') ?? undefined;
        const limit = parseInt(url.searchParams.get('limit') ?? '50');
        const offset = parseInt(url.searchParams.get('offset') ?? '0');

        let query = supabase.from('appointments').select('*', { count: 'exact' }).eq('garage_owner_id', user.id).order('appointment_date', { ascending: true });
        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (service_type) query = query.ilike('service_type', `%${service_type}%`);
        if (date_from) query = query.gte('appointment_date', date_from);
        if (date_to) query = query.lte('appointment_date', date_to);
        if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,vehicle_make.ilike.%${search}%,vehicle_model.ilike.%${search}%,vehicle_plate_number.ilike.%${search}%`);
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) return badRequest('Failed to fetch appointments', origin);
        return ok({ appointments: data ?? [], total: count ?? 0 }, 'Appointments fetched successfully', origin);
      }
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        const required = ['customer_name', 'customer_phone', 'service_type', 'appointment_date'];
        for (const k of required) if (!body[k]) return badRequest('Customer name, phone, service type, and appointment date are required', origin);

        // Generate appointment number like server (APT + timestamp + rand)
        const ts = Date.now().toString().slice(-8);
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const appointment_number = `APT${ts}${rand}`;

        const insert = {
          appointment_number,
          garage_owner_id: user.id,
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          customer_email: body.customer_email ?? null,
          vehicle_make: body.vehicle_make ?? null,
          vehicle_model: body.vehicle_model ?? null,
          vehicle_year: body.vehicle_year ?? null,
          vehicle_plate_number: body.vehicle_plate_number ?? null,
          service_type: body.service_type,
          service_description: body.service_description ?? null,
          appointment_date: body.appointment_date,
          scheduled_time: body.scheduled_time ?? null,
          status: 'pending',
          priority: body.priority ?? 'normal',
          estimated_duration: body.estimated_duration ?? null,
          estimated_cost: body.estimated_cost ?? null,
          notes: body.notes ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from('appointments').insert([insert]).select('*').single();
        if (error) return badRequest('Failed to create appointment', origin);
        return ok(data, 'Appointment created successfully', origin);
      }
      return methodNotAllowed(origin);
    }

    // Subroutes
    if (parts[0] === 'upcoming' && req.method === 'GET') {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') ?? '10');
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('garage_owner_id', user.id)
        .gte('appointment_date', now)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .limit(limit);
      if (error) return badRequest('Failed to fetch upcoming appointments', origin);
      return ok(data ?? [], 'Upcoming appointments fetched successfully', origin);
    }
    if (parts[0] === 'stats' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('appointments')
        .select('status, priority, estimated_cost, actual_cost')
        .eq('garage_owner_id', user.id);
      if (error) return badRequest('Failed to fetch appointment statistics', origin);
      const appts = data ?? [];
      const stats: any = {
        totalAppointments: appts.length,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        statusBreakdown: { pending: 0, confirmed: 0, in_progress: 0, completed: 0, cancelled: 0, no_show: 0 },
        priorityBreakdown: { low: 0, normal: 0, high: 0, urgent: 0 },
        averageAppointmentValue: 0,
        totalRevenue: 0,
      };
      let totalValue = 0;
      for (const a of appts) {
        stats.statusBreakdown[a.status] = (stats.statusBreakdown[a.status] ?? 0) + 1;
        stats.priorityBreakdown[a.priority] = (stats.priorityBreakdown[a.priority] ?? 0) + 1;
        const cost = a.actual_cost ?? a.estimated_cost ?? 0;
        totalValue += cost;
      }
      stats.pendingAppointments = stats.statusBreakdown['pending'];
      stats.confirmedAppointments = stats.statusBreakdown['confirmed'];
      stats.completedAppointments = stats.statusBreakdown['completed'];
      stats.cancelledAppointments = stats.statusBreakdown['cancelled'];
      stats.noShowAppointments = stats.statusBreakdown['no_show'];
      stats.totalRevenue = totalValue;
      stats.averageAppointmentValue = appts.length > 0 ? totalValue / appts.length : 0;
      return ok(stats, 'Appointment statistics fetched successfully', origin);
    }

    // /functions/v1/appointments/:id and actions
    const id = parts[0];
    if (parts.length === 1) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('appointments').select('*').eq('id', id).eq('garage_owner_id', user.id).maybeSingle();
        if (error) return badRequest('Failed to fetch appointment', origin);
        if (!data) return notFound('Appointment not found', origin);
        return ok(data, 'Appointment fetched successfully', origin);
      }
      if (req.method === 'PATCH') {
        const updates = await req.json().catch(() => ({}));
        const { data, error } = await supabase.from('appointments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('garage_owner_id', user.id).select('*').maybeSingle();
        if (error) return badRequest('Failed to update appointment', origin);
        if (!data) return notFound('Appointment not found', origin);
        return ok(data, 'Appointment updated successfully', origin);
      }
      if (req.method === 'DELETE') {
        const { error } = await supabase.from('appointments').delete().eq('id', id).eq('garage_owner_id', user.id);
        if (error) return badRequest('Failed to delete appointment', origin);
        return ok(null, 'Appointment deleted successfully', origin);
      }
      return methodNotAllowed(origin);
    }

    if (parts.length === 2 && parts[1] === 'accept' && req.method === 'POST') {
      const { data, error } = await supabase.from('appointments').update({ status: 'confirmed', updated_at: new Date().toISOString() }).eq('id', id).eq('garage_owner_id', user.id).select('*').maybeSingle();
      if (error) return badRequest('Failed to accept appointment', origin);
      if (!data) return notFound('Appointment not found', origin);
      return ok(data, 'Appointment accepted successfully', origin);
    }
    if (parts.length === 2 && parts[1] === 'cancel' && req.method === 'POST') {
      const { data, error } = await supabase.from('appointments').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id).eq('garage_owner_id', user.id).select('*').maybeSingle();
      if (error) return badRequest('Failed to cancel appointment', origin);
      if (!data) return notFound('Appointment not found', origin);
      return ok(data, 'Appointment cancelled successfully', origin);
    }

    return methodNotAllowed(origin);
  } catch (e) {
    return badRequest('Internal error', origin, 500);
  }
});
