'use client';

import { useEffect } from 'react';

/**
 * Global scroll-reveal & micro-animations engine.
 *
 * Semua elemen ber-animasi-reveal (data-reveal, veil/curtain/img-reveal/
 * line, mask-group judul, anime-stagger, counter) dikumpulkan ke satu
 * registry dan dipicu oleh SATU sweep berbasis rAF — bukan
 * IntersectionObserver. Alasannya: saat lompatan anchor/smooth-scroll
 * cepat, elemen bisa menyeberangi viewport DI ANTARA dua sampel IO sehingga
 * tidak pernah ter-reveal (konten hilang permanen). Sweep geometri murni
 * tidak mungkin bolong: elemen di atas / di sekitar garis reveal selalu
 * ketahuan dari posisinya saja.
 */
export default function RevealEngine() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) return;

    // ── Registry reveal terpusat ──
    type Kind = 'reveal' | 'fx' | 'mask' | 'stagger' | 'counter';
    const FX_SELECTOR = '.page-veil, [data-curtain], [data-img-reveal], [data-line]';
    let pending: { el: HTMLElement; kind: Kind }[] = [];
    const seen = new WeakSet<HTMLElement>();

    const revealStaggerChildren = (container: HTMLElement) => {
      Array.from(container.children).forEach((child, i) => {
        const c = child as HTMLElement;
        c.classList.add('yo-reveal');
        c.style.transitionDelay = `${i * 0.08}s`;
        requestAnimationFrame(() => c.classList.add('yo-in'));
      });
    };

    /** Terapkan state "terlihat". instant = tanpa nunggu frame berikut. */
    const applyReveal = (item: { el: HTMLElement; kind: Kind }, instant = false) => {
      const { el, kind } = item;
      if (seen.has(el)) return;
      seen.add(el);
      if (kind === 'reveal') {
        el.classList.add('yo-reveal');
        if (instant) el.classList.add('yo-in');
        else requestAnimationFrame(() => el.classList.add('yo-in'));
      } else if (kind === 'fx') {
        el.classList.add('in-view');
      } else if (kind === 'mask') {
        el.classList.add('in');
      } else if (kind === 'stagger') {
        revealStaggerChildren(el);
      } else {
        // counter
        const target = Number(el.getAttribute('data-counter') || 0);
        const suffix = el.getAttribute('data-suffix') || '';
        const dur = 1400;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${Math.round(target * eased)}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    };

    pending = [
      ...Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).map((el) => {
        const dir = el.getAttribute('data-dir') || 'up';
        if (dir !== 'up') el.setAttribute('data-dir', dir);
        const delay = el.getAttribute('data-reveal-delay');
        if (delay) el.style.transitionDelay = `${Number(delay) * 0.1}s`;
        return { el, kind: 'reveal' as Kind };
      }),
      ...Array.from(document.querySelectorAll<HTMLElement>(FX_SELECTOR)).map((el) => ({ el, kind: 'fx' as Kind })),
      ...Array.from(document.querySelectorAll<HTMLElement>('.mask-group')).map((el) => ({ el, kind: 'mask' as Kind })),
      ...Array.from(document.querySelectorAll<HTMLElement>('.anime-stagger')).map((el) => ({ el, kind: 'stagger' as Kind })),
      ...Array.from(document.querySelectorAll<HTMLElement>('[data-counter]')).map((el) => ({ el, kind: 'counter' as Kind })),
    ];

    /**
     * Sweep: reveal semua elemen pending yang sudah berada PADA atau DI ATAS
     * garis reveal (bottom viewport - 40px), atau sedang memotong viewport.
     * `limitTop` opsional = batas bawah tambahan dalam koordinat viewport
     * (dipakai saat lompatan anchor agar seluruh isi section tujuan ikut
     * terbuka meski sebagian masih di bawah lipatan layar).
     * Baca rect DULU untuk semua elemen, baru tulis class — hindari layout thrash.
     */
    const sweep = (limitTop?: number) => {
      if (pending.length === 0) return;
      const limit = limitTop ?? window.innerHeight - 40;
      const still: typeof pending = [];
      const hit: typeof pending = [];
      for (const item of pending) {
        if (!item.el.isConnected) continue; // buang yang sudah lepas dari DOM
        const r = item.el.getBoundingClientRect();
        const pass = limitTop !== undefined ? r.top < limit : r.bottom <= limit || (r.top < limit && r.bottom > 0);
        if (pass) hit.push(item);
        else still.push(item);
      }
      pending = still;
      for (const item of hit) applyReveal(item);
    };

    let swRaf = 0;
    let swTicking = false;
    const onScrollSweep = () => {
      if (!swTicking) {
        swTicking = true;
        swRaf = requestAnimationFrame(() => {
          swTicking = false;
          sweep();
        });
      }
    };
    sweep();
    window.addEventListener('scroll', onScrollSweep, { passive: true });
    window.addEventListener('resize', onScrollSweep);

    // ── Hero fade: transisi bersih dari background foto ke hitam pekat ──
    // Sebuah overlay hitam memudar MASUK menutupi foto (bukan foto yang
    // memudar keluar) sehingga transisinya mulus tanpa sisa "ghost".
    // Progres di-mapping smoothstep agar akselerasinya terasa alami.
    const heroFade = document.querySelector<HTMLElement>('[data-hero-fade]');
    const heroFadeVeil = heroFade?.querySelector<HTMLElement>('[data-hero-veil]');
    let hfRaf = 0;
    let hfTicking = false;
    const applyHeroFade = () => {
      if (!heroFadeVeil) return;
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.8));
      const eased = p * p * (3 - 2 * p); // smoothstep
      heroFadeVeil.style.opacity = eased.toFixed(3);
      hfTicking = false;
    };
    const onHeroFadeScroll = () => {
      if (hfTicking) return;
      hfTicking = true;
      hfRaf = requestAnimationFrame(applyHeroFade);
    };
    if (heroFadeVeil) {
      applyHeroFade();
      window.addEventListener('scroll', onHeroFadeScroll, { passive: true });
    }

    // Smooth scroll parallax for [data-parallax] — offset di-cache, tanpa getBoundingClientRect per frame
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    const parData = parallaxEls.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cy: r.top + window.scrollY + r.height / 2, speed: Number(el.getAttribute('data-parallax')) || 0.1 };
    });
    const reMeasurePar = () => {
      for (const d of parData) {
        const r = d.el.getBoundingClientRect();
        d.cy = r.top + window.scrollY + r.height / 2;
      }
    };
    let pTarget = window.scrollY;
    let pRaf = 0;
    let pRunning = false;
    const parallaxLoop = () => {
      const sy = window.scrollY;
      const vh = window.innerHeight;
      for (const d of parData) {
        const center = d.cy - sy;
        const offset = (center - vh / 2) / vh;
        d.el.style.transform = `translate3d(0, ${(-offset * d.speed * 320).toFixed(2)}px, 0)`;
      }
      if (Math.abs(sy - pTarget) < 0.05) {
        pRunning = false;
        return;
      }
      pRaf = requestAnimationFrame(parallaxLoop);
    };
    const onParallaxScroll = () => {
      pTarget = window.scrollY;
      if (!pRunning) {
        pRunning = true;
        pRaf = requestAnimationFrame(parallaxLoop);
      }
    };
    if (parallaxEls.length > 0) {
      onParallaxScroll();
      window.addEventListener('scroll', onParallaxScroll, { passive: true });
    }

    // Re-measure setelah layout stabil (resize, load)
    window.addEventListener('resize', reMeasurePar);
    window.addEventListener('load', reMeasurePar);
    window.setTimeout(reMeasurePar, 4000);

    // ── Book Flip: tiap section adalah HALAMAN buku yang membuka/menutup
    // mengikuti posisi scroll (bolak-balik).
    // Posisi diukur dari OFFSET LAYOUT murni (di-cache, bebas pengaruh
    // transform) — bukan getBoundingClientRect yang ikut bergeser saat
    // elemen dirotasi, sehingga tidak ada feedback loop dan halaman tidak
    // pernah nyangkut setengah terbuka. ──
    const bookEls = Array.from(document.querySelectorAll<HTMLElement>('[data-book]'));
    const bookHeights: number[] = [];
    // Section yang dipaksa terbuka penuh (tujuan & yang dilewati saat
    // lompatan anchor) — dinonaktifkan lagi begitu user scroll manual.
    const forcedOpen = new Set<HTMLElement>();
    let bkRaf = 0;
    let bkTicking = false;
    let onBkScroll: (() => void) | null = null;
    let onBkResize: (() => void) | null = null;
    let bkMeasure: () => void = () => {};
    let clearBookStyle: (el: HTMLElement) => void = () => {};
    let remeasure: () => void = () => {};
    let bkTops: number[] = [];
    if (bookEls.length > 0) {
      document.documentElement.classList.add('book-ready');
      // Halaman buku terbuka penuh. PENTING: opacity WAJIB di-set '1'
      // inline — CSS dasar `html.book-ready [data-book] { opacity: 0 }`
      // menyembunyikan section, jadi mengosongkan inline style membuat
      // section menghilang justru saat user sedang membacanya.
      // Transform tetap dibersihkan agar position:sticky di dalamnya mulus.
      const openBookPage = (el: HTMLElement) => {
        el.style.transform = '';
        el.style.transformOrigin = '';
        el.style.opacity = '1';
        el.style.filter = '';
        el.style.willChange = '';
      };
      clearBookStyle = openBookPage;
      bkMeasure = () => {
        // Bersihkan dulu supaya pengukuran = posisi layout murni
        for (const el of bookEls) {
          el.style.transform = '';
          el.style.transformOrigin = '';
          el.style.opacity = '';
          el.style.filter = '';
          el.style.willChange = '';
        }
        const sy = window.scrollY;
        bkTops = bookEls.map((el) => el.getBoundingClientRect().top + sy);
        bookHeights.length = 0;
        for (const el of bookEls) bookHeights.push(el.offsetHeight);
      };
      const applyFlip = () => {
        bkTicking = false;
        const vh = window.innerHeight || 1;
        const sy = window.scrollY;
        for (let i = 0; i < bookEls.length; i++) {
          const el = bookEls[i];
          if (forcedOpen.has(el)) {
            clearBookStyle(el);
            continue;
          }
          const relTop = bkTops[i] - sy;                 // posisi atas section thd viewport
          const relBottom = relTop + (bookHeights[i] || el.offsetHeight);
          const start = vh * 1.02;                       // mulai saat memasuki layar
          const travel = vh * 0.72;                      // rata sempurna di ~30% tinggi layar
          let p = Math.min(1, Math.max(0, (start - relTop) / travel));
          // Section pendek / di ujung halaman: kalau seluruh section sudah
          // muat di layar, dianggap terbuka penuh — mencegah halaman
          // "nyangkut" setengah redup karena scroll mentok di bawah.
          if (relBottom <= vh * 0.94) p = 1;
          if (p >= 1) {
            clearBookStyle(el);
            continue;
          }
          const e = p * p * (3 - 2 * p); // smoothstep
          el.style.willChange = 'transform, opacity, filter';
          el.style.transformOrigin = '50% 0%';
          el.style.transform = `perspective(1600px) rotateX(${((1 - e) * 34).toFixed(2)}deg) translateY(${((1 - e) * 9).toFixed(2)}vh) scale(${(0.975 + e * 0.025).toFixed(4)})`;
          el.style.opacity = (0.3 + e * 0.7).toFixed(3);
          el.style.filter = `brightness(${(0.55 + e * 0.45).toFixed(3)})`;
        }
      };
      onBkScroll = () => {
        if (!bkTicking) {
          bkTicking = true;
          bkRaf = requestAnimationFrame(applyFlip);
        }
      };
      onBkResize = () => {
        bkMeasure();
        onBkScroll?.();
      };
      bkMeasure();
      applyFlip();
      window.addEventListener('scroll', onBkScroll, { passive: true });
      window.addEventListener('resize', onBkResize);
      // Ukuran berubah setelah gambar/font termuat — ukur ulang lalu
      // LANGSUNG terapkan flip: bkMeasure membersihkan inline opacity,
      // tanpa applyFlip section akan blink invisible (CSS dasar = opacity 0).
      remeasure = () => {
        bkMeasure();
        onBkScroll?.();
      };
      window.addEventListener('load', remeasure);
      window.setTimeout(remeasure, 1500);
      window.setTimeout(remeasure, 4000);
    }

    // ── Lompatan anchor (klik menu): ukur ulang posisi, paksa buka halaman
    // buku dari posisi sekarang sampai section tujuan, dan reveal SEMUA
    // konten yang dilewati/itu sendiri — konten tidak mungkin hilang di
    // tengah transisi. Efek normal kembali saat user scroll manual. ──
    const onAnchorJump = (e: Event) => {
      const target = (e as CustomEvent<HTMLElement | undefined>).detail;
      if (!target) return;
      if (bookEls.length > 0) {
        bkMeasure(); // posisi segar — layout bisa bergeser sejak ukur terakhir
        const ty = target.getBoundingClientRect().top + window.scrollY;
        for (let i = 0; i < bookEls.length; i++) {
          if ((bkTops[i] ?? Infinity) <= ty + 4) {
            forcedOpen.add(bookEls[i]);
            clearBookStyle(bookEls[i]);
          }
        }
        onBkScroll?.();
      }
      // Reveal paksa: semua konten dari posisi sekarang sampau dasar section tujuan
      const targetBottomView = target.getBoundingClientRect().bottom;
      sweep(targetBottomView);
      onScrollSweep(); // lanjutkan sweep normal pada frame berikutnya
    };
    const restoreFx = () => forcedOpen.clear();
    window.addEventListener('anchor-jump', onAnchorJump);
    window.addEventListener('wheel', restoreFx, { passive: true });
    window.addEventListener('touchmove', restoreFx, { passive: true });
    window.addEventListener('keydown', restoreFx);

    return () => {
      window.removeEventListener('anchor-jump', onAnchorJump);
      window.removeEventListener('wheel', restoreFx);
      window.removeEventListener('touchmove', restoreFx);
      window.removeEventListener('keydown', restoreFx);
      window.removeEventListener('scroll', onScrollSweep);
      window.removeEventListener('resize', onScrollSweep);
      if (onBkScroll && onBkResize) {
        window.removeEventListener('scroll', onBkScroll);
        window.removeEventListener('resize', onBkResize);
      }
      window.removeEventListener('load', remeasure);
      cancelAnimationFrame(swRaf);
      cancelAnimationFrame(bkRaf);
    };
  }, []);

  return null;
}
