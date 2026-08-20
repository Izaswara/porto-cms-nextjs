import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import ViewTracker from '@/components/public/ViewTracker';

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
  return {
    title: seo?.meta_title || data.title,
    description: seo?.meta_description || data.excerpt || undefined,
    openGraph: {
      title: seo?.og_title || data.title,
      description: seo?.og_description || data.excerpt || undefined,
      images: mediaUrl(seo?.og_image || (data.cover_image as string)) ? [{ url: mediaUrl(seo?.og_image || (data.cover_image as string))! }] : undefined,
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

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <ViewTracker type="post" id={post.id as number} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <a href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">← Semua artikel</a>

        {post.category && (
          <p className="text-[11px] uppercase tracking-widest text-cyan-400 mt-6">{post.category}</p>
        )}
        <h1 className="font-[Space_Grotesk] text-3xl md:text-5xl font-bold text-white mt-3" data-reveal>
          {post.title}
        </h1>
        <p className="text-sm text-slate-500 mt-3">
          {formatDate(post.created_at as string, 'full')} · Owner
        </p>

        {post.cover_image && (
          <div className="mt-8 rounded-2xl overflow-hidden glow-ring" data-reveal="zoom">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(String(post.cover_image)) ?? ''} alt={post.title} className="w-full object-cover" />
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
                return <Tag key={i} className="font-[Space_Grotesk] text-white font-bold mt-6">{text}</Tag>;
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
