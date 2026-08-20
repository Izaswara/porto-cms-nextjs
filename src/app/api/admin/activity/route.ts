import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') || 20)));
  const rangeStart = (page - 1) * perPage;

  const { data, error, count } = await db()
    .from('activity_logs')
    .select('*, user:users(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(rangeStart, rangeStart + perPage - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, count, page, per_page: perPage });
}
