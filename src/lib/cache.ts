import { unstable_cache } from 'next/cache';
import { db } from './db';
import type { SocialMediaRow } from './types';

export interface ShowcaseRow {
  id: number;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  section_position: string;
  is_active: boolean;
  sort_order: number;
}

/**
 * Cached read layer untuk data yang jarang berubah (settings, menus, socials,
 * translations, konten homepage). Mengurangi round-trip Supabase per kunjungan:
 * sekali dalam 60 detik cukup, pengunjung lain memakai cache.
 */

export const getSettings = unstable_cache(
  async (): Promise<Record<string, string | null>> => {
    const { data } = await db().from('settings').select('key, value');
    const map: Record<string, string | null> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  },
  ['site-settings'],
  { revalidate: 60, tags: ['settings'] }
);

export const getMenus = unstable_cache(
  async (): Promise<{ url: string; slug: string; name: string }[]> => {
    const { data } = await db()
      .from('menus')
      .select('url, slug, name')
      .eq('is_active', true)
      .eq('is_hidden', false)
      .order('sort_order', { ascending: true });
    return (data ?? []).map((m) => ({ url: m.url ?? '#', slug: m.slug, name: m.name }));
  },
  ['site-menus'],
  { revalidate: 60, tags: ['menus'] }
);

export const getSocials = unstable_cache(
  async (): Promise<SocialMediaRow[]> => {
    const { data } = await db()
      .from('social_media')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    return (data ?? []) as SocialMediaRow[];
  },
  ['site-socials'],
  { revalidate: 60, tags: ['socials'] }
);

export type ContentRow = Record<string, unknown> & { id: number };

export interface HomeContent {
  hero: Record<string, unknown> | null;
  about: Record<string, unknown> | null;
  projects: ContentRow[];
  skills: ContentRow[];
  experiences: ContentRow[];
  education: ContentRow[];
  certificates: ContentRow[];
  posts: ContentRow[];
  galleries: ContentRow[];
}

export const getHomeContent = unstable_cache(
  async (): Promise<HomeContent> => {
    const [hero, about, projects, skills, experiences, education, certificates, posts, galleries] =
      await Promise.all([
        db().from('hero_sections').select('*').eq('is_active', true).maybeSingle(),
        db().from('about_sections').select('*').eq('is_active', true).maybeSingle(),
        db().from('projects').select('*').eq('status', 'published').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(6),
        db().from('skills').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        db().from('experiences').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        db().from('education').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        db().from('certificates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        db().from('posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
        db().from('galleries').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(3),
      ]);
    return {
      hero: (hero.data as Record<string, unknown> | null) ?? null,
      about: (about.data as Record<string, unknown> | null) ?? null,
      projects: (projects.data as ContentRow[]) ?? [],
      skills: (skills.data as ContentRow[]) ?? [],
      experiences: (experiences.data as ContentRow[]) ?? [],
      education: (education.data as ContentRow[]) ?? [],
      certificates: (certificates.data as ContentRow[]) ?? [],
      posts: (posts.data as ContentRow[]) ?? [],
      galleries: (galleries.data as ContentRow[]) ?? [],
    };
  },
  ['home-content'],
  { revalidate: 60, tags: ['content'] }
);

/** Foto showcase full-bleed per posisi section (owner-managed).
 *  Fail-safe: jika tabel `showcase` belum dibuat (migrasi 06 belum
 *  dijalankan), kembalikan grup kosong — situs tetap hidup. */
export const getShowcase = unstable_cache(
  async (): Promise<Record<string, ShowcaseRow[]>> => {
    const byPos: Record<string, ShowcaseRow[]> = {
      after_hero: [],
      after_projects: [],
      after_experience: [],
      after_blog: [],
    };
    try {
      const { data, error } = await db()
        .from('showcase')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) return byPos;
      for (const row of (data ?? []) as ShowcaseRow[]) {
        const pos = row.section_position && byPos[row.section_position] ? row.section_position : 'after_projects';
        byPos[pos].push(row);
      }
    } catch {
      // tabel belum ada — abaikan
    }
    return byPos;
  },
  ['showcase'],
  { revalidate: 60, tags: ['showcase'] }
);
/** Semua slug konten publik — dipakai sitemap.ts */
export const getSitemapEntries = unstable_cache(
  async (): Promise<{ posts: { slug: string; updated_at: string | null }[]; projects: { slug: string; updated_at: string | null }[]; galleries: { slug: string; updated_at: string | null }[] }> => {
    const [posts, projects, galleries] = await Promise.all([
      db().from('posts').select('slug, updated_at').eq('status', 'published'),
      db().from('projects').select('slug, updated_at').eq('status', 'published'),
      db().from('galleries').select('slug, updated_at').eq('is_active', true),
    ]);
    return {
      posts: (posts.data as { slug: string; updated_at: string | null }[]) ?? [],
      projects: (projects.data as { slug: string; updated_at: string | null }[]) ?? [],
      galleries: (galleries.data as { slug: string; updated_at: string | null }[]) ?? [],
    };
  },
  ['sitemap-entries'],
  { revalidate: 3600 }
);
