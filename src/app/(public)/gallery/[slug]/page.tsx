import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { GalleryGrid } from '@/components/public/Lightbox';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await db()
    .from('galleries')
    .select('title, description, cover_image')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) return { title: 'Gallery' };
  const image = mediaUrl(String(data.cover_image ?? ''));
  return {
    title: data.title,
    description: data.description || undefined,
    alternates: { canonical: `/gallery/${slug}` },
    openGraph: {
      title: data.title,
      description: data.description || undefined,
      url: `/gallery/${slug}`,
      images: image ? [{ url: image, alt: data.title }] : undefined,
    },
  };
}

export default async function GalleryShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: gallery } = await db()
    .from('galleries')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!gallery) notFound();

  const images = (Array.isArray(gallery.images) ? (gallery.images as string[]) : []).map((p) => mediaUrl(p) ?? p);

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <a href="/gallery" className="text-sm text-slate-400 hover:text-white transition-colors">← Kembali ke Gallery</a>

        <h1 className="font-display text-3xl md:text-5xl font-bold text-white mt-6" data-reveal>
          {gallery.title}
        </h1>

        <div className="flex flex-wrap gap-2 mt-4" data-reveal>
          {gallery.category && (
            <span className="font-mono-accent px-3 py-1 rounded-full text-xs text-slate-300 bg-white/5">{gallery.category}</span>
          )}
          {gallery.event_date && (
            <span className="px-3 py-1 rounded-full text-xs text-slate-400 bg-white/5">📅 {formatDate(gallery.event_date as string, 'dmy')}</span>
          )}
          {gallery.location && (
            <span className="px-3 py-1 rounded-full text-xs text-slate-400 bg-white/5">📍 {gallery.location}</span>
          )}
          <span className="px-3 py-1 rounded-full text-xs text-slate-400 bg-white/5">🖼️ {images.length} foto</span>
        </div>

        {gallery.description && (
          <p className="text-slate-400 mt-6 max-w-3xl" data-reveal>{gallery.description}</p>
        )}

        {images.length > 0 ? (
          <GalleryGrid images={images} label={gallery.title} />
        ) : (
          <p className="text-center text-slate-500 mt-12">Album ini belum memiliki foto.</p>
        )}
      </div>
    </div>
  );
}
