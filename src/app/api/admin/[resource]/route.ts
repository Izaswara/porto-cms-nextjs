import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, logActivity } from '@/lib/auth';
import { RESOURCE_CONFIGS, transformInput, uniqueSlug } from '@/lib/crud';

export const dynamic = 'force-dynamic';

function getSessionUser(req: NextRequest): number | null {
  const h = req.headers.get('x-pcms-user');
  if (!h) return null;
  const sub = /"sub":(\d+)/.exec(h);
  return sub ? Number(sub[1]) : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { resource } = await params;
  const config = RESOURCE_CONFIGS[resource];
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal.' }, { status: 404 });

  const url = new URL(req.url);
  const orderCol = url.searchParams.get('order_by') || 'id';
  const orderDir = url.searchParams.get('order_dir') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') || 20)));

  let query = db().from(config.table).select('*', { count: 'exact' }).order(orderCol, { ascending: orderDir === 'asc' });
  const rangeStart = (page - 1) * perPage;
  query = query.range(rangeStart, rangeStart + perPage - 1);
  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, count, page, per_page: perPage });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { resource } = await params;
  const config = RESOURCE_CONFIGS[resource];
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { data: clean, errors } = transformInput(config, body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'Validasi gagal.', fieldErrors: errors }, { status: 422 });
  }

  if (config.uniqueKey && config.autoSlug) {
    const base = String(clean[config.autoSlug.from] || '');
    clean[config.autoSlug.field] = base
      ? await uniqueSlug(config.table, config.uniqueKey, base)
      : config.uniqueKey === 'slug'
        ? await uniqueSlug(config.table, config.uniqueKey, typeof clean.title === 'string' ? clean.title : 'untitled')
        : undefined;
    if (!clean[config.autoSlug.field]) delete clean[config.autoSlug.field];
  }

  const { data, error } = await db().from(config.table).insert(clean).select().single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `${config.label} sudah ada (duplikat ditemukan).`, fieldErrors: { name: 'Sudah ada.' } }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userName = await actionLabel(config, body);
  await logActivity({ action: 'create', description: `${config.label} ditambahkan: ${userName}`, userId: getSessionUser(req) ?? undefined }).catch(() => {});
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { resource } = await params;
  const config = RESOURCE_CONFIGS[resource];
  if (!config) return NextResponse.json({ error: 'Resource tidak dikenal.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: 'ID tidak valid.' }, { status: 422 });

  const { data: clean, errors } = transformInput(config, body);
  if (Object.keys(errors).length) {
    return NextResponse.json({ error: 'Validasi gagal.', fieldErrors: errors }, { status: 422 });
  }
  delete clean.id;

  const { data: existing } = await db().from(config.table).select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });

  if (config.autoSlug && config.uniqueKey) {
    const newTitle = String(clean[config.autoSlug.from] || existing[config.autoSlug.from] || '');
    const oldSlug = existing[config.uniqueKey];
    const nextSlug = await uniqueSlug(config.table, config.uniqueKey, newTitle, id);
    if (oldSlug !== nextSlug) clean[config.uniqueKey] = nextSlug;
  }

  const { data, error } = await db().from(config.table).update(clean).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const userName = await actionLabel(config, body);
  await logActivity({ action: 'update', description: `${config.label} diperbarui: ${userName}`, userId: getSessionUser(req) ?? undefined }).catch(() => {});
  return NextResponse.json({ data });
}

async function actionLabel(config: (typeof RESOURCE_CONFIGS)[string], body: Record<string, unknown>): Promise<string> {
  if (config.autoSlug) {
    const from = config.autoSlug.from;
    const v = body?.[from];
    if (v) return String(v);
    const t = body?.['title'];
    if (t) return String(t);
  }
  for (const k of ['name', 'title', 'platform', 'institution', 'key']) {
    const v = body?.[k];
    if (v) return String(v);
  }
  return config.label;
}
