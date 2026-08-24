import type { Metadata } from 'next';
import Image from 'next/image';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Dokumentasi foto kegiatan, pekerjaan, dan pengalaman.',
  alternates: { canonical: '/gallery' },
  openGraph: { title: 'Gallery', url: '/gallery' },
};

/* Konten gallery jarang berubah — prerender + revalidate tiap 60 detik */
export const revalidate = 60;

export default async function GalleryPage() {
  const { data: galleries } = await db()
    .from('galleries')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const active = galleries ?? [];

  return (
    <div className="pt-28 pb-20 min-h-screen" data-book>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="aw-eyebrow mb-4"><span className="aw-num">/</span> <span className="aw-kanji">写真</span> Moments</p>
        <h1 className="section-heading text-white mb-2 text-balance">
          Photo <span className="text-gradient">Gallery</span>
        </h1>
        <p className="text-slate-500 mb-10">Dokumentasi pekerjaan & pengalaman saya.</p>
        {active.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 anime-stagger">
            {active.map((gallery) => {
              const images = Array.isArray(gallery.images) ? (gallery.images as string[]) : [];
              const cover = mediaUrl((gallery.cover_image as string | null) || images[0] || null);
              return (
                <a key={gallery.id} href={`/gallery/${gallery.slug}`} className="group">
                  <div className="plate-card overflow-hidden hover:-translate-y-1 transition-all">
                    <div className="relative aspect-video overflow-hidden">
                      {cover ? (
                        <Image src={cover} alt={gallery.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-[filter,transform] duration-700" />
                      ) : (
                        <div className="w-full h-full bg-white/[.03] flex items-center justify-center text-4xl">🖼️</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <div>
                          {gallery.category && (
                            <p className="font-mono-accent text-[10px] uppercase tracking-wider text-slate-400 mb-1">{gallery.category}</p>
                          )}
                          <h3 className="font-serif text-xl text-white">{gallery.title}</h3>
                        </div>
                      </div>
                      <span className="absolute top-3 right-3 font-mono-accent text-[10px] tracking-[0.2em] px-2 py-1 border border-white/15 bg-black/40 text-white/70">
                        {images.length} FOTO
                      </span>
                    </div>
                    {gallery.description && (
                      <div className="p-4">
                        <p className="text-sm text-slate-400 line-clamp-2">{gallery.description}</p>
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-20">
            <p className="text-4xl mb-3">📸</p>
            <p>Belum ada foto gallery.</p>
          </div>
        )}
      </div>
    </div>
  );
}
