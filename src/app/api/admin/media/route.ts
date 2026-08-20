import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest, logActivity } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: files, error } = await getDb().storage.from('media').list('', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const items = (files ?? []).filter((f) => !f.id?.endsWith('/file'));
  return NextResponse.json({
    data: items.map((f) => ({
      name: f.name,
      id: f.id,
      size: f.metadata?.size ?? null,
      mimeType: f.metadata?.mimetype ?? null,
      created_at: f.created_at ?? null,
      updated_at: f.metadata?.lastModified ? new Date(f.metadata.lastModified).toISOString() : null,
      url: f.name ? `${url}/storage/v1/object/public/media/${f.name}` : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 422 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Ukuran file maksimal 4MB (batas body request Vercel). Untuk file besar, unggah langsung ke Supabase Storage.' }, { status: 413 });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { data, error } = await getDb().storage.from('media').upload(name, buf, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const path = data?.path ?? name;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${url}/storage/v1/object/public/media/${path}`;
  await logActivity({ action: 'upload_media', description: `Media diunggah: ${file.name}` }).catch(() => {});
  return NextResponse.json({ data: { name: file.name, path, url: publicUrl, size: file.size, mimeType: file.type } }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await getSessionFromRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const name = url.searchParams.get('name');
  if (!name || name.includes('..')) return NextResponse.json({ error: 'Nama file tidak valid.' }, { status: 422 });
  const { error } = await getDb().storage.from('media').remove([name]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await logActivity({ action: 'delete_media', description: `Media dihapus: ${name}` }).catch(() => {});
  return NextResponse.json({ ok: true });
}
