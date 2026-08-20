import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { db, mediaUrl } from './db';
import type { ActivityLogRow, UserRow } from './types';

const COOKIE_NAME = 'pcms_session';
const SESSION_DAYS = 7;
const REMEMBER_DAYS = 30;

function getSecret(): string {
  const secret = process.env.PCMS_JWT_SECRET;
  if (!secret) throw new Error('PCMS_JWT_SECRET belum dikonfigurasi.');
  return secret;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input: string): string {
  const pad = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  return decodeURIComponent(
    atob(pad)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

function b64urlToBytes(input: string): Uint8Array {
  const pad = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  const bin = atob(pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export interface SessionPayload {
  sub: number;
  name: string;
  username: string | null;
  exp: number;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(parts[2]).buffer as ArrayBuffer,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(b64urlDecode(parts[1])) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: Omit<SessionPayload, 'exp'>, remember: boolean): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (remember ? REMEMBER_DAYS : SESSION_DAYS) * 24 * 60 * 60;
  const token = await signSession({ ...payload, exp });
  const maxAge = (remember ? REMEMBER_DAYS : SESSION_DAYS) * 24 * 60 * 60;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function sessionCookieName() {
  return COOKIE_NAME;
}

/** Ambil sesi dari cookie Next.js server context */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Ambil sesi dari NextRequest (middleware) */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Wajib login: throw Response redirect jika tidak */
export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Response(null, { status: 401, headers: { Location: '/owner/login' } });
  return session;
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await db().from('users').select('*').eq('id', session.sub).single();
  if (error || !data) return null;
  return data as UserRow;
}

/** Catat aktivitas (padanan ActivityLog Laravel) */
export async function logActivity(input: {
  action: string;
  description?: string;
  subjectType?: string;
  subjectId?: number;
  properties?: Record<string, unknown>;
  userId?: number;
}) {
  const session = await getSession();
  const ip = input.userId ?? session?.sub ?? null;
  try {
    await db().from('activity_logs').insert({
      user_id: ip,
      action: input.action,
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      properties: input.properties ?? null,
      description: input.description ?? null,
    });
  } catch {
    // jangan gagalkan request karena log error
  }
}

export async function getRecentActivity(limit = 15): Promise<ActivityLogRow[]> {
  const { data } = await db()
    .from('activity_logs')
    .select('*, user:users(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityLogRow[];
}

export { mediaUrl };
