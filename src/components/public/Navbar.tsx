'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALE_SHORT, type Locale } from '@/lib/types';
import { t } from '@/lib/public-data';
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
    const isOpen = menuOpen || (closing && !navigatingRef.current);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    // Konten halaman "mundur" (scale + fade) saat menu terbuka — ala transisi Izanami
    const content = document.querySelector<HTMLElement>('.site-content');
    content?.classList.toggle('menu-recede', isOpen);
    return () => {
      document.body.style.overflow = '';
      content?.classList.remove('menu-recede');
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
    setClosing(true);
    failSafeRef.current = window.setTimeout(finalizeClose, fast ? 120 : 430);
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
      {/* Elemen melayang kanan-atas — tanpa bar, tanpa latar.
          Saat menu terbuka header dinaikkan di atas overlay (z-[70] > 60)
          supaya tombol MENU/CLOSE & switcher bahasa tetap bisa diakses plain. */}
      <header className={`fixed top-0 inset-x-0 pointer-events-none ${menuOpen ? 'z-[70]' : 'z-50'}`}>
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

          {/* MENU / CLOSE — satu-satunya toggle (kunci: tidak pernah pindah
              tempat & ukurannya tetap sama saat dibuka/ditutup). Versi awal
              punya tombol Close KEDUA di overlay (#neural-close) yang tumpang
              tindih di posisi yang sama — bikin teks tampak "bayang-bayang"
              & ukurannya berubah (13px vs 11px). Sekarang overlay tidak punya
              tombol sendiri; header yang dinahkan di atasnya saat terbuka. */}
          <button
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="neural-menu"
            className={`pointer-events-auto self-start font-mono-accent text-[13px] uppercase tracking-[0.3em] transition-colors duration-300 ${
              menuOpen ? 'text-white' : 'text-white/90 hover:text-white hover:opacity-60'
            }`}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>

      {/* Overlay navigasi fullscreen — gaya menu Izanami resmi */}
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
        <div className="menu-body">
          <nav className="menu-nav">
            {menus.map((menu, i) => {
              const name = t(translations, `menu.${menu.slug}`, menu.name);
              return (
                <a
                  key={menu.slug}
                  href={menu.url}
                  className="menu-link"
                  onClick={() => {
                    navigatingRef.current = true;
                    closeMenu(true);
                  }}
                  style={{ '--i': i, '--count': menus.length } as React.CSSProperties}
                >
                  <span className="menu-link-inner">
                    <span className="menu-name" data-text={name}>{name}</span>
                    <span className="menu-line" aria-hidden="true" />
                  </span>
                </a>
              );
            })}
          </nav>
        </div>
        <div className="menu-foot">
          <span className="menu-status" aria-hidden="true" />
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="menu-foot-link">
              CV ↗
            </a>
          )}
          <LocalTime label="" />
        </div>
      </div>
    </>
  );
}
