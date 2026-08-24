import GlassLens from '@/components/public/GlassLens';
import { mediaUrl } from '@/lib/db';
import type { ShowcaseRow } from '@/lib/cache';

/**
 * ShowcaseSection — section foto full-bleed "fit" ala Izanami.
 *
 * - Foto mengisi lebar layar penuh (h-[72vh]) dengan parallax halus
 *   ([data-parallax] digerakkan RevealEngine).
 * - Reveal: clip-path membuka dari tengah + inner zoom-out saat masuk
 *   viewport ([data-img-reveal]).
 * - Scrim hitam atas & bawah supaya menyatu mulus dengan section
 *   hitam pekat di sekitarnya.
 * - Judul Playfair + sub-judul Mincho overlay di kiri-bawah,
 *   nomor urut Cinzel di kanan-atas.
 * - Foto tampil grayscale (kohesif dengan tema B&W), hover → berwarna.
 */
export default function ShowcaseSection({
  item,
  index,
}: {
  item: ShowcaseRow;
  index: number;
}) {
  const src = mediaUrl(item.image);
  const num = String(index + 1).padStart(2, '0');

  return (
    <section data-book className="relative h-[72vh] min-h-[420px] overflow-hidden" aria-label={item.title ?? 'Showcase'}>
      <div data-parallax="0.12" className="absolute inset-[-12%_0]">
        <div data-img-reveal className="group absolute inset-0 grayscale transition-[filter] duration-700 hover:grayscale-0">
          {src ? (
            <GlassLens src={src} alt={item.title ?? 'Showcase'} sizes="100vw" />
          ) : (
            <div className="w-full h-full bg-neutral-950" />
          )}
          <span className="tint-layer" aria-hidden="true" />
        </div>
      </div>

      {/* Scrim: menyatu ke hitam pekat di atas & bawah */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/25 to-black/70" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Nomor urut kanan-atas */}
      <span className="absolute top-8 right-6 sm:right-12 font-label text-xs tracking-[0.3em] text-white/70">
        {num}
      </span>

      {/* Judul + sub-judul kiri-bawah */}
      <div className="absolute bottom-10 left-5 sm:px-[7vw] sm:left-[7vw] right-5 z-10">
        {item.title && (
          <h3 className="font-serif text-3xl sm:text-5xl text-white leading-tight">{item.title}</h3>
        )}
        {item.subtitle && (
          <p className="font-body-serif text-slate-300 mt-3 text-sm sm:text-base" style={{ lineHeight: 1.9 }}>
            {item.subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
