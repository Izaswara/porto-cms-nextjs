import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { RESOURCE_CONFIGS } from '@/lib/crud';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { resource, id } = await params;
  const config = RESOURCE_CONFIGS[resource];
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal.' }, { status: 404 });

  const { data, error } = await db().from(config.table).select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { resource, id } = await params;
  const config = RESOURCE_CONFIGS[resource];
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { data: clean, errors } = (await import('@/lib/crud')).transformInput(config, { ...body, id: Number(id) });
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'Validasi gagal.', fieldErrors: errors }, { status: 422 });
  }
  delete clean.id;

  const { data: existing } = await db().from(config.table).select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });

  if (config.autoSlug && config.uniqueKey && body[config.autoSlug.from]) {
    const { uniqueSlug } = await import('@/lib/crud');
    clean[config.uniqueKey] = await uniqueSlug(config.table, config.uniqueKey, String(body[config.autoSlug.from]), Number(id));
  }

  const { data, error } = await db().from(config.table).update(clean).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resource: string; id: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { resource, id } = await params;
  const config = RESOURCE_CONFIGS[resource];
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal.' }, { status: 404 });

  const { data: existing } = await db().from(config.table).select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });

  const { error } = await db().from(config.table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
