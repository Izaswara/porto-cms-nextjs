'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LOCALE_NAMES, LOCALE_SHORT, type Locale } from '@/lib/types';
import { t } from '@/lib/public-data';
import CvModal from './CvModal';
import VideoOverlay from './VideoOverlay';

interface NavbarProps {
  siteName: string;
  siteLogo: string | null;
  menus: { url: string; slug: string; name: string }[];
  locale: Locale;
  translations: Record<string, string>;
  contactLabel: string;
  cvUrl?: string | null;
}

export default function Navbar({ siteName, siteLogo, menus, locale, translations, contactLabel, cvUrl }: NavbarProps) {
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [cvOpen, setCvOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const menuOpenRef = useRef(false);
  const closingRef = useRef(false);
  const failSafeRef = useRef(0);

  // Auto-hide navbar: sembunyi saat scroll ke bawah, muncul lagi saat scroll ke atas
  useEffect(() => {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const menu = document.getElementById('neural-menu');
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        const menuOpen = menu?.classList.contains('open') ?? false;
        const scrollingDown = y > lastY + 6;
        const scrollingUp = y < lastY - 6;
        if (scrollingDown && y > 140 && !menuOpen) setNavHidden(true);
        else if (scrollingUp || y <= 140) setNavHidden(false);
        navbar.classList.toggle('nav-scrolled', y > 24);
        lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = () => setLangOpen(false);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, { passive: true });
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close);
    };
  }, []);

  useEffect(() => {
    const close = () => setLangOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || closing ? 'hidden' : '';
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
    // Video punya fade-out di bagian akhir: seek ~0.9s sebelum habis biar
    // baked fade-out langsung keputer (ended → finalizeClose). Cepat &
    // reliable — nggak nunggu video main dari posisi sekarang.
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
      setMenuOpen(true);
    }
  };

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 border-b border-white/10 glass-navbar${navHidden ? ' nav-hide' : ''}`} id="navbar">
        <nav className="relative z-[1] max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            {siteLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={siteLogo} alt={siteName} className="w-9 h-9 rounded-xl object-cover glow-ring" />
            ) : (
                <div className="logo-mark w-9 h-9 relative" aria-hidden="true">
                  <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                    <defs>
                      <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="var(--p-primary)" />
                        <stop offset="55%" stopColor="var(--p-secondary)" />
                        <stop offset="100%" stopColor="var(--p-accent)" />
                      </linearGradient>
                      <linearGradient id="logoGrad2" x1="1" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--p-accent)" />
                        <stop offset="100%" stopColor="var(--p-primary)" />
                      </linearGradient>
                    </defs>
                    <circle className="logo-ring" cx="24" cy="24" r="21" stroke="url(#logoGrad)" strokeWidth="1.6" style={{ transformOrigin: 'center', animation: 'spin 10s linear infinite' }} />
                    <circle cx="24" cy="24" r="15.5" stroke="url(#logoGrad2)" strokeWidth="0.8" strokeDasharray="4 6" className="logo-dash" />
                    <text x="24" y="30.5" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize="17" fontWeight="700" fill="url(#logoGrad)">
                      {siteName.charAt(0).toUpperCase()}
                    </text>
                    <circle className="logo-orbit" cx="45" cy="24" r="2.2" fill="var(--p-accent)" />
                  </svg>
                  <div className="logo-glow" />
                </div>
              )}
              <span className="font-[Space_Grotesk] font-bold text-white text-lg group-hover:text-gradient transition-all">{siteName}</span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {menus.map((menu) => (
              <a
                key={menu.slug}
                href={menu.url}
                className="px-3.5 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                {t(translations, `menu.${menu.slug}`, menu.name)}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative" id="lang-switcher" onClick={(e) => e.stopPropagation()}>
              <button
                id="lang-btn"
                onClick={() => setLangOpen((v) => !v)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold tracking-wider text-slate-400 hover:text-white transition-all glass-btn"
                style={{ border: '1px solid var(--app-border)' }}
              >
                {LOCALE_SHORT[locale]}
              </button>
              {langOpen && (
                <div
                  id="lang-dropdown"
                  className="absolute right-0 top-full w-60 rounded-2xl z-[80] glass-card pb-1"
                  style={{ border: '1px solid var(--app-border)' }}
                >
                  <div className="py-1">
                    {Object.entries(LOCALE_NAMES).map(([loc, locName]) => {
                      const isCurrent = loc === locale;
                      return (
                        <a
                          key={loc}
                          href={`/locale/${loc}`}
                          className={`block px-4 py-2 text-sm transition-all flex items-center gap-3 ${isCurrent ? 'text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                          style={isCurrent ? { background: 'color-mix(in srgb, var(--p-primary) 15%, transparent)' } : undefined}
                        >
                          <span className="w-6 inline-block text-center text-xs font-bold" style={{ color: 'var(--p-primary)' }}>
                            {LOCALE_SHORT[loc as Locale]}
                          </span>
                          <span>{locName}</span>
                          {isCurrent && (
                            <svg className="w-4 h-4 ml-auto" style={{ color: 'var(--p-primary)' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <ThemeToggle />

            {cvUrl && (
              <button
                id="cv-btn"
                onClick={() => setCvOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shine"
                style={{ background: 'linear-gradient(135deg, var(--p-secondary), var(--p-primary))' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CV
              </button>
            )}

            <a
              href="#contact"
              className="magnetic hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 shine yo-btn"
              style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))' }}
            >
              {contactLabel}
            </a>

            <button
              id="mobile-menu-btn"
              onClick={toggleMenu}
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
              className={`mobile-burger md:hidden relative w-11 h-11 rounded-xl flex items-center justify-center text-slate-200 overflow-hidden glass-btn ${menuOpen ? 'open' : ''}`}
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="mb-line mb-1" />
              <span className="mb-line mb-2" />
              <span className="mb-line mb-3" />
            </button>
          </div>
        </nav>
      </header>

      {/* Neural mobile menu */}
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
        <button id="neural-close" className="neural-close" onClick={() => closeMenu()} aria-label="Tutup menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
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
              onClick={() => closeMenu(true)}
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
          <span className="neural-status">● SYSTEM ONLINE</span>
          <span className="neural-coords">X:{menus.length}.0 Y:0.0</span>
        </div>
      </div>
      {cvOpen && cvUrl && <CvModal url={cvUrl} onClose={() => setCvOpen(false)} />}
    </>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [themeVid, setThemeVid] = useState<'dark' | 'light' | null>(null);
  const [phase, setPhase] = useState<'idle' | 'intro' | 'collapse' | 'flash' | 'settled'>('idle');
  const appliedRef = useRef(false);
  const themeTimersRef = useRef<number[]>([]);
  const bootLatarRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('portfolio-theme');
    const initial = stored === 'light' || stored === 'dark' ? stored : 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
    // Langsung pasang video latar navbar sesuai theme tanpa animasi intro
    bootLatarRef.current = true;
    setThemeVid(initial);
    setPhase('settled');
  }, []);

  // Preload kedua video theme sejak awal biar toggle pertama nggak nge-stutter
  useEffect(() => {
    ['/videos/dark.mp4', '/videos/light.mp4'].forEach((src) => {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.muted = true;
      v.playsInline = true;
      v.src = src;
      v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;visibility:hidden;';
      document.body.appendChild(v);
      v.addEventListener('loadeddata', () => v.remove(), { once: true });
    });
  }, []);

  const applyThemeNow = (next: 'dark' | 'light') => {
    appliedRef.current = true;
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
  };

  useEffect(() => {
    if (!themeVid) return;
    // Set pertama dari boot (latar langsung, tanpa animasi) — skip timers
    if (bootLatarRef.current) {
      bootLatarRef.current = false;
      return;
    }
    themeTimersRef.current.forEach(clearTimeout);
    themeTimersRef.current = [
      // Fade-in fullscreen selesai -> video collapse ke navbar (energi-line nyapu)
      window.setTimeout(() => setPhase('collapse'), 620),
      // Collapse selesai -> flip theme + impact flash + shockwave ring
      window.setTimeout(() => {
        if (!appliedRef.current) applyThemeNow(themeVid);
        setPhase('flash');
      }, 1500),
      // Flash selesai -> settle: video jadi latar navbar, breathing glow
      window.setTimeout(() => setPhase('settled'), 2100),
    ];
    return () => themeTimersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeVid]);

  const toggle = () => {
    if (themeVid && phase !== 'settled') return;
    const next = theme === 'dark' ? 'light' : 'dark';

    const btn = document.getElementById('theme-toggle');
    if (btn && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      btn.classList.remove('fx-pop');
      void btn.offsetWidth;
      btn.classList.add('fx-pop');
    }

    // Reduced motion: langsung ganti theme tanpa video
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyThemeNow(next);
      return;
    }

    appliedRef.current = false;
    setPhase('intro');
    setThemeVid(next);
  };

  return (
    <>
      <button
        id="theme-toggle"
        onClick={toggle}
        aria-label="Toggle theme"
        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all glass-btn"
        style={{ border: '1px solid var(--app-border)' }}
      >
        <span className="relative block w-4 h-4">
          <svg
            className={`theme-icon ${theme === 'light' ? 'icon-on' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <svg
            className={`theme-icon ${theme === 'dark' ? 'icon-on' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </span>
      </button>
      {themeVid && typeof document !== 'undefined' &&
        createPortal(
          <>
            <VideoOverlay
              id="theme-video"
              src={themeVid === 'dark' ? '/videos/dark.mp4' : '/videos/light.mp4'}
              variant="fade"
              loop
              preload="auto"
              className={`navbar-video nav-${phase}`}
              containerStyle={{ height: phase === 'intro' ? '100vh' : '4rem' }}
            />
            <div className={`navbar-fx nav-fx-${phase}`} aria-hidden="true" />
          </>,
          document.getElementById('navbar') ?? document.body
        )}
    </>
  );
}
