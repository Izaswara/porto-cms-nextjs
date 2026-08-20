'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Field, PageHeader, Spinner, TextArea, TextInput } from '@/components/admin/ui';

export default function OwnerSettingsPage() {
  const [data, setData] = useState<Record<string, { key: string; value: string | null }[]> | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const cvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Gagal memuat'))))
      .then((body) => { setData(body.data || {}); setGroups(body.groups || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allKeys = groups.flatMap((g) => data?.[g] ?? []);
  const flat: Record<string, string | null> = {};
  for (const item of allKeys) flat[item.key] = item.value;
  const [draft, setDraft] = useState<Record<string, string | null>>({});
  useEffect(() => {
    setDraft({ ...flat });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Gagal menyimpan');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: string | null) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function uploadCv(file: File) {
    setUploading(true);
    setUploadMsg('');
    setError('');
    try {
      if (!/\.pdf$/i.test(file.name)) throw new Error('File CV harus berformat PDF.');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Gagal mengunggah file.');
      update('cv_url', body.data?.url ?? null);
      setUploadMsg(`CV diunggah: ${file.name}. Klik "Simpan Pengaturan" untuk menyimpan.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUploading(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  }

  const cvUrl = draft['cv_url'] ?? flat['cv_url'] ?? '';

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" desc="Pengaturan global situs (key-value)" />
      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 rounded-lg px-4 py-2.5">{error}</p>}
      {saved && <p className="text-sm text-emerald-400 mb-4 bg-emerald-500/10 rounded-lg px-4 py-2.5">Pengaturan disimpan.</p>}
      {loading ? (
        <Spinner label="Memuat pengaturan..." />
      ) : (
        <form onSubmit={save} className="space-y-6">
          <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
            <h2 className="font-semibold text-white capitalize mb-1">CV</h2>
            <p className="text-xs text-slate-400 mb-4">Upload atau ganti file CV (PDF). Tombol CV otomatis muncul di navbar publik.</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCv(f);
                }}
                className="hidden"
                id="cv-file-input"
              />
              <Button type="button" variant="primary" disabled={uploading} onClick={() => cvInputRef.current?.click()}>
                {uploading ? 'Mengunggah...' : cvUrl ? 'Ganti File CV' : 'Upload File CV'}
              </Button>
              {cvUrl && (
                <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-300 hover:underline">
                  Lihat CV saat ini
                </a>
              )}
            </div>
            {uploadMsg && <p className="text-sm text-emerald-400 mt-3">{uploadMsg}</p>}
            {cvUrl && (
              <Field label="cv_url">
                <TextInput value={cvUrl} onChange={(e) => update('cv_url', e.target.value)} className="font-mono text-xs" />
              </Field>
            )}
          </div>
          {groups.map((g) => {
            const items = data?.[g] ?? [];
            if (!items.length) return null;
            return (
              <div key={g} className="bg-slate-900/70 border border-white/10 rounded-xl p-6">
                <h2 className="font-semibold text-white capitalize mb-4">{g}</h2>
                <div className="grid grid-cols-1 gap-4">
                  {items
                    .filter((item) => item.key !== 'cv_url')
                    .map((item) => {
                    const val = draft[item.key] ?? item.value ?? '';
                    const long = String(val).length > 80;
                    return (
                      <Field key={item.key} label={item.key}>
                        {long ? (
                          <TextArea value={val ?? ''} onChange={(e) => update(item.key, e.target.value)} className="font-mono text-xs" />
                        ) : (
                          <TextInput value={val ?? ''} onChange={(e) => update(item.key, e.target.value)} className="font-mono text-xs" />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</Button>
          </div>
        </form>
      )}
    </div>
  );
}