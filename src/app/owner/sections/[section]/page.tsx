'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Field, PageHeader, Spinner, TextArea, TextInput, Toggle } from '@/components/admin/ui';
import { ImageInput } from '@/components/admin/image-input';

interface SectionField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'toggle' | 'json' | 'image';
  hint?: string;
}

const SECTION_META: Record<string, { title: string; desc: string; fields: SectionField[] }> = {
  hero: {
    title: 'Hero Section',
    desc: 'Banner utama halaman depan',
    fields: [
      { name: 'name', label: 'Nama', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'typing_texts', label: 'Typing Texts', type: 'json', hint: 'Array JSON, contoh: ["Fullstack Developer","UI Designer"]' },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
      { name: 'background_type', label: 'Tipe Background', type: 'text' },
      { name: 'background_value', label: 'Nilai Background', type: 'text' },
      { name: 'background_image', label: 'Background Image', type: 'image' },
      { name: 'photo', label: 'Foto', type: 'image' },
      { name: 'buttons', label: 'Buttons', type: 'json', hint: 'Array JSON tombol CTA' },
      { name: 'social_media', label: 'Social Media', type: 'json' },
      { name: 'is_active', label: 'Aktif', type: 'toggle' },
    ],
  },
  about: {
    title: 'About Section',
    desc: 'Bagian tentang saya',
    fields: [
      { name: 'photo', label: 'Foto', type: 'image', hint: 'Upload foto baru atau pilih dari media library (maks 4MB)' },
      { name: 'description', label: 'Deskripsi', type: 'textarea' },
      { name: 'quote', label: 'Quote', type: 'text' },
      { name: 'statistics', label: 'Statistik', type: 'json', hint: 'Contoh: [{"label":"Proyek","value":10}]' },
      { name: 'skills', label: 'Skills', type: 'json', hint: 'Array JSON nama skill, contoh: ["React","Laravel"]' },
      { name: 'is_active', label: 'Aktif', type: 'toggle' },
    ],
  },
};

export default function OwnerSectionPage() {
  const params = useParams<{ section: string }>();
  const section = typeof params.section === 'string' ? params.section : '';
  const meta = SECTION_META[section];

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!section) return;
    setLoading(true);
    fetch(`/api/admin/section/${section}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Gagal memuat'))))
      .then((body) => setData(body.data || {}))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [section]);

  if (!meta) return <p className="text-rose-400">Section tidak dikenal.</p>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/section/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Gagal menyimpan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={meta.title} desc={meta.desc} />
      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 rounded-lg px-4 py-2.5">{error}</p>}
      {loading ? (
        <Spinner label="Memuat..." />
      ) : (
        <form onSubmit={save} className="space-y-4 bg-slate-900/70 border border-white/10 rounded-xl p-6">
          {meta.fields.map((f) => {
            const val = data?.[f.name];
            const props = {
              error: undefined as string | undefined,
            };
            if (f.type === 'textarea') {
              return (
                <Field key={f.name} label={f.label} hint={f.hint} {...props}>
                  <TextArea value={typeof val === 'string' ? val : ''} onChange={(e) => setData((d) => ({ ...d!, [f.name]: e.target.value }))} />
                </Field>
              );
            }
            if (f.type === 'image') {
              return (
                <ImageInput
                  key={f.name}
                  label={f.label}
                  hint={f.hint}
                  value={typeof val === 'string' ? val : ''}
                  onChange={(v) => setData((d) => ({ ...d!, [f.name]: v }))}
                />
              );
            }
            if (f.type === 'toggle') {
              return (
                <div key={f.name} className="py-2">
                  <Toggle checked={Boolean(val)} onChange={(v) => setData((d) => ({ ...d!, [f.name]: v }))} label={f.label} />
                </div>
              );
            }
            if (f.type === 'json') {
              const raw = val === null || val === undefined || val === '' ? '' : JSON.stringify(val, null, 2);
              return (
                <Field key={f.name} label={f.label} hint={f.hint} {...props}>
                  <TextArea value={raw} onChange={(e) => setData((d) => ({ ...d!, [f.name]: e.target.value }))} className="font-mono text-xs min-h-[100px]" />
                </Field>
              );
            }
            return (
              <Field key={f.name} label={f.label} hint={f.hint} {...props}>
                <TextInput value={typeof val === 'string' ? val : ''} onChange={(e) => setData((d) => ({ ...d!, [f.name]: e.target.value }))} />
              </Field>
            );
          })}
          <div className="flex justify-end pt-4 border-t border-white/10">
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Section'}</Button>
          </div>
        </form>
      )}
    </div>
  );
}