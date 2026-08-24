'use client';

import { useEffect, useRef } from 'react';
import GlassLens from '@/components/public/GlassLens';

interface HeroPhotoProps {
  photo: string | null;
  name: string;
  role?: string;
}

/**
 * Kartu potret hero — gaya editorial Izanami:
 * bingkai dobel hairline + tick sudut HUD, label mono mikro,
 * nama vertikal di sisi kanan (writing-mode vertical), plate kaca.
 * Interaksi: tilt 3D halus mengikuti kursor + glare spotlight.
 */
export default function HeroPhoto({ photo, name, role }: HeroPhotoProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const frame = stage.querySelector<HTMLElement>('.hero-photo-frame');
    const glare = stage.querySelector<HTMLElement>('.hero-photo-glare');
    let tx = 0, ty = 0, mx = 0, my = 0, raf = 0;
    let running = false;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;

    const loop = () => {
      if (!running) return;
      tx += (mx - tx) * 0.09;
      ty += (my - ty) * 0.09;
      if (frame) {
        frame.style.transform = `perspective(1000px) rotateX(${(-ty * 7).toFixed(2)}deg) rotateY(${(tx * 9).toFixed(2)}deg)`;
      }
      if (glare) {
        glare.style.opacity = `${Math.min(1, Math.abs(tx) + Math.abs(ty)).toFixed(2)}`;
        glare.style.background = `radial-gradient(300px circle at ${(50 + tx * 28).toFixed(1)}% ${(50 + ty * 28).toFixed(1)}%, rgba(255,255,255,0.22), transparent 65%)`;
      }
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
    <div className="hero-photo-wrap group relative inline-block" ref={stageRef} data-parallax="0.07">
      <div className="hero-photo-fx">
        <figure className="hero-photo-frame editorial-frame">
          <span className="ef-label font-mono-accent">( Profile )</span>

          <div className="hero-photo-inner grain grayscale contrast-[1.06] transition-[filter] duration-700 ease-out group-hover:grayscale-0 group-hover:contrast-100">
            {photo ? (
              <GlassLens src={photo} alt={name} priority sizes="(max-width: 1024px) 62vw, 330px" />
            ) : (
              <div className="w-full h-full grid place-items-center bg-[#101013]">
                <span className="font-serif italic text-8xl text-white/10 select-none">{initial}</span>
              </div>
            )}
            <span className="tint-layer" aria-hidden="true" />
            <div className="hero-photo-glare" aria-hidden="true" />
            <div className="hero-photo-vignette" aria-hidden="true" />
          </div>

          {/* Plate kaca — senada kartu profil di section About */}
          <figcaption className="profile-plate">
            <span className="block font-serif text-lg text-white leading-snug">{name}</span>
            <span className="plate-diamond" aria-hidden="true" />
            {role && (
              <span className="block font-mono-accent text-[10px] uppercase tracking-[0.32em] text-slate-400 mt-2">{role}</span>
            )}
          </figcaption>

          {/* Teks vertikal cermin: nama kanan, kanji kiri */}
          <span className="vside-label font-mono-accent" aria-hidden="true">{name || 'Portfolio'}</span>
          <span className="vside-label vside-label--left vside-kanji" aria-hidden="true">私</span>
        </figure>
      </div>
    </div>
  );
}
