'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toggleBgm, onBgmChange } from '@/lib/bgm-store';
import Hud from '@/components/public/Hud';

const BAR_COUNT = 32;
const IDLE_MS = 4200; // tanpa aktivitas selama ini → bar muncul
const NEAR_BAR_PX = 240; // kursor sedekat ini dari bawah → anggap mau klik bar

/**
 * MusicBar — pemutar BGM gaya desain baru.
 *
 * Perilaku:
 *  - Posisi tengah-bawah, di atas FixedRail.
 *  - MUNCUL saat idle/mendekati bar; disembunyikan saat aktivitas nyata:
 *    scroll, wheel, ketikan, maupun tekan di luar bar.
 *  - Aktivitas yang berasal DARI DALAM bar diabaikan — jadi tombolnya
 *    selalu bisa ditekan tanpa bar "kabur" justru saat mau diklik.
 *  - Kursor yang mendekat ke zona bawah juga membuat bar muncul lebih
 *    dulu, supaya tidak kalah cepat dengan transisi fade-out.
 *  - Tombol tutup menyembunyikan permanen (sampai reload).
 */
export default function MusicBar() {
  const [playing, setPlaying] = useState(false);
  const [hidden, setHidden] = useState(false); // ditutup manual
  const [idle, setIdle] = useState(false); // true = bar terlihat
  const barRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastArmRef = useRef(0);

  useEffect(() => {
    return onBgmChange(setPlaying);
  }, []);

  // ── Idle watcher ─────────────────────────────────────────────
  useEffect(() => {
    let raf = 0;

    const arm = () => {
      // throttle re-arm 300ms agar timer tidak dibuat-buat tiap event
      const now = performance.now();
      if (now - lastArmRef.current < 300) return;
      lastArmRef.current = now;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!hoverRef.current) setIdle(true);
      }, IDLE_MS);
    };

    const showNow = () => {
      setIdle(true);
      clearTimeout(timerRef.current);
    };

    const markActive = () => {
      setIdle(false);
      raf = requestAnimationFrame(arm);
    };

    const overBar = (e: Event) => barRef.current?.contains(e.target as Node) ?? false;

    // Gerakan kursor: di dalam bar / mendekati zona bawah → TAMPILKAN.
    // Aktivitas lain → sembunyikan (bar tidak kabur saat kursor menuju ke sana).
    const onMove = (e: Event) => {
      const pe = e as PointerEvent;
      if (pe.pointerType !== 'mouse') return;
      if (overBar(e) || pe.clientY > window.innerHeight - NEAR_BAR_PX) showNow();
      else markActive();
    };

    // Tekan: klik di dalam bar jangan dianggap aktivitas (bar tetap hidup).
    const onDown = (e: Event) => {
      if (overBar(e)) {
        showNow();
        return;
      }
      markActive();
    };

    // Scroll/wheel/sentuh di dalam bar jarang terjadi — biarkan tidak menyangkut.
    const onHard = (e: Event) => {
      if (overBar(e)) return;
      markActive();
    };

    const events: Array<[string, EventListener]> = [
      ['pointermove', onMove],
      ['pointerdown', onDown],
      ['wheel', onHard],
      ['scroll', onHard],
      ['keydown', markActive],
      ['touchstart', onHard],
    ];
    events.forEach(([n, h]) => window.addEventListener(n, h, { passive: true }));

    // Mulai siklus pertama (bar muncul setelah pengunjung diam sebentar)
    arm();

    return () => {
      events.forEach(([n, h]) => window.removeEventListener(n, h));
      clearTimeout(timerRef.current);
      cancelAnimationFrame(raf);
    };
  }, []);

  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => ({
        h: 8 + Math.round(Math.random() * 22),
        d: (Math.random() * 1.1).toFixed(2),
        dur: (0.7 + Math.random() * 0.9).toFixed(2),
        base: (0.12 + Math.random() * 0.25).toFixed(2),
        i,
      })),
    []
  );

  if (hidden) return null;

  return (
    <div
      id="music-bar"
      ref={barRef}
      className={`fixed bottom-12 left-1/2 z-[55] -translate-x-1/2 transition-all duration-700 ease-out ${
        idle ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0 pointer-events-none'
      }`}
      onPointerEnter={() => {
        // Kursor di atas bar = dianggap idle, bar tetap terlihat
        hoverRef.current = true;
        setIdle(true);
        clearTimeout(timerRef.current);
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
    >
      <div className="flex items-center gap-3 border border-white/15 bg-[rgba(0,0,0,0.85)] backdrop-blur-md pl-2 pr-3 py-2 shadow-xl shadow-black/40 music-bar-float">
        {/* Tombol play — persegi hairline, ikon putih saat aktif */}
        <button
          onClick={toggleBgm}
          aria-label={playing ? 'Jeda musik' : 'Putar musik'}
          title={playing ? 'Jeda musik' : 'Putar musik'}
          className={`w-9 h-9 grid place-items-center border transition-all active:scale-90 ${
            playing ? 'border-white/60 text-white' : 'border-white/20 text-bone hover:border-white/50'
          }`}
        >
          {playing ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Equalizer — batang putih tipis */}
        <div className="eq-bars flex items-end gap-[2px] h-7" aria-hidden>
          {bars.map((b) => (
            <span
              key={b.i}
              className="music-eq w-[2px]"
              style={{
                height: `${b.h}px`,
                background: 'linear-gradient(180deg, #ffffff, rgba(255,255,255,0.15))',
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.d}s`,
                animationPlayState: playing ? 'running' : 'paused',
                transform: `scaleY(${playing ? 1 : b.base})`,
              }}
            />
          ))}
        </div>

        <span className="font-label text-[9px] uppercase tracking-[0.4em] text-mute hidden sm:inline" aria-hidden="true">
          BGM
        </span>

        <span className="w-px h-6 bg-white/10 hidden md:block" aria-hidden="true" />
        <Hud />

        {/* Tutup — minimal, tanpa latar */}
        <button
          onClick={() => {
            if (playing) toggleBgm();
            setHidden(true);
          }}
          aria-label="Sembunyikan musik"
          className="w-6 h-6 grid place-items-center text-mute hover:text-bone transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
