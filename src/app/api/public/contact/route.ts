import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const subject = String(body.subject ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (name.length < 2) return NextResponse.json({ error: 'Nama minimal 2 karakter.' }, { status: 422 });
  if (name.length > 100) return NextResponse.json({ error: 'Nama terlalu panjang.' }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Email tidak valid.' }, { status: 422 });
  if (subject.length > 200) return NextResponse.json({ error: 'Subjek terlalu panjang.' }, { status: 422 });
  if (message.length < 5) return NextResponse.json({ error: 'Pesan minimal 5 karakter.' }, { status: 422 });
  if (message.length > 5000) return NextResponse.json({ error: 'Pesan terlalu panjang (maks 5000 karakter).' }, { status: 422 });

  const { error } = await db().from('contacts').insert({
    name,
    email,
    subject: subject || null,
    message,
  });

  if (error) return NextResponse.json({ error: 'Gagal mengirim pesan. Coba lagi.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
