import { db } from './db';
import { LOCALES, type Locale } from './types';

export function isValidLocale(value: string | null | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : 'id';
}

/** Muat semua terjemahan untuk satu locale: { "group.key" atau "key": value } */
export async function getTranslations(locale: Locale): Promise<Record<string, string>> {
  const { data } = await db().from('translations').select('group, key, value').eq('locale', locale);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const mapKey = row.group && row.group !== '*' ? `${row.group}.${row.key}` : row.key;
    if (row.value != null) map[mapKey] = row.value;
  }
  return map;
}

export function translate(
  map: Record<string, string>,
  key: string,
  fallback: string
): string {
  return map[key] ?? fallback;
}
