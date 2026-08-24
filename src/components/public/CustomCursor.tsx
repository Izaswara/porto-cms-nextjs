'use client';

import { useEffect, useRef } from 'react';

/**
 * CustomCursor — kursor studio ala Izanami:
 * dot kecil mengikuti instan + ring yang mengejar dengan lerp halus,
 * membesar saat di atas elemen interaktif. Blend difference supaya
 * terbaca di media gelap maupun terang.
 *
 * Hanya aktif pada (pointer: fine) & tanpa prefers-reduced-motion.
 * Native cursor disembunyikan via html.cursor-on, KECUALI form control
 * agar usability tetap terjaga.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add('cursor-on');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      const interactive = (e.target as HTMLElement | null)?.closest?.('a, button, [data-cursor]');
      ring.classList.toggle('cursor-active', Boolean(interactive));
    };
    const onLeaveWindow = () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeaveWindow);
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('cursor-on');
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (typeof window === 'undefined') return null;
  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
