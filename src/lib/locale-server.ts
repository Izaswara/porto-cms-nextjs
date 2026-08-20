import { cookies } from 'next/headers';
import type { Locale } from '@/lib/types';
import { isValidLocale, getTranslations } from '@/lib/i18n';

/** Baca locale aktif dari cookie/header (padanan session('locale')) */
export async function getRequestLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieLocale = store.get('locale')?.value;
  return isValidLocale(cookieLocale);
}
