import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = body.type;
  const id = Number(body.id);
  if ((type !== 'project' && type !== 'post') || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Parameter tidak valid.' }, { status: 422 });
  }

  const table = type === 'project' ? 'projects' : 'posts';
  const { data } = await db().from(table).select('views').eq('id', id).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });

  const views = Number((data as { views?: unknown }).views ?? 0) + 1;
  await db().from(table).update({ views }).eq('id', id);

  return NextResponse.json({ views });
}
