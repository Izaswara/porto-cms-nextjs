import { unstable_cache } from 'next/cache';
import { db } from './db';
import { LOCALES, type Locale } from './types';

export function isValidLocale(value: string | null | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : 'id';
}

/** Muat semua terjemahan untuk satu locale (cache 60s per locale) */
export const getTranslations = unstable_cache(
  async (locale: Locale): Promise<Record<string, string>> => {
    const { data } = await db().from('translations').select('group, key, value').eq('locale', locale);
    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      const mapKey = row.group && row.group !== '*' ? `${row.group}.${row.key}` : row.key;
      if (row.value != null) map[mapKey] = row.value;
    }
    return map;
  },
  ['translations'],
  { revalidate: 60, tags: ['translations'] }
);

export function translate(
  map: Record<string, string>,
  key: string,
  fallback: string
): string {
  return map[key] ?? fallback;
}
