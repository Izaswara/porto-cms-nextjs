'use client';

import { useRef, useState } from 'react';
import { Button, Modal, Spinner, TextInput } from '@/components/admin/ui';

function resolveMedia(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url}/storage/v1/object/public/media/${path.replace(/^\/+/, '')}` : null;
}

interface MediaItem {
  name: string;
  url: string | null;
  mimeType: string | null;
}

export function ImageInput({ label, hint, value, onChange }: {
  label: string;
  hint?: string;
  value?: string | null;
  onChange: (v: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = resolveMedia(value);

  async function upload(file: File | undefined | null) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Gagal mengunggah file');
      onChange(body.data?.path ?? body.data?.url ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function openPicker() {
    setPickerOpen(true);
    setLoadingItems(true);
    setError('');
    fetch('/api/admin/media')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Gagal memuat media'))))
      .then((body) => setItems(body.data || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Terjadi kesalahan'))
      .finally(() => setLoadingItems(false));
  }

  function select(item: MediaItem) {
    onChange(item.name || item.url || null);
    setPickerOpen(false);
  }

  const isImage = (m: MediaItem) =>
    (m.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif|ico)$/i.test(m.name);

  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</span>
      <div className="flex gap-3">
        <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-900/70 border border-white/10 overflow-hidden flex items-center justify-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-600 text-2xl">🖼️</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <TextInput
            value={value ?? ''}
            placeholder="atau tempel URL gambar di sini"
            onChange={(e) => onChange(e.target.value || null)}
          />
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            <Button variant="primary" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? 'Mengunggah...' : '⬆ Upload Foto'}
            </Button>
            <Button onClick={openPicker}>Pilih dari Media</Button>
            {value && <Button variant="danger" onClick={() => onChange(null)}>Hapus</Button>}
          </div>
          {(hint || error) && (
            <span className={`block text-[11px] ${error ? 'text-rose-400' : 'text-slate-500'}`}>
              {error || hint}
            </span>
          )}
        </div>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pilih dari Media Library" wide>
        {loadingItems ? (
          <Spinner label="Memuat media..." />
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 py-10 text-sm">Belum ada media. Upload foto dulu lewat tombol Upload.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto">
            {items.map((m) =>
              isImage(m) && m.url ? (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => select(m)}
                  className={`rounded-lg overflow-hidden border transition-colors cursor-pointer ${value === m.name ? 'border-cyan-400' : 'border-white/10 hover:border-cyan-400/60'}`}
                  title={m.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.name} className="w-full h-24 object-cover bg-slate-800" loading="lazy" />
                </button>
              ) : null
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
