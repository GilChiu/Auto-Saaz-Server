import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

function handleOptions(req: Request) {
  return new Response('ok', { headers: corsHeaders });
}

function withCors(response: Response, origin: string) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const disputeId = pathParts.length > 1 ? pathParts[1] : null;

    // GET - List disputes with pagination and search
    if (req.method === 'GET' && !disputeId) {
      const searchParams = url.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '100');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const type = searchParams.get('type') || '';
      
      const offset = (page - 1) * limit;

      let query = supabaseClient
        .from('disputes')
        .select('*', { count: 'exact' });

      // Map frontend filter names to database statuses
      if (status === 'new') {
        // "New" disputes are those not resolved or closed
        query = query.not('status', 'in', '(resolved,closed)');
      } else if (status === 'resolved') {
        // "Resolved" includes both resolved and closed
        query = query.in('status', ['resolved', 'closed']);
      } else if (status) {
        // Use exact status match for specific statuses
        query = query.eq('status', status);
      }

      if (type) {
        query = query.eq('type', type);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: disputes, error, count } = await query;

      if (error) throw error;

      // Get user IDs and garage IDs
      const userIds = [...new Set(disputes?.map(d => d.user_id).filter(Boolean))];
      const garageIds = [...new Set(disputes?.map(d => d.garage_id).filter(Boolean))];

      // Fetch users
      let users = [];
      if (userIds.length > 0) {
        const { data } = await supabaseClient
          .from('users')
          .select('id, email')
          .in('id', userIds);
        users = data || [];
      }

      // Fetch garage profiles
      let garageProfiles = [];
      if (garageIds.length > 0) {
        const { data } = await supabaseClient
          .from('garage_profiles')
          .select('user_id, full_name, garage_name, email')
          .in('user_id', garageIds);
        garageProfiles = data || [];
      }

      const userMap = new Map(users.map(u => [u.id, u]));
      const garageMap = new Map(garageProfiles.map(g => [g.user_id, g]));

      // Filter by search if provided
      let filteredDisputes = disputes || [];
      if (search) {
        filteredDisputes = disputes?.filter(d => {
          const user = userMap.get(d.user_id);
          const garage = garageMap.get(d.garage_id);
          const searchLower = search.toLowerCase();
          
          return (
            d.code?.toLowerCase().includes(searchLower) ||
            d.subject?.toLowerCase().includes(searchLower) ||
            user?.email?.toLowerCase().includes(searchLower) ||
            garage?.full_name?.toLowerCase().includes(searchLower) ||
            garage?.garage_name?.toLowerCase().includes(searchLower)
          );
        }) || [];
      }

      const formattedDisputes = filteredDisputes.map(dispute => {
        const user = userMap.get(dispute.user_id);
        const garage = garageMap.get(dispute.garage_id);
        
        return {
          id: dispute.id,
          code: dispute.code,
          type: dispute.type,
          subject: dispute.subject,
          status: dispute.status,
          priority: dispute.priority,
          
          userName: dispute.contact_name || user?.email || 'Unknown',
          userEmail: dispute.contact_email || user?.email || '',
          
          garageName: garage?.garage_name || garage?.full_name || 'Unknown',
          garageEmail: garage?.email || '',
          
          evidenceRequested: dispute.evidence_requested,
          escalated: dispute.escalated,
          
          createdAt: dispute.created_at,
          updatedAt: dispute.updated_at
        };
      });

      const response = new Response(
        JSON.stringify({
          disputes: formattedDisputes,
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

      return withCors(response, origin);
    }

    // PATCH - Update dispute (request evidence, resolve, escalate)
    if (req.method === 'PATCH' && disputeId) {
      const { action, adminId, message, reason, notes } = await req.json();

      if (!action || !['request_evidence', 'resolve', 'escalate'].includes(action)) {
        const response = new Response(
          JSON.stringify({ error: 'Invalid action. Must be "request_evidence", "resolve", or "escalate"' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
        return withCors(response, origin);
      }

      if (action === 'request_evidence') {
        // Request evidence from garage
        const { data, error } = await supabaseClient
          .from('disputes')
          .update({
            evidence_requested: true,
            evidence_requested_at: new Date().toISOString(),
            evidence_requested_by: adminId,
            status: 'under_review',
            updated_at: new Date().toISOString()
          })
          .eq('id', disputeId)
          .select()
          .single();

        if (error) throw error;

        // Add admin message to conversation if provided, marked as evidence request
        if (message) {
          await supabaseClient
            .from('dispute_messages')
            .insert({
              ticket_id: disputeId,
              sender_id: adminId,
              body: message,
              is_evidence_request: true
            });
        }

        const response = new Response(
          JSON.stringify({ success: true, dispute: data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
        return withCors(response, origin);
      }

      if (action === 'resolve') {
        // Resolve the case
        const { data, error } = await supabaseClient
          .from('disputes')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: adminId,
            resolution_notes: notes || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', disputeId)
          .select()
          .single();

        if (error) throw error;

        // Add resolution message to conversation if provided
        if (message) {
          await supabaseClient
            .from('dispute_messages')
            .insert({
              ticket_id: disputeId,
              sender_id: adminId,
              body: message
            });
        }

        const response = new Response(
          JSON.stringify({ success: true, dispute: data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
        return withCors(response, origin);
      }

      if (action === 'escalate') {
        // Escalate the case
        const { data, error } = await supabaseClient
          .from('disputes')
          .update({
            escalated: true,
            escalated_at: new Date().toISOString(),
            escalated_by: adminId,
            escalation_reason: reason || '',
            priority: 'urgent',
            updated_at: new Date().toISOString()
          })
          .eq('id', disputeId)
          .select()
          .single();

        if (error) throw error;

        // Add escalation message to conversation if provided
        if (message) {
          await supabaseClient
            .from('dispute_messages')
            .insert({
              ticket_id: disputeId,
              sender_id: adminId,
              body: message
            });
        }

        const response = new Response(
          JSON.stringify({ success: true, dispute: data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
        return withCors(response, origin);
      }
    }

    // Method not allowed
    const response = new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );

    return withCors(response, origin);

  } catch (error) {
    const response = new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );

    return withCors(response, origin);
  }
});
