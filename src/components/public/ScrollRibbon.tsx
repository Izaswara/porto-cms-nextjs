'use client';

import { useEffect, useRef } from 'react';

/**
 * ScrollRibbon — pembatas buku digital di tepi kanan viewport.
 * Track hairline vertikal + "ribbon" yang tumbuh mengikuti progres baca,
 * ujungnya diamond glow (senada motif plate-diamond).
 * Informasi murni — tetap berjalan normal saat reduced-motion.
 */
export default function ScrollRibbon() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    let ticking = false;

    const apply = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.height = `${(p * 100).toFixed(2)}%`;
      el.style.opacity = p > 0.005 ? '1' : '0';
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="scroll-ribbon hidden md:flex" aria-hidden="true">
      <span className="ribbon-track" />
      <div ref={fillRef} className="ribbon-progress">
        <span className="ribbon-diamond" />
      </div>
    </div>
  );
}
