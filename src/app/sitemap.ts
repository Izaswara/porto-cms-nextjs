import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/cache';
import { siteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/gallery`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  try {
    const { posts, projects, galleries } = await getSitemapEntries();
    return [
      ...staticRoutes,
      ...projects.map((p) => ({
        url: `${base}/projects/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
      ...posts.map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
      ...galleries.map((g) => ({
        url: `${base}/gallery/${g.slug}`,
        lastModified: g.updated_at ? new Date(g.updated_at) : undefined,
        changeFrequency: 'yearly' as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // DB belum siap (mis. saat build) — minimal kembalikan route statis
    return staticRoutes;
  }
}
