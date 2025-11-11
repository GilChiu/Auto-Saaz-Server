// @ts-nocheck
import { jwtVerify } from 'https://esm.sh/jose@5.2.3';
import { withCors } from './cors.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || '';

function toSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

export type AuthedUser = { id: string; email?: string; role?: string };

export async function requireAuth(req: Request, origin?: string): Promise<{ user?: AuthedUser; errorResponse?: Response }>{
  try {
    const token = req.headers.get('x-autosaaz-token') || req.headers.get('x-access-token');
    if (!token) {
      return { errorResponse: withCors(new Response(JSON.stringify({ success: false, message: 'Missing access token' }), { status: 401, headers: { 'Content-Type': 'application/json' } }), origin) };
    }
    const { payload } = await jwtVerify(token, toSecret(JWT_SECRET), { issuer: 'autosaaz-api', audience: 'autosaaz-client' });
    if (!payload || payload.type !== 'access' || !payload.userId) {
      return { errorResponse: withCors(new Response(JSON.stringify({ success: false, message: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } }), origin) };
    }
    return { user: { id: String(payload.userId), email: payload.email as string | undefined, role: payload.role as string | undefined } };
  } catch {
    return { errorResponse: withCors(new Response(JSON.stringify({ success: false, message: 'Invalid or expired token' }), { status: 401, headers: { 'Content-Type': 'application/json' } }), origin) };
  }
}

export function badRequest(message: string, origin?: string, status = 400) {
  return withCors(new Response(JSON.stringify({ success: false, message }), { status, headers: { 'Content-Type': 'application/json' } }), origin);
}
export function ok(data: unknown, message = 'OK', origin?: string) {
  return withCors(new Response(JSON.stringify({ success: true, data, message }), { status: 200, headers: { 'Content-Type': 'application/json' } }), origin);
}
export function notFound(message = 'Not found', origin?: string) {
  return withCors(new Response(JSON.stringify({ success: false, message }), { status: 404, headers: { 'Content-Type': 'application/json' } }), origin);
}
export function methodNotAllowed(origin?: string) {
  return withCors(new Response('Method Not Allowed', { status: 405 }), origin);
}
