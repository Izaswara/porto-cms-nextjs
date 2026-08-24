import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type SectionTable = 'hero_sections' | 'about_sections';

const SECTION: Record<string, SectionTable | undefined> = { hero: 'hero_sections', about: 'about_sections' };
const JSON_FIELDS: Record<string, string[]> = {
  hero_sections: ['typing_texts', 'buttons', 'social_media'],
  about_sections: ['statistics', 'skills'],
};
const BOOL_FIELDS: Record<string, string[]> = { hero_sections: ['is_active'], about_sections: ['is_active'] };

function parseVal(table: string, key: string, val: unknown): unknown {
  if (BOOL_FIELDS[table]?.includes(key)) return val === true || val === 'true' || val === '1' || val === 1;
  if (JSON_FIELDS[table]?.includes(key)) {
    if (typeof val !== 'string') return val ?? null;
    try {
      return val.trim() ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }
  return val;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { section } = await params;
  const table = SECTION[section];
  if (!table) return NextResponse.json({ error: 'Section tidak dikenal.' }, { status: 404 });
  const { data, error } = await db().from(table).select('*').eq('id', 1).single();
  if (error || !data) return NextResponse.json({ data: null });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { section } = await params;
  const table = SECTION[section];
  if (!table) return NextResponse.json({ error: 'Section tidak dikenal.' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || k === 'created_at') continue;
    clean[k] = parseVal(table, k, v);
  }

  const { data: existing } = await db().from(table).select('id').eq('id', 1).single();
  if (existing) {
    const { data, error } = await db().from(table).update({ ...clean, updated_at: new Date().toISOString() }).eq('id', 1).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    revalidateTag('content');
    return NextResponse.json({ data });
  }
  const { data, error } = await db().from(table).insert({ id: 1, ...clean }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateTag('content');
  return NextResponse.json({ data });
}
