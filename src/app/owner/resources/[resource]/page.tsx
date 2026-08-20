'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RESOURCE_SCHEMAS } from '@/lib/admin-schemas';
import type { AdminField, ResourceSchema } from '@/lib/admin-schemas';
import { Button, Empty, Field, Modal, PageHeader, Spinner, Td, Th, TextArea, TextInput, Toggle, Select } from '@/components/admin/ui';

interface Row {
  id: number;
  [key: string]: unknown;
}

function fmtCell(v: unknown, field: AdminField): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length ? `${(v as unknown[]).slice(0, 3).join(', ')}${v.length > 3 ? ` (+${v.length - 3})` : ''}` : '—';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v).slice(0, 60);
    } catch {
      return '—';
    }
  }
  return String(v);
}

function FieldInput({ field, value, onChange, errors }: {
  field: AdminField;
  value: unknown;
  onChange: (v: unknown) => void;
  errors: Record<string, string>;
}) {
  const common = { error: errors[field.name] };
  switch (field.type) {
    case 'textarea':
      return (
        <Field label={field.label} hint={field.hint} {...common}>
          <TextArea value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case 'number':
      return (
        <Field label={field.label} hint={field.hint} {...common}>
          <TextInput type="number" value={String(value ?? '')} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
        </Field>
      );
    case 'toggle':
      return (
        <div className="py-2">
          <Toggle checked={Boolean(value)} onChange={onChange} label={field.label} />
        </div>
      );
    case 'date':
      return (
        <Field label={field.label} hint={field.hint} {...common}>
          <TextInput type="date" value={typeof value === 'string' ? String(value).slice(0, 10) : ''} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case 'json': {
      const raw = value === null || value === undefined || value === '' ? '' : JSON.stringify(value, null, 2);
      return (
        <Field label={field.label} hint={field.hint} {...common}>
          <TextArea value={raw} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs min-h-[110px]" />
        </Field>
      );
    }
    case 'select':
      return (
        <Field label={field.label} hint={field.hint} {...common}>
          <Select options={field.options || []} value={String(value ?? '')} onChange={onChange} />
        </Field>
      );
    case 'url':
    case 'text':
    default:
      return (
        <Field label={field.label} hint={field.hint} {...common}>
          <TextInput value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
  }
}

export default function OwnerResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const [resource, setResource] = useState<string | null>(null);
  const [schema, setSchema] = useState<ResourceSchema | null>(null);
  useEffect(() => {
    params.then(({ resource: r }) => {
      setResource(r);
      setSchema(RESOURCE_SCHEMAS[r] || null);
    });
  }, [params]);

  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const page = Number(search.get('page') || '1');
  const perPage = 50;

  const load = useCallback(async () => {
    if (!resource) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/${resource}?page=${page}&per_page=${perPage}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      const body = await res.json();
      setRows(body.data || []);
      setCount(body.count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [resource, page]);

  useEffect(() => {
    if (resource) load();
  }, [resource, load]);

  if (!schema) {
    return <p className="text-rose-400">Resource tidak dikenal.</p>;
  }
  const s = schema;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !resource) return;
    setSaving(true);
    setErrors({});
    const isUpdate = Boolean(editing.id);
    try {
      const res = await fetch(`/api/admin/${resource}`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s.defaultNew, ...editing }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.fieldErrors) setErrors(body.fieldErrors);
        throw new Error(body.error || 'Gagal menyimpan');
      }
      setEditing(null);
      setIsNew(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!resource || !window.confirm('Yakin ingin menghapus item ini?')) return;
    const res = await fetch(`/api/admin/${resource}/${row.id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Gagal menghapus');
      return;
    }
    await load();
  }

    return (
    <div>
      <PageHeader
        title={s.title}
        desc={s.desc}
        actions={
          <Button variant="primary" onClick={() => { setEditing({ ...s.defaultNew }); setIsNew(true); setErrors({}); }}>
            + Tambah {s.singular}
          </Button>
        }
      />

      {error && <p className="text-sm text-rose-400 mb-4 bg-rose-500/10 rounded-lg px-4 py-2.5">{error}</p>}

      {loading ? (
        <Spinner label="Memuat data..." />
      ) : rows.length === 0 ? (
        <Empty text={`Belum ada ${s.singular.toLowerCase()}. Klik "Tambah" untuk membuat yang pertama.`} />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-slate-900/70 border border-white/10">
          <table className="w-full min-w-[640px]">
            <thead className="bg-white/5">
              <tr>
                <Th>#</Th>
                {s.columns?.map((c) => (
                  <Th key={c}>{s.fields.find((f) => f.name === c)?.label || c}</Th>
                ))}
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <Td>{(page - 1) * perPage + i + 1}</Td>
                  {(s.columns || []).map((c) => {
                    const val = row[c];
                    if (c === 'is_active' || c === 'featured' || c === 'is_current' || c === 'is_hidden' || c === 'is_synced') {
                      return (
                        <Td key={c}>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${val ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/50 text-slate-500'}`}>
                            {val ? 'Ya' : 'Tidak'}
                          </span>
                        </Td>
                      );
                    }
                    if (c === 'thumbnail' || c === 'cover_image' || c === 'image') {
                      const src = typeof val === 'string' && val ? val : null;
                      return (
                        <Td key={c}>
                          {src ? <img src={src} alt="" className="w-14 h-10 object-cover rounded-lg bg-slate-800" /> : <span className="text-slate-500">—</span>}
                        </Td>
                      );
                    }
                    const field = s.fields.find((f) => f.name === c);
                    return <Td key={c} className="max-w-[260px]"><span className="line-clamp-2">{fmtCell(val, field as AdminField)}</span></Td>;
                  })}
                  <Td className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditing({ ...row }); setIsNew(false); setErrors({}); }} className="inline-flex items-center px-2 min-h-10 text-cyan-400 hover:text-cyan-300 text-sm cursor-pointer">Edit</button>
                      <button onClick={() => remove(row)} className="inline-flex items-center px-2 min-h-10 text-rose-400 hover:text-rose-300 text-sm cursor-pointer">Hapus</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {count > perPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <span className="text-xs text-slate-500">Total {count} item</span>
              <div className="flex gap-2">
                <Button disabled={page <= 1} onClick={() => router.push(`${pathname}?page=${page - 1}`)}>← Sebelumnya</Button>
                <span className="text-sm text-slate-400 py-2">Hal {page} / {Math.ceil(count / perPage)}</span>
                <Button disabled={page >= Math.ceil(count / perPage)} onClick={() => router.push(`${pathname}?page=${page + 1}`)}>Berikutnya →</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={Boolean(editing !== null && schema)} onClose={() => { setEditing(null); setIsNew(false); }} title={`${isNew ? 'Tambah' : 'Edit'} ${s.singular}`} wide>
        <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {s.fields.map((f) => (
            <div key={f.name} className={f.type === 'textarea' || f.type === 'json' ? 'sm:col-span-2' : ''}>
              <FieldInput field={f} value={editing?.[f.name]} onChange={(v) => setEditing((prev) => ({ ...prev!, [f.name]: v }))} errors={errors} />
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button type="button" onClick={() => { setEditing(null); setIsNew(false); }}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
