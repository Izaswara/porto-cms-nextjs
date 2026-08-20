import { db } from '@/lib/db';
import type { Locale } from '@/lib/types';

export interface PublicHomeData {
  locale: Locale;
  translations: Record<string, string>;
  settings: Record<string, string | null>;
  theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    dark_bg: string | null;
  } | null;
  menus: { url: string; slug: string; name: string }[];
  hero: (Record<string, unknown> & { id: number }) | null;
  about: (Record<string, unknown> & { id: number }) | null;
  projects: (Record<string, unknown> & { id: number })[];
  skills: (Record<string, unknown> & { id: number })[];
  experiences: (Record<string, unknown> & { id: number })[];
  education: (Record<string, unknown> & { id: number })[];
  certificates: (Record<string, unknown> & { id: number })[];
  posts: (Record<string, unknown> & { id: number })[];
  socials: (Record<string, unknown> & { id: number })[];
  galleries: (Record<string, unknown> & { id: number })[];
  siteName: string;
}

export async function getHomeData(locale: Locale, translations: Record<string, string>): Promise<PublicHomeData> {
  const [settingsRes, themeRes, menusRes, {
    data: hero,
  }, {
    data: about,
  }, {
    data: projects,
  }, {
    data: skills,
  }, {
    data: experiences,
  }, {
    data: education,
  }, {
    data: certificates,
  }, {
    data: posts,
  }, {
    data: socials,
  }, {
    data: galleries,
  }] = await Promise.all([
    db().from('settings').select('key, value'),
    db().from('themes').select('*').eq('is_active', true).maybeSingle(),
    db().from('menus').select('url, slug, name').eq('is_active', true).eq('is_hidden', false).order('sort_order', { ascending: true }),
    db().from('hero_sections').select('*').eq('is_active', true).maybeSingle(),
    db().from('about_sections').select('*').eq('is_active', true).maybeSingle(),
    db().from('projects').select('*').eq('status', 'published').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(6),
    db().from('skills').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('experiences').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('education').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('certificates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
    db().from('social_media').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('galleries').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(3),
  ]);

  const settings: Record<string, string | null> = {};
  for (const row of settingsRes.data ?? []) settings[row.key] = row.value;

  const theme = themeRes.data
    ? {
        primary_color: (themeRes.data.primary_color as string) || '#ff3b4e',
        secondary_color: (themeRes.data.secondary_color as string) || '#ff7a3d',
        accent_color: (themeRes.data.accent_color as string) || '#ffd166',
        dark_bg: (themeRes.data.dark_bg as string) || null,
      }
    : null;

  return {
    locale,
    translations,
    settings,
    theme,
    menus: (menusRes.data ?? []).map((m) => ({ url: m.url ?? '#', slug: m.slug, name: m.name })),
    hero: hero ?? null,
    about: about ?? null,
    projects: projects ?? [],
    skills: skills ?? [],
    experiences: experiences ?? [],
    education: education ?? [],
    certificates: certificates ?? [],
    posts: posts ?? [],
    socials: socials ?? [],
    galleries: galleries ?? [],
    siteName: settings['site_name'] || 'Faiz Dev',
  };
}
