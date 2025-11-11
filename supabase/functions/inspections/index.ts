// @ts-nocheck
// Supabase Edge Function: inspections
// Handles routes under /api/inspections

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions } from '../_shared/cors.ts';
import { requireAuth, badRequest, ok, notFound, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function getPathParts(urlStr: string) {
  const url = new URL(urlStr);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex(p => p === 'inspections');
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

  const parts = getPathParts(req.url);

  try {
    // /functions/v1/inspections
    if (parts.length === 0) {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const status = url.searchParams.get('status') ?? undefined;
        const priority = url.searchParams.get('priority') ?? undefined;
        const assigned_technician = url.searchParams.get('assigned_technician') ?? undefined;
        const date_from = url.searchParams.get('date_from') ?? undefined;
        const date_to = url.searchParams.get('date_to') ?? undefined;
        const limit = parseInt(url.searchParams.get('limit') ?? '50');
        const offset = parseInt(url.searchParams.get('offset') ?? '0');

        let query = supabase
          .from('inspections')
          .select('*', { count: 'exact' })
          .eq('garage_owner_id', user.id)
          .order('inspection_date', { ascending: true });

        if (status) query = query.eq('status', status);
        if (priority) query = query.eq('priority', priority);
        if (assigned_technician) query = query.ilike('assigned_technician', `%${assigned_technician}%`);
        if (date_from) query = query.gte('inspection_date', date_from);
        if (date_to) query = query.lte('inspection_date', date_to);

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) return badRequest('Failed to fetch inspections', origin);
        return ok({ inspections: data ?? [], total: count ?? 0 }, 'Inspections fetched successfully', origin);
      }

      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        const required = ['customer_name', 'inspection_date'];
        for (const k of required) if (!body[k]) return badRequest('Customer name and inspection date are required', origin);

        // Generate inspection number like server (INSP + timestamp + rand)
        const ts = Date.now().toString().slice(-8);
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const inspection_number = `INSP${ts}${rand}`;

        const insert = {
          inspection_number,
          garage_owner_id: user.id,
          customer_name: body.customer_name,
          customer_phone: body.customer_phone ?? null,
          customer_email: body.customer_email ?? null,
          vehicle_make: body.vehicle_make ?? null,
          vehicle_model: body.vehicle_model ?? null,
          vehicle_year: body.vehicle_year ?? null,
          vehicle_plate_number: body.vehicle_plate_number ?? null,
          inspection_date: body.inspection_date,
          scheduled_time: body.scheduled_time ?? null,
          assigned_technician: body.assigned_technician ?? null,
          status: body.status ?? 'pending',
          priority: body.priority ?? 'normal',
          tasks: Array.isArray(body.tasks) ? body.tasks : [],
          findings: body.findings ?? null,
          recommendations: body.recommendations ?? null,
          internal_notes: body.internal_notes ?? null,
          estimated_cost: body.estimated_cost ?? null,
          actual_cost: body.actual_cost ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('inspections').insert([insert]).select('*').single();
        if (error) return badRequest('Failed to create inspection', origin);
        return ok(data, 'Inspection created successfully', origin);
      }

      return methodNotAllowed(origin);
    }

    // Subroutes
    if (parts[0] === 'stats' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('inspections')
        .select('status, priority, estimated_cost, actual_cost')
        .eq('garage_owner_id', user.id);
      if (error) return badRequest('Failed to fetch inspection statistics', origin);
      const rows = data ?? [];
      const stats: any = {
        totalInspections: rows.length,
        statusBreakdown: { pending: 0, in_progress: 0, completed: 0, cancelled: 0 },
        priorityBreakdown: { low: 0, normal: 0, high: 0, urgent: 0 },
        totalRevenue: 0,
        averageInspectionValue: 0,
        completedInspections: 0,
        pendingInspections: 0,
      };
      let totalValue = 0;
      for (const r of rows) {
        stats.statusBreakdown[r.status] = (stats.statusBreakdown[r.status] ?? 0) + 1;
        stats.priorityBreakdown[r.priority] = (stats.priorityBreakdown[r.priority] ?? 0) + 1;
        const cost = r.actual_cost ?? r.estimated_cost ?? 0;
        totalValue += cost;
      }
      stats.completedInspections = stats.statusBreakdown['completed'];
      stats.pendingInspections = stats.statusBreakdown['pending'];
      stats.totalRevenue = totalValue;
      stats.averageInspectionValue = rows.length > 0 ? totalValue / rows.length : 0;
      return ok(stats, 'Inspection statistics fetched successfully', origin);
    }

    // /functions/v1/inspections/:id and actions
    const id = parts[0];
    if (parts.length === 1) {
      if (req.method === 'GET') {
        // Support lookup by UUID or inspection_number
        let resp = await supabase
          .from('inspections')
          .select('*')
          .eq('id', id)
          .eq('garage_owner_id', user.id)
          .maybeSingle();
        if (!resp.data) {
          resp = await supabase
            .from('inspections')
            .select('*')
            .eq('inspection_number', id)
            .eq('garage_owner_id', user.id)
            .maybeSingle();
        }
        if (resp.error) return badRequest('Failed to fetch inspection', origin);
        if (!resp.data) return notFound('Inspection not found', origin);
        return ok(resp.data, 'Inspection fetched successfully', origin);
      }
      if (req.method === 'PATCH') {
        const updates = await req.json().catch(() => ({}));
        const { data, error } = await supabase
          .from('inspections')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('garage_owner_id', user.id)
          .select('*')
          .maybeSingle();
        if (error) return badRequest('Failed to update inspection', origin);
        if (!data) return notFound('Inspection not found', origin);
        return ok(data, 'Inspection updated successfully', origin);
      }
      if (req.method === 'DELETE') {
        const { error } = await supabase
          .from('inspections')
          .delete()
          .eq('id', id)
          .eq('garage_owner_id', user.id);
        if (error) return badRequest('Failed to delete inspection', origin);
        return ok(null, 'Inspection deleted successfully', origin);
      }
      return methodNotAllowed(origin);
    }

    if (parts.length === 2 && parts[1] === 'complete' && req.method === 'PATCH') {
      const body = await req.json().catch(() => ({}));
      const updates: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (body.findings !== undefined) updates.findings = body.findings;
      if (body.recommendations !== undefined) updates.recommendations = body.recommendations;
      if (body.actual_cost !== undefined) updates.actual_cost = body.actual_cost;

      // Accept either UUID id or inspection_number in the URL param
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let targetId: string | null = null;

      if (uuidRegex.test(id)) {
        // Only try UUID lookup when it looks like a UUID to avoid Postgres uuid errors
        const byUuid = await supabase
          .from('inspections')
          .select('id')
          .eq('id', id)
          .eq('garage_owner_id', user.id)
          .maybeSingle();
        if (byUuid.data?.id) targetId = byUuid.data.id;
      }

      if (!targetId) {
        // Try by inspection_number (handles values like IN-3101)
        const byNumber = await supabase
          .from('inspections')
          .select('id')
          .eq('inspection_number', id)
          .eq('garage_owner_id', user.id)
          .maybeSingle();
        if (byNumber.data?.id) targetId = byNumber.data.id;
      }

      if (!targetId) return notFound('Inspection not found', origin);

      const { data, error } = await supabase
        .from('inspections')
        .update(updates)
        .eq('id', targetId)
        .eq('garage_owner_id', user.id)
        .select('*')
        .maybeSingle();
      if (error) return badRequest('Failed to complete inspection', origin);
      if (!data) return notFound('Inspection not found', origin);
      return ok(data, 'Inspection completed successfully', origin);
    }

    return methodNotAllowed(origin);
  } catch (e) {
    return badRequest('Internal error', origin, 500);
  }
});
