import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest, sessionCookieName } from '@/lib/auth';

const PROTECTED_PREFIXES = ['/owner', '/api/admin', '/api/ai'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // /owner/login tetap boleh tanpa sesi
  if (pathname === '/owner/login') {
    const session = await getSessionFromRequest(req);
    if (session) {
      return NextResponse.redirect(new URL('/owner/dashboard', req.url));
    }
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/owner/login', req.url);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(sessionCookieName());
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('x-pcms-user', JSON.stringify(sub(session)));
  return res;
}

function sub(session: { sub: number }) {
  return { sub: Number(session.sub) || 0 };
}

export const config = {
  matcher: ['/owner/:path*', '/api/admin/:path*', '/api/ai/:path*'],
};
