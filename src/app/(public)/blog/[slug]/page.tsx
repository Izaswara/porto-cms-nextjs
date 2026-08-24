import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import { getSettings } from '@/lib/cache';
import { formatDate } from '@/lib/utils';
import ViewTracker from '@/components/public/ViewTracker';
import JsonLd from '@/components/public/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await db()
    .from('posts')
    .select('title, excerpt, cover_image, seo')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!data) return { title: 'Blog' };
  const seo = data.seo as Record<string, string> | null;
  const title = seo?.meta_title || data.title;
  const description = seo?.meta_description || data.excerpt || undefined;
  const image = mediaUrl(seo?.og_image || (data.cover_image as string));
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      url: `/blog/${slug}`,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: post } = await db()
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!post) notFound();

  const tags = Array.isArray(post.tags) ? (post.tags as string[]) : [];
  const cover = mediaUrl(String(post.cover_image ?? ''));
  const siteName = (await getSettings())['site_name'] || 'Faiz Dev';
  const postJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: String(post.title),
    description: String(post.excerpt ?? ''),
    image: cover ? [cover] : undefined,
    datePublished: post.created_at as string | undefined,
    dateModified: (post.updated_at as string | undefined) ?? (post.created_at as string | undefined),
    author: { '@type': 'Person', name: siteName, url: siteUrl() },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl()}/blog/${slug}` },
    keywords: tags.length > 0 ? tags.join(', ') : undefined,
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <JsonLd data={postJsonLd} />
      <ViewTracker type="post" id={post.id as number} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <a href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">← Semua artikel</a>

        {post.category && (
          <p className="font-mono-accent text-[11px] uppercase tracking-[.25em] text-slate-500 mt-6">{post.category}</p>
        )}
        <h1 className="font-display text-3xl md:text-5xl font-bold text-white mt-3" data-reveal>
          {post.title}
        </h1>
        <p className="text-sm text-slate-500 mt-3">
          {formatDate(post.created_at as string, 'full')} · Owner
        </p>

        {post.cover_image && (
          <div className="relative mt-8 aspect-video overflow-hidden border border-white/10 group" data-reveal="zoom">
            <Image src={mediaUrl(String(post.cover_image)) ?? ''} alt={String(post.title)} fill sizes="(max-width: 896px) 100vw, 896px" priority className="object-cover grayscale-[60%] contrast-[1.04] group-hover:grayscale-0 transition-[filter] duration-700" />
          </div>
        )}

        <div className="mt-8 text-slate-300 leading-relaxed space-y-4" data-reveal>
          {String(post.content ?? '')
            .split('\n')
            .map((line, i) => {
              if (/^#{1,6}\s/.test(line)) {
                const level = line.match(/^(#+)/)?.[1].length || 1;
                const text = line.replace(/^#+\s/, '');
                const Tag = (`h${Math.min(level + 1, 6)}`) as keyof React.JSX.IntrinsicElements;
                return <Tag key={i} className="font-display text-white font-bold mt-6">{text}</Tag>;
              }
              if (/^\s*[-*]\s/.test(line)) {
                return (
                  <ul key={i} className="list-disc list-inside text-slate-400">
                    <li>{line.replace(/^\s*[-*]\s/, '')}</li>
                  </ul>
                );
              }
              return <p key={i}>{line || '\u00A0'}</p>;
            })}
        </div>

        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2" data-reveal>
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-slate-400 text-xs">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
