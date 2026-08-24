'use client';

import { useEffect, useState } from 'react';

/**
 * Preloader — layar pembuka ala Izanami:
 *
 *  - Curtain hitam pekat menutup seluruh layar saat halaman dimuat.
 *  - Counter persentase 0 → 100 dengan easing organik (cepat di awal,
 *    melambat mendekati 100) + garis progres hairline.
 *  - Quote filosofis + aksen kanji di tengah untuk kesan eksklusif.
 *  - Di 100%: jeda sejenak, lalu curtain memudar & dibongkar dari DOM.
 *
 * Detail teknis:
 *  - Selama loading, body diberi kelas .is-loading → animasi entrance
 *    hero (fade-up / hero-letter) dijeda agar terlihat SETELAH curtain
 *    terbuka, bukan terlewat di baliknya.
 *  - Tanpa JavaScript: <noscript> menyembunyikan preloader.
 *  - prefers-reduced-motion → preloader dilewati total.
 *  - Hanya tampil sekali per pemuatan penuh (layout App Router tidak
 *    me-remount saat navigasi client-side).
 */
export default function Preloader() {
  const [pct, setPct] = useState(0);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGone(true);
      return;
    }

    document.body.classList.add('is-loading');
    document.body.style.overflow = 'hidden';

    const DURATION = 2000;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.2); // cepat → melambat mendekati 100
      setPct(Math.min(100, Math.floor(eased * 100)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPct(100);
        // Tahan sejenak di 100, lalu buka curtain
        setTimeout(() => {
          setFading(true);
          document.body.classList.remove('is-loading');
          document.body.style.overflow = '';
          setTimeout(() => setGone(true), 800);
        }, 380);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove('is-loading');
      document.body.style.overflow = '';
    };
  }, []);

  if (gone) return null;

  return (
    <div
      id="preloader"
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Quote filosofis + aksen kanji */}
      <p className="font-jp text-copper text-sm tracking-[0.5em] mb-6" style={{ color: '#d4d4d4' }}>
        静けさ
      </p>
      <p className="font-serif italic text-2xl sm:text-3xl text-white/90 text-center px-6 max-w-xl leading-relaxed">
        &ldquo;Ketenangan adalah ruang
        <br />
        bagi ide-ide besar.&rdquo;
      </p>
      <p className="font-label text-[10px] uppercase tracking-[0.45em] text-white/40 mt-6">
        Faiz Dev — Portfolio
      </p>

      {/* Counter + progress bar */}
      <div className="absolute bottom-10 left-6 sm:left-12 right-6 sm:right-12">
        <div className="h-px w-full bg-white/15 overflow-hidden">
          <div
            className="h-full bg-white transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-end justify-between mt-4">
          <span className="font-label text-[10px] uppercase tracking-[0.4em] text-white/40">
            Loading
          </span>
          <span className="font-serif text-5xl sm:text-6xl text-white leading-none tabular-nums">
            {pct}
            <span className="text-xl text-white/50 ml-1">%</span>
          </span>
        </div>
      </div>

      {/* Tanpa JS: preloader disembunyikan agar halaman tetap terbaca */}
      <noscript>
        <style>{'#preloader{display:none}'}</style>
      </noscript>
    </div>
  );
}
