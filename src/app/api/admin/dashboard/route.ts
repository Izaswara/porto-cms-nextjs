import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const COUNT_TABLES = ['projects', 'posts', 'skills', 'experiences', 'education', 'certificates', 'social_media', 'menus', 'prompts', 'galleries', 'themes', 'translations'] as const;

export async function GET(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const counts: Record<string, number> = {};
  await Promise.all(
    COUNT_TABLES.map(async (t) => {
      const { count } = await db().from(t).select('*', { count: 'exact', head: true });
      counts[t] = count ?? 0;
    })
  );

  const { count: contactsCount } = await db().from('contacts').select('*', { count: 'exact', head: true });
  const { count: contactsUnread } = await db().from('contacts').select('*', { count: 'exact', head: true }).eq('is_read', false);

  const { data: topProjects } = await db().from('projects').select('id, title, slug, views').order('views', { ascending: false }).limit(5);
  const { data: topPosts } = await db().from('posts').select('id, title, slug, views').order('views', { ascending: false }).limit(5);

  const { data: recent } = await db().from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10);
  const { count: users } = await db().from('users').select('*', { count: 'exact', head: true });
  const { data: settings } = await db().from('settings').select('key, value').eq('key', 'site_name').single();

  return NextResponse.json({
    counts,
    users: users ?? 0,
    contacts: { total: contactsCount ?? 0, unread: contactsUnread ?? 0 },
    topProjects: topProjects ?? [],
    topPosts: topPosts ?? [],
    recent: recent ?? [],
    site_name: settings?.value ?? null,
  });
}
