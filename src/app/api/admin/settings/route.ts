import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, logActivity } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const GROUPS = ['general', 'cv', 'ai', 'social', 'analytics', 'advanced'];

export async function GET(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await db().from('settings').select('*').order('group').order('key');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const grouped: Record<string, { key: string; value: string | null }[]> = {};
  for (const row of data ?? []) {
    const g = String(row.group || 'general');
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push({ key: String(row.key), value: row.value });
  }
  return NextResponse.json({ data: grouped, groups: GROUPS });
}

export async function PUT(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const updates = body as Record<string, string | number | boolean | null>;

  // updateOrCreate: ambil key existing untuk tahu grup asal
  const keys = Object.keys(updates).filter((k) => k !== '_page');
  if (!keys.length) return NextResponse.json({ error: 'Tidak ada perubahan.' }, { status: 422 });

  const { data: existingRows, error: findErr } = await db().from('settings').select('key, "group"').in('key', keys);
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 400 });
  const existing = new Map<string, string>((existingRows ?? []).map((r) => [String(r.key), String(r.group || 'general')]));

  let failed = 0;
  for (const key of keys) {
    const value = updates[key] === null || updates[key] === undefined ? null : String(updates[key]);
    const group = existing.get(key) ?? 'general';
    if (existing.has(key)) {
      const { error } = await db().from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
      if (error) failed++;
    } else {
      const { error } = await db().from('settings').insert({ key, value, group });
      if (error) failed++;
    }
  }

  if (failed) return NextResponse.json({ error: `${failed} pengaturan gagal disimpan.` }, { status: 400 });
  await logActivity({ action: 'update_settings', description: 'Pengaturan situs diperbarui' }).catch(() => {});
  return NextResponse.json({ ok: true, updated: Object.keys(updates).length });
}