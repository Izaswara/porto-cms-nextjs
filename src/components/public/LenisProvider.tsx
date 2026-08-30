'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * LenisProvider — inertia scrolling ala Lenis/Locomotive.
 *
 * Guliran roda diberi "bobot": halaman meluncur kenyal dan tidak
 * berhenti mendadak (lerp 0.11), persis feel situs Awwwards.
 *
 * - Anchor (#section) dianimasikan lewat lenis.scrollTo agar satu sumber
 *   gerakan (tidak bertabrakan dengan native smooth).
 * - prefers-reduced-motion → provider pasif, scroll native biasa.
 * - RevealEngine / hero-fade / LeftRail tetap bekerja karena Lenis
 *   tetap menggerakkan window scroll asli.
 */
export default function LenisProvider() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Low-end / jaringan lambat: gunakan scroll native (lebih hemat CPU-GPU),
    // fitur inertia tetap tersedia di medium ke atas.
    if (document.documentElement.getAttribute('data-performance') === 'low') return;

    const lenis = new Lenis({
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Anchor internal melalui lenis agar senada dengan inertia
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      // Beri tahu RevealEngine agar section tujuan (dan section yang
      // dilewati) langsung tampil penuh selama transisi anchor —
      // konten tidak boleh tertutup tirai/halaman buku saat lompat.
      window.dispatchEvent(new CustomEvent<HTMLElement>('anchor-jump', { detail: el }));
      // Durasi menyesuaikan jarak; easing easeInOutCubic (simetris) agar
      // kecepatan puncak wajar — default ease-out eksponensial melesat
      // ±15.000px/detik di awal dan membuat animasi reveal keteteran.
      const dist = Math.abs(el.getBoundingClientRect().top);
      const duration = Math.min(1.8, Math.max(0.8, dist / 4500));
      lenis.scrollTo(el, {
        offset: -16,
        duration,
        easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
