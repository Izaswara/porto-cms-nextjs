import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';

export const metadata: Metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  const { data: galleries } = await db()
    .from('galleries')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const active = galleries ?? [];

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="font-[Space_Grotesk] text-4xl font-bold text-white mb-2">
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
                  <div className="glass-card rounded-xl overflow-hidden hover:-translate-y-1 transition-all">
                    <div className="relative aspect-video overflow-hidden">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={gallery.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-white/[.03] flex items-center justify-center text-4xl">🖼️</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                        <div>
                          {gallery.category && (
                            <p className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">{gallery.category}</p>
                          )}
                          <h3 className="font-semibold text-white">{gallery.title}</h3>
                          <p className="text-[11px] text-slate-300 mt-1">{images.length} foto</p>
                        </div>
                      </div>
                      <span className="absolute top-3 right-3 glass-card rounded-lg px-2 py-1 text-[10px] text-white">
                        {images.length} foto
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
