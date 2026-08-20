import { NextResponse } from 'next/server';
import { LOCALES } from '@/lib/types';

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const clean = (LOCALES as readonly string[]).includes(locale) ? locale : 'id';
  const url = new URL(_req.url);
  const back = url.searchParams.get('back') || '/';
  const res = NextResponse.redirect(new URL(back, url.origin));
  res.cookies.set('locale', clean, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return res;
}
