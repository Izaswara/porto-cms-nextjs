import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSessionCookie, sessionCookieName } from '@/lib/auth';

function getClientIp(req: NextRequest): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
}

// Simple in-memory rate limiter (best-effort in serverless)
const loginAttempts = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || '');
    const password = String(body.password || '');
    const remember = Boolean(body.remember);

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 422 });
    }

    const ip = getClientIp(req) || 'unknown';
    const now = Date.now();
    const attempts = (loginAttempts.get(ip) || []).filter((t) => now - t < 60_000);
    if (attempts.length >= 5) {
      const wait = Math.ceil((60_000 - (now - attempts[0])) / 1000);
      return NextResponse.json({ error: `Terlalu banyak percobaan. Coba lagi dalam ${wait} detik.` }, { status: 429 });
    }

    const { data: user } = await db()
      .from('users')
      .select('id, name, username, email, password')
      .eq('username', username)
      .single();

    if (!user) {
      loginAttempts.set(ip, [...attempts, now]);
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, String(user.password));
    if (!ok) {
      loginAttempts.set(ip, [...attempts, now]);
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    loginAttempts.delete(ip);

    const token = await createSessionCookie(
      { sub: Number(user.id), name: user.name, username: user.username },
      remember
    );

    try {
      await db().from('activity_logs').insert({
        user_id: Number(user.id),
        action: 'login',
        description: 'Owner signed in',
        ip_address: ip,
        user_agent: req.headers.get('user-agent')?.slice(0, 300) || null,
      });
    } catch {
      // ignore
    }

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, username: user.username, email: user.email },
    });
    res.headers.set('Set-Cookie', token);
    return res;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Terjadi kesalahan.' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), '', { path: '/', maxAge: 0 });
  return res;
}
