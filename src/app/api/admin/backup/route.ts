import { NextRequest, NextResponse } from 'next/server';
import { getDb, db } from '@/lib/db';
import { getSessionFromRequest, logActivity } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Semua tabel bisnis yang ikut di-backup (padanan list di Laravel BackupController)
const BACKUP_TABLES = [
  'users',
  'settings',
  'hero_sections',
  'about_sections',
  'projects',
  'skills',
  'experiences',
  'education',
  'certificates',
  'posts',
  'social_media',
  'menus',
  'translations',
  'prompts',
  'activity_logs',
  'seos',
  'themes',
  'galleries',
] as const;

export async function GET(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const download = url.searchParams.get('download');
  if (download) {
    if (download.includes('..')) return NextResponse.json({ error: 'Nama file tidak valid.' }, { status: 422 });
    const { data: blob, error } = await getDb().storage.from('backups').download(download);
    if (error || !blob) return NextResponse.json({ error: 'Backup tidak ditemukan.' }, { status: 404 });
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${download}"`,
      },
    });
  }
  const { data: files, error } = await getDb().storage.from('backups').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    data: (files ?? []).map((f) => ({
      name: f.name,
      size: f.metadata?.size ?? null,
      created_at: f.created_at ?? null,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const filename = url.searchParams.get('filename');
  if (!filename || filename.includes('..')) return NextResponse.json({ error: 'Nama file tidak valid.' }, { status: 422 });
  const { error } = await getDb().storage.from('backups').remove([filename]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dump: Record<string, unknown[]> = {};
  for (const t of BACKUP_TABLES) {
    const { data } = await db().from(t).select('*');
    dump[t] = data ?? [];
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${stamp}.json`;
  const buf = Buffer.from(JSON.stringify(dump, null, 2), 'utf8');
  const { error } = await getDb().storage.from('backups').upload(filename, buf, { contentType: 'application/json', upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logActivity({ action: 'backup_create', description: `Backup dibuat: ${filename}` }).catch(() => {});
  return NextResponse.json({ data: { name: filename, size: buf.length } }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const filename = String(body.filename || '');
  if (!filename || filename.includes('..')) return NextResponse.json({ error: 'Nama file tidak valid.' }, { status: 422 });

  const { data: blob, error: dlErr } = await getDb().storage.from('backups').download(filename);
  if (dlErr || !blob) return NextResponse.json({ error: 'Backup tidak ditemukan.' }, { status: 404 });

  const text = await blob.text();
  let dump: Record<string, unknown[]>;
  try {
    dump = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'File backup korup.' }, { status: 400 });
  }

  // Truncate lalu insert ulang (LIFO FK: hapus child dulu)
  const order = [...BACKUP_TABLES].reverse();
  for (const t of order) {
    try {
      await db().from(t).delete().neq('id', 0);
    } catch {
      // skip gagal per tabel
    }
  }

  for (const t of order) {
    const rows = dump[t] ?? [];
    if (!rows.length) continue;
    const { error: insErr } = await db().from(t).insert(rows);
    if (insErr) return NextResponse.json({ error: `Restore gagal di ${t}: ${insErr.message}`, restored: false }, { status: 400 });
  }

  await logActivity({ action: 'backup_restore', description: `Backup direstore: ${filename}` }).catch(() => {});
  return NextResponse.json({ restored: true });
}
