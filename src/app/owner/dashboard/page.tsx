'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Spinner } from '@/components/admin/ui';

interface Stats {
  counts: Record<string, number>;
  users: number;
  contacts: { total: number; unread: number };
  topProjects: { id: number; title: string; slug: string; views: number }[];
  topPosts: { id: number; title: string; slug: string; views: number }[];
  recent: { id: number; action: string; description: string | null; created_at: string | null }[];
  site_name: string | null;
}

const CARD_META: { key: string; label: string; href: string; color: string }[] = [
  { key: 'projects', label: 'Projects', href: '/owner/resources/projects?page=1', color: 'text-cyan-300' },
  { key: 'posts', label: 'Articles', href: '/owner/resources/blogs?page=1', color: 'text-violet-300' },
  { key: 'skills', label: 'Skills', href: '/owner/resources/skills?page=1', color: 'text-emerald-300' },
  { key: 'experiences', label: 'Experience', href: '/owner/resources/experience?page=1', color: 'text-amber-300' },
  { key: 'education', label: 'Education', href: '/owner/resources/education?page=1', color: 'text-rose-300' },
  { key: 'certificates', label: 'Certificates', href: '/owner/resources/certificates?page=1', color: 'text-sky-300' },
  { key: 'galleries', label: 'Galleries', href: '/owner/resources/galleries?page=1', color: 'text-pink-300' },
  { key: 'social_media', label: 'Social', href: '/owner/resources/social?page=1', color: 'text-lime-300' },
  { key: 'menus', label: 'Menus', href: '/owner/resources/menu?page=1', color: 'text-orange-300' },
  { key: 'prompts', label: 'Prompts', href: '/owner/resources/prompts?page=1', color: 'text-teal-300' },
  { key: 'themes', label: 'Themes', href: '/owner/resources/themes?page=1', color: 'text-fuchsia-300' },
  { key: 'translations', label: 'Translations', href: '/owner/resources/translations?page=1', color: 'text-indigo-300' },
];

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const cvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Gagal memuat data'))))
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

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
      const cvUrl = body.data?.url;
      if (!cvUrl) throw new Error('URL CV kosong.');
      const save = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_url: cvUrl }),
      });
      if (!save.ok) throw new Error('CV terunggah tapi gagal menyimpan pengaturan.');
      setUploadMsg(`CV diunggah & disimpan: ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUploading(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  }

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!stats) return <Spinner label="Memuat dashboard..." />;

  const unread = stats.contacts?.unread ?? 0;

  return (
    <div>
      <h1 className="font-[Space_Grotesk] text-2xl md:text-3xl font-bold text-white">
        Halo, {stats.site_name || 'Owner'} 👋
      </h1>
      <p className="text-slate-400 text-sm mt-1">Ringkasan konten situs Anda.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-8">
        {CARD_META.map((c) => (
          <Link key={c.key} href={c.href} className="rounded-xl bg-slate-900/70 border border-white/10 p-4 hover:border-cyan-400/40 transition-colors group">
            <div className={`text-3xl font-bold font-[Space_Grotesk] ${c.color}`}>{stats.counts[c.key] ?? 0}</div>
            <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-200 transition-colors">{c.label}</div>
          </Link>
        ))}
        <Link href="/owner/resources/contacts?page=1" className="rounded-xl bg-slate-900/70 border border-white/10 p-4 hover:border-cyan-400/40 transition-colors group relative">
          <div className="text-3xl font-bold font-[Space_Grotesk] text-emerald-300">{stats.contacts?.total ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-200 transition-colors">Pesan Masuk</div>
          {unread > 0 && (
            <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unread} baru
            </span>
          )}
        </Link>
        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-4">
          <div className="text-3xl font-bold font-[Space_Grotesk] text-white">{stats.users ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">Users</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-5 md:p-6">
          <h2 className="font-semibold text-white text-lg">🔥 Top Projects</h2>
          {stats.topProjects && stats.topProjects.length > 0 ? (
            <div className="mt-4 space-y-2">
              {stats.topProjects.map((p) => (
                <a key={p.id} href={`/projects/${p.slug}`} target="_blank" className="flex items-center justify-between gap-3 text-sm py-2 border-b border-white/5 last:border-0 group">
                  <span className="text-slate-200 group-hover:text-cyan-300 transition-colors truncate">{p.title}</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">👁 {p.views}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-4">Belum ada data views.</p>
          )}
        </div>

        <div className="rounded-xl bg-slate-900/70 border border-white/10 p-5 md:p-6">
          <h2 className="font-semibold text-white text-lg">📈 Top Articles</h2>
          {stats.topPosts && stats.topPosts.length > 0 ? (
            <div className="mt-4 space-y-2">
              {stats.topPosts.map((p) => (
                <a key={p.id} href={`/blog/${p.slug}`} target="_blank" className="flex items-center justify-between gap-3 text-sm py-2 border-b border-white/5 last:border-0 group">
                  <span className="text-slate-200 group-hover:text-cyan-300 transition-colors truncate">{p.title}</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">👁 {p.views}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-4">Belum ada data views.</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-slate-900/70 border border-white/10 p-5 md:p-6">
        <h2 className="font-semibold text-white text-lg">📄 CV</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">Upload CV (PDF) langsung dari sini — tersimpan ke pengaturan & otomatis muncul di navbar publik.</p>
        <input
          ref={cvInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadCv(f);
          }}
          className="hidden"
          id="cv-file-input-dash"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" disabled={uploading} onClick={() => cvInputRef.current?.click()}>
            {uploading ? 'Mengunggah...' : 'Upload / Ganti CV'}
          </Button>
          <Link href="/owner/settings" className="text-sm text-cyan-300 hover:underline">Atur di Settings →</Link>
        </div>
        {uploadMsg && <p className="text-sm text-emerald-400 mt-3">{uploadMsg}</p>}
      </div>

      <div className="mt-8 rounded-xl bg-slate-900/70 border border-white/10 p-5 md:p-6">
        <h2 className="font-semibold text-white text-lg">Aktivitas Terbaru</h2>
        <div className="mt-4 space-y-2">
          {stats.recent && stats.recent.length > 0 ? (
            stats.recent.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 text-sm py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-slate-200">{a.description || a.action}</span>
                </div>
                {a.created_at && <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(a.created_at).toLocaleString('id-ID')}</span>}
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">Belum ada aktivitas.</p>
          )}
        </div>
      </div>
    </div>
  );
}