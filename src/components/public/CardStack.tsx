'use client';

import { useEffect, useRef } from 'react';
import GlassLens from '@/components/public/GlassLens';

/**
 * Vertical Card Stack / Sticky Scroll Card Slider.
 *
 * Kartu dipin di tengah viewport via `position: sticky` (murni CSS —
 * kompatibel dengan Lenis), lalu kartu berikutnya meluncur naik dari
 * bawah menumpuk kartu sebelumnya. Parallax berlapis (scale + rotate +
 * dim per kartu) dihitung dari progres scroll supaya terasa seperti
 * tumpukan kartu fisik yang digeser dinamis — tanpa dependensi GSAP.
 */

export interface StackCardItem {
  id: string | number;
  href?: string;
  image: string | null;
  alt: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  chips?: string[];
  cta?: string;
}

export function StackCards({ items }: { items: StackCardItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-deck-card]'));
    if (cards.length < 2) return;

    let ticking = false;
    let raf = 0;
    const apply = () => {
      ticking = false;
      const vh = window.innerHeight;
      const pinTop = vh * 0.12;
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        const r = el.getBoundingClientRect();
        // Progres mendekati garis pin (kartu "mendarat" dari bawah)
        const inP = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.5)));
        // Progres tertutup oleh kartu berikutnya (deck compression)
        let cover = 0;
        const next = cards[i + 1];
        if (next) {
          const rn = next.getBoundingClientRect();
          cover = Math.min(1, Math.max(0, (vh - rn.top) / (vh - pinTop)));
        }
        const eased = cover * cover * (3 - 2 * cover); // smoothstep
        const scale = (0.955 + 0.045 * inP) * (1 - 0.085 * eased);
        const ty = (1 - inP) * 40 - eased * 28;
        const rot = (i % 2 === 0 ? -1 : 1) * 1.4 * eased;
        el.style.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        el.style.filter = `brightness(${(1 - 0.42 * eased).toFixed(3)}) saturate(${(1 - 0.22 * eased).toFixed(3)})`;
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items.length]);

  return (
    <div ref={rootRef} className="vstack">
      {items.map((item, i) => {
        const inner = (
          <article className="deck-card group" data-deck-card style={{ zIndex: i + 1 }}>
            <div className="absolute inset-0 overflow-hidden grain grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:contrast-100 group-hover:scale-[1.03] transition-[filter,transform] duration-700 ease-out">
              {item.image ? (
                <GlassLens src={item.image} alt={item.alt} sizes="(max-width: 768px) 92vw, 780px" />
              ) : (
                <div className="w-full h-full grid place-items-center bg-neutral-950 text-6xl">🖼️</div>
              )}
              {/* Layer warna duotone — memudar saat hover, warna asli muncul */}
              <span className="tint-layer" aria-hidden="true" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
            <span className="absolute top-5 left-6 z-10 font-label text-[11px] tracking-[0.35em] text-white/60 uppercase">
              {item.eyebrow}
            </span>
            {/* Caption plat museum — senada simetri tick 4 sudut */}
            <span className="absolute top-5 right-6 z-10 font-mono-accent text-[10px] tracking-[0.35em] text-white/40 uppercase">
              Fig. {String(i + 1).padStart(2, '0')}
            </span>
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                {item.chips && item.chips.length > 0 && (
                  <p className="flex flex-wrap gap-x-2 gap-y-1 mb-3">
                    {item.chips.map((chip) => (
                      <span key={chip} className="deck-chip">{chip}</span>
                    ))}
                  </p>
                )}
                <h3 className="font-serif text-3xl sm:text-4xl text-white leading-tight text-balance">{item.title}</h3>
                {item.subtitle && <p className="text-sm text-slate-400 mt-2 max-w-md">{item.subtitle}</p>}
              </div>
              {item.cta && (
                <span className="deck-cta font-mono-accent text-[11px] uppercase tracking-[0.3em] text-white/70 group-hover:text-white transition-colors shrink-0">
                  {item.cta} →
                </span>
              )}
            </div>
          </article>
        );
        return item.href ? (
          <a key={item.id} href={item.href} className="vstack-card block w-[min(92vw,780px)] mx-auto no-underline">
            {inner}
          </a>
        ) : (
          <div key={item.id} className="vstack-card block w-[min(92vw,780px)] mx-auto">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/**
 * ProfilePin — foto profil DIBEDAKAN dari background:
 * kartu potret ala ID-card yang ter-pin saat section About discroll,
 * dengan parallax halus (tilt + scale). Tidak pernah dijadikan background.
 */
export function ProfilePin({ src, alt, name, role }: {
  src: string;
  alt: string;
  name: string;
  role?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const card = wrap.querySelector<HTMLElement>('[data-profile-card]');
    if (!card) return;

    let ticking = false;
    let raf = 0;
    const apply = () => {
      ticking = false;
      const sec = wrap.closest<HTMLElement>('section');
      if (!sec) return;
      const rs = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progres section About melewati viewport (0 → 1)
      const p = Math.min(1, Math.max(0, (vh - rs.top) / (rs.height * 0.85)));
      const eased = p * p * (3 - 2 * p);
      card.style.transform = `translate3d(0, ${(eased * -14).toFixed(2)}px, 0) rotate(${(-1.6 + eased * 2.4).toFixed(2)}deg) scale(${(1 - eased * 0.05).toFixed(4)})`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="profile-pin group md:sticky md:top-24 w-fit mx-auto md:mx-0 md:ml-auto">
      <figure data-profile-card className="profile-card" style={{ willChange: 'transform' }}>
        <div className="relative aspect-[4/5] w-72 sm:w-80 overflow-hidden rounded-[0.3rem] grain grayscale contrast-[1.06] transition-[filter] duration-700 ease-out group-hover:grayscale-0 group-hover:contrast-100">
          <GlassLens src={src} alt={alt} sizes="320px" />
          <span className="tint-layer" aria-hidden="true" />
        </div>
        {/* Plate kaca ala kartu profil */}
        <figcaption className="profile-plate">
          <span className="font-label text-[10px] tracking-[0.35em] text-white/55 uppercase">( Profile )</span>
          <span className="block font-serif text-xl text-white mt-1 leading-snug">{name}</span>
          <span className="plate-diamond" aria-hidden="true" />
          {role && <span className="block font-mono-accent text-[11px] text-slate-400 mt-2">{role}</span>}
        </figcaption>
        {/* Nama vertikal di sisi kiri — senada kartu hero */}
        <span className="vside-label vside-label--left font-mono-accent" aria-hidden="true">{name}</span>
      </figure>
    </div>
  );
}
