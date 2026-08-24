'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALE_SHORT, type Locale } from '@/lib/types';
import { t } from '@/lib/public-data';
import VideoOverlay from './VideoOverlay';
import LocalTime from './LocalTime';

interface NavbarProps {
  menus: { url: string; slug: string; name: string }[];
  locale: Locale;
  translations: Record<string, string>;
  cvUrl?: string | null;
}

/**
 * Header minimal ala Izanami — TANPA bar navbar.
 * Hanya dua elemen melayang di kanan-atas:
 *   1. Pengubah bahasa "ID EN" — bahasa aktif ditandai titik di atasnya
 *      (pola • EN JA pada screenshot Izanami), klik = set cookie locale.
 *   2. Tombol "MENU / CLOSE" — membuka overlay navigasi fullscreen.
 * Logo & judul section hidup di LeftRail (rail kiri vertikal).
 */
export default function Navbar({ menus, locale, translations, cvUrl }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const menuOpenRef = useRef(false);
  const closingRef = useRef(false);
  const failSafeRef = useRef(0);
  // True saat user menavigasi via link menu — lock scroll dilepas seketika
  // agar transisi anchor (lenis.scrollTo) tidak tertahan overflow:hidden.
  const navigatingRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen || (closing && !navigatingRef.current) ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, closing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen, closing]);

  const finalizeClose = () => {
    clearTimeout(failSafeRef.current);
    if (!menuOpenRef.current) return;
    menuOpenRef.current = false;
    closingRef.current = false;
    navigatingRef.current = false;
    setMenuOpen(false);
    setClosing(false);
  };

  const closeMenu = (fast = false) => {
    if (!menuOpenRef.current || closingRef.current) return;
    closingRef.current = true;
    const video = document.getElementById('menu-video') as HTMLVideoElement | null;
    if (fast || !video || video.error || video.readyState < 1) {
      setClosing(true);
      failSafeRef.current = window.setTimeout(finalizeClose, 430);
      return;
    }
    // Video punya fade-out baked di akhir: seek mendekati akhir lalu biarkan
    // event `ended` yang menutup — transisi terasa sinematik.
    video.loop = false;
    const d = video.duration || 4;
    video.currentTime = Math.max(0, d - 0.9);
    video.play().catch(() => {});
    failSafeRef.current = window.setTimeout(finalizeClose, 2200);
  };

  const onMenuVideoEnded = () => {
    if (closingRef.current) finalizeClose();
  };

  useEffect(() => () => clearTimeout(failSafeRef.current), []);

  const toggleMenu = () => {
    if (menuOpenRef.current) closeMenu();
    else {
      menuOpenRef.current = true;
      closingRef.current = false;
      navigatingRef.current = false;
      setMenuOpen(true);
    }
  };

  return (
    <>
      {/* Elemen melayang kanan-atas — tanpa bar, tanpa latar */}
      <header className="fixed top-0 inset-x-0 z-50 pointer-events-none">
        <div className="flex items-center justify-end gap-10 sm:gap-16 px-6 sm:px-12 pt-8">
          {/* Bahasa: ID EN — aktif ditandai titik di atas (ala • EN JA) */}
          <div className="pointer-events-auto flex items-start gap-5">
            {(['id', 'en'] as Locale[]).map((l) => (
              <a
                key={l}
                href={`/locale/${l}`}
                className="relative flex flex-col items-center pt-2.5"
                aria-current={locale === l ? 'true' : undefined}
              >
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white transition-opacity duration-300 ${
                    locale === l ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`font-mono-accent text-[13px] tracking-[0.18em] transition-colors duration-300 ${
                    locale === l ? 'text-white' : 'text-white/45 hover:text-white/85'
                  }`}
                >
                  {LOCALE_SHORT[l]}
                </span>
              </a>
            ))}
          </div>

          {/* MENU / CLOSE — self-start: anchor top 2rem, persis sama dengan
              tombol CLOSE di overlay (#neural-close) supaya tombol terasa
              tidak pernah pindah tempat saat dibuka/ditutup */}
          <button
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="neural-menu"
            className="pointer-events-auto self-start font-mono-accent text-[13px] uppercase tracking-[0.3em] text-white/90 hover:text-white hover:opacity-60 transition-all"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>

      {/* Overlay navigasi fullscreen */}
      <div
        id="neural-menu"
        className={menuOpen ? 'open' : closing ? 'closing' : ''}
        aria-hidden={!menuOpen}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('a, button')) return;
          closeMenu();
        }}
      >
        {menuOpen && (
          <VideoOverlay
            id="menu-video"
            src="/videos/menu.mp4"
            variant="slide"
            loop
            preload="auto"
            onEnded={onMenuVideoEnded}
          />
        )}
        <button id="neural-close" className="neural-close font-mono-accent text-[13px] uppercase tracking-[0.3em]" onClick={() => closeMenu()} aria-label="Tutup menu">
          Close
        </button>
        <div className="neural-grid" />
        <div className="neural-scanline" />
        <div className="neural-emblem" aria-hidden="true">
          <i className="ne-em ne-1" /><i className="ne-em ne-2" /><i className="ne-em ne-3" />
        </div>
        <div className="neural-head" aria-hidden="true">
          <span className="neural-bracket nch" style={{ animationDelay: '80ms' }}>[</span>
          {'NAVIGATION'.split('').map((ch, i) => (
            <span key={i} className="nch" style={{ animationDelay: `${160 + i * 40}ms` }}>{ch}</span>
          ))}
          <span className="neural-bracket nch" style={{ animationDelay: '580ms' }}>]</span>
          <span className="neural-cursor nch" style={{ animationDelay: '660ms' }}>_</span>
        </div>
        <nav className="neural-nav">
          {menus.map((menu, i) => (
            <a
              key={menu.slug}
              href={menu.url}
              className="neural-link"
              onClick={() => {
                navigatingRef.current = true;
                closeMenu(true);
              }}
              style={{ '--i': i, '--count': menus.length } as React.CSSProperties}
            >
              <span className="neural-idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="neural-name">{t(translations, `menu.${menu.slug}`, menu.name)}</span>
              <span className="neural-arrow">→</span>
              <span className="neural-scan" />
            </a>
          ))}
        </nav>
        <div className="neural-foot">
          <span className="neural-status" style={{ color: 'var(--p-secondary)' }}>●</span>
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              CV ↗
            </a>
          )}
          <LocalTime label="" />
        </div>
      </div>
    </>
  );
}
