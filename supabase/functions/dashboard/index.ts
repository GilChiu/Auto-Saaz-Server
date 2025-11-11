// @ts-nocheck
// Supabase Edge Function: dashboard
// Handles /api/dashboard endpoints: /stats, /booking-stats, /appointment-stats

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { handleOptions } from '../_shared/cors.ts';
import { requireAuth, badRequest, ok, methodNotAllowed } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');

function getPathParts(urlStr: string) {
  const url = new URL(urlStr);
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.findIndex(p => p === 'dashboard');
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
    if (parts.length === 1 && parts[0] === 'booking-stats' && req.method === 'GET') {
      const { data, error } = await supabase.from('bookings').select('status, actual_cost').eq('garage_id', user.id);
      if (error) return badRequest('Failed to fetch booking statistics', origin);
      const bookings = data ?? [];
      const stats: any = {
        total_bookings: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        in_progress: bookings.filter(b => b.status === 'in_progress').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
        total_revenue: bookings.filter(b => b.actual_cost).reduce((sum, b) => sum + (b.actual_cost || 0), 0),
        avg_service_cost: 0,
      };
      if (stats.completed > 0) stats.avg_service_cost = stats.total_revenue / stats.completed;
      return ok(stats, 'Booking statistics fetched successfully', origin);
    }

    if (parts.length === 1 && parts[0] === 'appointment-stats' && req.method === 'GET') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const { data: todayAppointments } = await supabase.from('appointments').select('status').eq('garage_owner_id', user.id).gte('appointment_date', startOfDay).lt('appointment_date', new Date(today.getTime() + 86400000).toISOString());
      const { data: weekAppointments } = await supabase.from('appointments').select('status').eq('garage_owner_id', user.id).gte('appointment_date', startOfWeek);
      const { data: monthAppointments } = await supabase.from('appointments').select('status').eq('garage_owner_id', user.id).gte('appointment_date', startOfMonth);

      const countByStatus = (appointments: any[]) => {
        const counts: any = { appointments: 0, confirmed: 0, pending: 0, completed: 0 };
        (appointments || []).forEach(appt => {
          counts.appointments++;
          if (appt.status === 'confirmed') counts.confirmed++;
          if (appt.status === 'pending') counts.pending++;
          if (appt.status === 'completed') counts.completed++;
        });
        return counts;
      };

      return ok({
        today: countByStatus(todayAppointments || []),
        week: countByStatus(weekAppointments || []),
        month: countByStatus(monthAppointments || []),
      }, 'Dashboard appointment statistics fetched successfully', origin);
    }

    if (parts.length === 1 && parts[0] === 'stats' && req.method === 'GET') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: allBookings } = await supabase.from('bookings').select('*').eq('garage_id', user.id);
      const bookings = allBookings || [];

      const todayBookings = bookings.filter(b => b.created_at >= today);
      const weekBookings = bookings.filter(b => b.created_at >= weekAgo);
      const monthBookings = bookings.filter(b => b.created_at >= monthAgo);
      const isCompleted = (b: any) => b.status === 'completed';
      const sumCost = (arr: any[]) => arr.reduce((sum, b) => sum + (b.actual_cost || 0), 0);

      const completedAll = bookings.filter(isCompleted);
      const totalRevenue = sumCost(completedAll);

      const result = {
        today: {
          bookings: todayBookings.length,
          revenue: sumCost(todayBookings.filter(isCompleted)),
          completed_services: todayBookings.filter(isCompleted).length,
        },
        this_week: {
          bookings: weekBookings.length,
          revenue: sumCost(weekBookings.filter(isCompleted)),
          completed_services: weekBookings.filter(isCompleted).length,
        },
        this_month: {
          bookings: monthBookings.length,
          revenue: sumCost(monthBookings.filter(isCompleted)),
          completed_services: monthBookings.filter(isCompleted).length,
        },
        all_time: {
          total_bookings: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          in_progress: bookings.filter(b => b.status === 'in_progress').length,
          completed: completedAll.length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          total_revenue: totalRevenue,
          avg_service_cost: completedAll.length > 0 ? totalRevenue / completedAll.length : 0,
        },
      };

      return ok(result, 'Dashboard statistics fetched successfully', origin);
    }

    return methodNotAllowed(origin);
  } catch (e) {
    return badRequest('Internal error', origin, 500);
  }
});
