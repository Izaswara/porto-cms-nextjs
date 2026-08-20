'use client';

import { useEffect, useRef } from 'react';

interface HeroPhotoProps {
  photo: string | null;
  name: string;
  badges?: string[];
}

/**
 * Premium animated profile photo:
 * - 3D tilt yang mengikuti kursor + glare spotlight
 * - Layer parallax (depth) pada elemen dekoratif
 * - Rotating orbit rings + dots
 * - Scanline sweep, vignette, HUD corner ticks
 * - Badge mengambang + sparkle + status bar
 */
export default function HeroPhoto({ photo, name, badges = ['Fullstack', 'AI-Ready'] }: HeroPhotoProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const frame = stage.querySelector<HTMLElement>('.hero-photo-frame');
    const glare = stage.querySelector<HTMLElement>('.hero-photo-glare');
    const fx = stage.querySelector<HTMLElement>('.hero-photo-fx');
    let tx = 0, ty = 0, mx = 0, my = 0, raf = 0;
    let running = false;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;

    const loop = () => {
      if (!running) return;
      tx += (mx - tx) * 0.09;
      ty += (my - ty) * 0.09;
      if (frame) {
        frame.style.transform = `perspective(1000px) rotateX(${(-ty * 9).toFixed(2)}deg) rotateY(${(tx * 11).toFixed(2)}deg) scale(1.015)`;
      }
      if (glare) {
        glare.style.opacity = `${Math.min(1, Math.abs(tx) + Math.abs(ty)).toFixed(2)}`;
        glare.style.background = `radial-gradient(300px circle at ${(50 + tx * 28).toFixed(1)}% ${(50 + ty * 28).toFixed(1)}%, rgba(255,255,255,0.3), transparent 65%)`;
      }
      if (fx) fx.style.transform = `translate3d(${(tx * 16).toFixed(1)}px, ${(ty * 16).toFixed(1)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
    };

    const start = () => {
      if (running) return;
      running = true;
      clearTimeout(stopTimer);
      loop();
    };

    const stop = () => {
      mx = 0;
      my = 0;
      stopTimer = setTimeout(() => {
        running = false;
        cancelAnimationFrame(raf);
        if (frame) frame.style.transform = '';
        if (fx) fx.style.transform = '';
        if (glare) glare.style.opacity = '0';
      }, 800);
    };

    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseenter', start);
    stage.addEventListener('mouseleave', stop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(stopTimer);
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseenter', start);
      stage.removeEventListener('mouseleave', stop);
    };
  }, []);

  const initial = (name || 'F').charAt(0).toUpperCase();

  return (
    <div className="hero-photo-wrap relative inline-block" ref={stageRef} data-parallax="0.07">
      <div className="hero-photo-fx">
        <div className="hero-photo-glow" aria-hidden="true" />

        <div className="hero-ring hr-1" aria-hidden="true" />
        <div className="hero-ring hr-2" aria-hidden="true" />
        <div className="hero-orbit-dots" aria-hidden="true">
          <span className="hod hod-1" />
          <span className="hod hod-2" />
        </div>

        <div className="hero-orb-badge hb-1">
          <span className="hb-ic">🛠</span>
          <span>{badges[0] ?? 'Fullstack'}</span>
        </div>
        <div className="hero-orb-badge hb-2">
          <span className="hb-ic">⚡</span>
          <span>{badges[1] ?? 'AI-Ready'}</span>
        </div>

        <span className="hero-spark hs-1" aria-hidden="true" />
        <span className="hero-spark hs-2" aria-hidden="true" />
        <span className="hero-spark hs-3" aria-hidden="true" />
        <span className="hero-spark hs-4" aria-hidden="true" />

        <div className="hero-photo-frame">
          <div className="hero-photo-inner glass-card glow-ring animate-border">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))' }}
              >
                <span className="text-6xl font-bold text-white" style={{ color: '#fff' }}>{initial}</span>
              </div>
            )}
            <div className="hero-photo-glare" aria-hidden="true" />
            <div className="hero-photo-scan" aria-hidden="true" />
            <div className="hero-photo-vignette" aria-hidden="true" />
            <span className="hero-corner hc-tl" aria-hidden="true" />
            <span className="hero-corner hc-tr" aria-hidden="true" />
            <span className="hero-corner hc-bl" aria-hidden="true" />
            <span className="hero-corner hc-br" aria-hidden="true" />
          </div>
        </div>

        <div className="hero-status">
          <span className="hs-dot" aria-hidden="true" /> ONLINE <span className="hs-cursor" aria-hidden="true">▮</span>
        </div>
      </div>
    </div>
  );
}