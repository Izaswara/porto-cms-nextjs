import { db } from './db';

/** Slug generator — padanan Str::slug */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Parse JSON dengan fallback — dipakai untuk kolom jsonb string dari form */
export function parseJsonArray(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fallback ke CSV
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseJsonObject<T = Record<string, unknown>>(input: string): T | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

/** Pastikan input tidak mengandung karakter tidak aman pada file path */
export function safeBasename(name: string): string {
  return name.replace(/[/\\]/g, '_').trim();
}

export function formatDate(input: string | null | undefined, fmt: 'dmy' | 'my' | 'y' | 'full' | 'long' | 'short' | 'mdY' = 'dmy'): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  switch (fmt) {
    case 'mdY':
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
    case 'dmy':
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    case 'my':
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    case 'y':
      return String(d.getFullYear());
    case 'full':
      return `${monthsFull[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
    case 'long':
      return `${monthsFull[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    case 'short':
      return `${monthsFull[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
  }
}

export function timeAgo(input: string | null | undefined): string {
  if (!input) return '';
  const then = new Date(input).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) return 'baru saja';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} bulan lalu`;
  return `${Math.floor(month / 12)} tahun lalu`;
}

export function fileSizeLabel(bytes: number | null | undefined): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function truncate(text: string | null | undefined, length = 100): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/[#*`>_-]/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? clean.slice(0, length) + '…' : clean;
}

/** Ambil nilai dari tabel settings, padanan Setting::get() */
export async function getSetting(key: string, fallback: string | null = null): Promise<string | null> {
  const { data } = await db().from('settings').select('value').eq('key', key).single();
  return (data?.value as string | null) ?? fallback;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const { data } = await db().from('settings').select('key, value').in('key', keys);
  const map: Record<string, string | null> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  for (const k of keys) if (!(k in map)) map[k] = null;
  return map;
}
