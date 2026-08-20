'use client';

import { useEffect, useMemo, useState } from 'react';
import { toggleBgm, onBgmChange } from '@/lib/bgm-store';
import Hud from '@/components/public/Hud';

const BAR_COUNT = 32;

export default function MusicBar() {
  const [playing, setPlaying] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    return onBgmChange(setPlaying);
  }, []);

  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => ({
        h: 12 + Math.round(Math.random() * 32),
        d: (Math.random() * 1.1).toFixed(2),
        dur: (0.7 + Math.random() * 0.9).toFixed(2),
        base: (0.15 + Math.random() * 0.3).toFixed(2),
        i,
      })),
    []
  );

  if (hidden) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60]">
      <div className="glass-card rounded-full pl-3 pr-4 py-2.5 flex items-center gap-3 shadow-xl shadow-black/40">
        <button
          onClick={toggleBgm}
          aria-label={playing ? 'Jeda musik' : 'Putar musik'}
          title={playing ? 'Jeda musik' : 'Putar musik'}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
          style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))' }}
        >
          {playing ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="eq-bars flex items-end gap-[3px] h-10" aria-hidden>
          {bars.map((b) => (
            <span
              key={b.i}
              className="music-eq"
              style={{
                height: `${b.h}px`,
                background: 'linear-gradient(180deg, var(--p-primary), var(--p-secondary))',
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.d}s`,
                animationPlayState: playing ? 'running' : 'paused',
                transform: `scaleY(${playing ? 1 : b.base})`,
              }}
            />
          ))}
        </div>

        <span className="w-px h-8 bg-white/10 hidden md:block" aria-hidden="true" />
        <Hud />

        <button
          onClick={() => {
            if (playing) toggleBgm();
            setHidden(true);
          }}
          aria-label="Sembunyikan musik"
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}