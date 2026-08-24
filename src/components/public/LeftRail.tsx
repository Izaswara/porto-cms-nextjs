'use client';

import { useEffect, useState } from 'react';

/**
 * LeftRail — rail kiri tetap ala header Izanami.
 *
 * Isi HANYA dua hal, keduanya tersusun vertikal (huruf ditumpuk):
 *  1. Logo brand (huruf dari siteName) di atas — klik menuju #home
 *  2. Judul section yang sedang aktif, berganti otomatis lewat
 *     scroll-spy (IntersectionObserver dengan pita deteksi di tengah
 *     layar), ditemani animasi huruf berjenjang saat berganti.
 *
 * Muncul mulai layar xl; di bawahnya sembunyi agar mobile bersih.
 * Container pointer-events-none — hanya logo yang bisa diklik.
 */

const LABELS: Record<string, string> = {
  home: 'Home',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Career',
  education: 'Education',
  certificates: 'Awards',
  blog: 'Journal',
  'gallery-home': 'Gallery',
  contact: 'Contact',
};

export default function LeftRail({ siteName }: { siteName: string }) {
  const [current, setCurrent] = useState('Home');

  useEffect(() => {
    const sections = Object.keys(LABELS)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    // Pita deteksi: section yang memotong zona 40%–45% tinggi layar
    // dianggap "aktif" — akurat mengikuti posisi baca mata.
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) setCurrent(LABELS[en.target.id] ?? 'Home');
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const logoLetters = [...siteName.replace(/\s/g, '')];

  return (
    <div className="fixed left-0 top-0 z-40 hidden h-full w-16 xl:flex flex-col items-center pt-24 pb-10 pointer-events-none select-none">
      {/* 0) Logo mark — bingkai hairline + diamond, di ATAS huruf nama
          (posisi persis seperti mark IZANAMI di atas teksnya) */}
      <a href="#home" className="pointer-events-auto group flex flex-col items-center" aria-label={siteName}>
        <span className="logo-mark-rail" aria-hidden="true">
          <span className="lmd" />
        </span>

        {/* 1) Nama vertikal — huruf ditumpuk tepat di bawah mark */}
        <span className="flex flex-col items-center gap-[2px] leading-none mt-4">
          {logoLetters.map((ch, i) => (
            <span
              key={i}
              className="font-serif text-[15px] text-white transition-colors drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
            >
              {ch}
            </span>
          ))}
        </span>
      </a>

      {/* Pemisah hairline halus */}
      <span className="w-px h-6 bg-white/25 my-4" aria-hidden="true" />

      {/* 2) Judul section aktif — DI TENGAH vertikal layar (absolute) */}
      <div
        key={current}
        className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center font-mono-accent text-[11px] uppercase text-white/80"
        style={{ letterSpacing: '0.1em' }}
        aria-label={current}
      >
        {[...current].map((ch, i) => (
          <span
            key={i}
            className="rail-letter drop-shadow-[0_1px_5px_rgba(0,0,0,0.9)]"
            style={{ animationDelay: `${i * 28}ms` }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
