import { db } from './db';
import { isValidLocale, getTranslations } from './i18n';
import type { Locale } from './types';

export interface PublicSiteData {
  settings: Record<string, string | null>;
  theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    dark_bg: string | null;
    glass_effect: boolean;
    animation_speed: string;
    typography: string;
    border_radius: string;
    dark_mode: boolean;
  } | null;
  menus: { url: string; slug: string; name: string }[];
  locale: Locale;
  translations: Record<string, string>;
}

/** Data yang dibutuhkan layout publik (settings, theme aktif, menus, translations) */
export async function getPublicSiteData(localeValue?: string | null): Promise<PublicSiteData> {
  const [settingsRes, themeRes, menusRes] = await Promise.all([
    db().from('settings').select('key, value'),
    db().from('themes').select('*').eq('is_active', true).maybeSingle(),
    db().from('menus').select('url, slug, name').eq('is_active', true).eq('is_hidden', false).order('sort_order', { ascending: true }),
  ]);

  const settings: Record<string, string | null> = {};
  for (const row of settingsRes.data ?? []) settings[row.key] = row.value;

  const theme = themeRes.data
    ? {
        primary_color: (themeRes.data.primary_color as string) || '#ff3b4e',
        secondary_color: (themeRes.data.secondary_color as string) || '#ff7a3d',
        accent_color: (themeRes.data.accent_color as string) || '#ffd166',
        dark_bg: (themeRes.data.dark_bg as string) || null,
        glass_effect: Boolean(themeRes.data.glass_effect),
        animation_speed: (themeRes.data.animation_speed as string) || 'normal',
        typography: (themeRes.data.typography as string) || 'inter',
        border_radius: (themeRes.data.border_radius as string) || '0.5rem',
        dark_mode: Boolean(themeRes.data.dark_mode),
      }
    : null;

  const locale = isValidLocale(localeValue);
  const translations = await getTranslations(locale);

  return {
    settings,
    theme,
    menus: (menusRes.data ?? []).map((m) => ({
      url: m.url ?? '#',
      slug: m.slug,
      name: m.name,
    })),
    locale,
    translations,
  };
}

export function t(map: Record<string, string>, key: string, fallback: string): string {
  return map[key] ?? fallback;
}
