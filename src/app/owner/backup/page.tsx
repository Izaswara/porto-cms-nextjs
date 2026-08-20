'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Empty, PageHeader, Spinner, Td, Th } from '@/components/admin/ui';

interface BackupItem {
  name: string;
  size: number | null;
  created_at: string | null;
}

export default function OwnerBackupPage() {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) throw new Error('Gagal memuat backup');
      const body = await res.json();
      setItems(body.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Gagal membuat backup');
      }
      setMessage('Backup berhasil dibuat.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  }

  async function restore(name: string) {
    if (!window.confirm(`Restore data dari ${name}?\nSemua data saat ini akan ditimpa!`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: name }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Gagal restore');
      }
      setMessage('Restore selesai.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  }

  async function remove(name: string) {
    if (!window.confirm(`Hapus backup ${name}?`)) return;
    const res = await fetch(`/api/admin/backup?filename=${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Gagal menghapus backup');
      return;
    }
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Backup & Restore"
        desc="Snapshot seluruh database ke Supabase Storage (bucket backups)"
        actions={<Button variant="primary" disabled={busy} onClick={create}>{busy ? 'Memproses...' : '+ Buat Backup'}</Button>}
      />
      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 rounded-lg px-4 py-2.5">{error}</p>}
      {message && <p className="text-sm text-emerald-400 mb-4 bg-emerald-500/10 rounded-lg px-4 py-2.5">{message}</p>}

      {loading ? (
        <Spinner label="Memuat backup..." />
      ) : items.length === 0 ? (
        <Empty text="Belum ada backup. Klik 'Buat Backup' untuk membuat snapshot pertama." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-slate-900/70 border border-white/10">
          <table className="w-full min-w-[520px]">
            <thead className="bg-white/5">
              <tr>
                <Th>Nama File</Th>
                <Th>Ukuran</Th>
                <Th>Dibuat</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.name} className="hover:bg-white/[0.02]">
                  <Td className="font-mono text-xs">{b.name}</Td>
                  <Td>{b.size === null ? '—' : `${(b.size / 1024).toFixed(1)} KB`}</Td>
                  <Td>{b.created_at ? new Date(b.created_at).toLocaleString('id-ID') : '—'}</Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-3">
                      <a
                        href={`/api/admin/backup?download=${encodeURIComponent(b.name)}`}
                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                      >
                        Download
                      </a>
                      <button onClick={() => restore(b.name)} className="text-amber-400 hover:text-amber-300 text-sm cursor-pointer">Restore</button>
                      <button onClick={() => remove(b.name)} className="text-rose-400 hover:text-rose-300 text-sm cursor-pointer">Hapus</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}