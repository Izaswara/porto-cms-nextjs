'use client';

import { useCallback, useEffect, useState } from 'react';
import { Empty, PageHeader, Spinner, Td, Th } from '@/components/admin/ui';
import { Button } from '@/components/admin/ui';

interface Activity {
  id: number;
  action: string;
  description: string | null;
  ip_address: string | null;
  created_at: string | null;
  user: { id: number; name: string } | null;
}

export default function OwnerActivityPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const perPage = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity?page=${page}&per_page=${perPage}`);
      if (!res.ok) throw new Error('Gagal memuat aktivitas');
      const body = await res.json();
      setItems(body.data || []);
      setCount(body.count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Activity Log" desc="Riwayat aktivitas owner" />
      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 rounded-lg px-4 py-2.5">{error}</p>}

      {loading ? (
        <Spinner label="Memuat aktivitas..." />
      ) : items.length === 0 ? (
        <Empty text="Belum ada aktivitas." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-slate-900/70 border border-white/10">
          <table className="w-full min-w-[560px]">
            <thead className="bg-white/5">
              <tr>
                <Th>Aksi</Th>
                <Th>Deskripsi</Th>
                <Th>User</Th>
                <Th>IP</Th>
                <Th>Waktu</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <Td><span className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-500/10 text-cyan-300 font-mono">{a.action}</span></Td>
                  <Td>{a.description || '—'}</Td>
                  <Td>{a.user?.name || '—'}</Td>
                  <Td className="font-mono text-xs">{a.ip_address || '—'}</Td>
                  <Td className="text-xs whitespace-nowrap">{a.created_at ? new Date(a.created_at).toLocaleString('id-ID') : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {count > perPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-xs text-slate-500">Total {count} aktivitas</span>
              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Sebelumnya</Button>
                <span className="text-sm text-slate-400 py-2">Hal {page} / {Math.ceil(count / perPage)}</span>
                <Button disabled={page >= Math.ceil(count / perPage)} onClick={() => setPage((p) => p + 1)}>Berikutnya →</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}