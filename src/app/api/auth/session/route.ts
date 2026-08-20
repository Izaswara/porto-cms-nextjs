import { NextResponse } from 'next/server';
import { getSessionFromRequest, sessionCookieName } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    const res = NextResponse.json({ ok: false });
    res.cookies.set(sessionCookieName(), '', { path: '/', maxAge: 0 });
    return res;
  }
  return NextResponse.json({ ok: true, user: { id: session.sub, name: session.name, username: session.username } });
}