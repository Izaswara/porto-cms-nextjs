'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Empty, PageHeader, Spinner } from '@/components/admin/ui';

interface MediaItem {
  name: string;
  url: string | null;
  size: number | null;
  mimeType: string | null;
  created_at: string | null;
}

function fmtSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OwnerMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      if (!res.ok) throw new Error('Gagal memuat media');
      const body = await res.json();
      setItems(body.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Gagal mengunggah ${file.name}`);
        }
      }
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setUploading(false);
    }
  }

  async function remove(item: MediaItem) {
    if (!window.confirm(`Hapus ${item.name}?`)) return;
    const res = await fetch(`/api/admin/media?name=${encodeURIComponent(item.name)}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Gagal menghapus');
      return;
    }
    await load();
  }

  const isImage = (m: MediaItem) => (m.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif|ico)$/i.test(m.name);

  return (
    <div>
      <PageHeader
        title="Media"
        desc="File yang diunggah ke Supabase Storage (bucket media)"
        actions={
          <>
            <input ref={fileRef} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
            <Button variant="primary" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? 'Mengunggah...' : '+ Upload'}
            </Button>
          </>
        }
      />
      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 rounded-lg px-4 py-2.5">{error}</p>}

      {loading ? (
        <Spinner label="Memuat media..." />
      ) : items.length === 0 ? (
        <Empty text="Belum ada file. Klik Upload untuk menambahkan." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((m) => (
            <div key={m.name} className="rounded-xl bg-slate-900/70 border border-white/10 overflow-hidden group">
              {isImage(m) && m.url ? (
                <img src={m.url} alt={m.name} className="w-full h-32 object-cover bg-slate-800" loading="lazy" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-slate-800 text-3xl">📄</div>
              )}
              <div className="p-3">
                <p className="text-xs text-slate-300 truncate" title={m.name}>{m.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{fmtSize(m.size)}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => m.url && navigator.clipboard.writeText(m.url)}
                    className="inline-flex items-center px-1.5 min-h-10 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Salin URL
                  </button>
                  <button onClick={() => remove(m)} className="inline-flex items-center px-1.5 min-h-10 text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer">Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}