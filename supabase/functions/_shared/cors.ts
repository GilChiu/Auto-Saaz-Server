export function corsHeaders(origin?: string) {
  const allowedOrigin = origin || '*';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    // Base allow-list; will be merged with Access-Control-Request-Headers dynamically in handleOptions
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-autosaaz-token, x-access-token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    // Cache preflight for 10 minutes to reduce OPTIONS traffic
    'Access-Control-Max-Age': '600',
  } as Record<string, string>;
}

export function handleOptions(req: Request) {
  const origin = req.headers.get('origin') || '*';
  const requested = req.headers.get('access-control-request-headers');
  const base = corsHeaders(origin);
  if (requested) {
    // Merge requested headers with our base allow-list to prevent preflight rejection
    const baseList = base['Access-Control-Allow-Headers']
      .split(',')
      .map(h => h.trim().toLowerCase())
      .filter(Boolean);
    const requestedList = requested
      .split(',')
      .map(h => h.trim().toLowerCase())
      .filter(Boolean);
    const merged = Array.from(new Set([...baseList, ...requestedList])).join(', ');
    base['Access-Control-Allow-Headers'] = merged;
  }
  return new Response('ok', { headers: base });
}

export function withCors(response: Response, origin?: string) {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(origin);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}
