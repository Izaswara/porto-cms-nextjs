'use client';

import { useEffect } from 'react';
import anime from 'animejs';

const COLORS = ['#ff3333', '#d90429', '#ff6b6b', '#ffffff', '#22d3ee', '#a78bfa', '#f59e0b'];

/**
 * Global click feedback FX:
 * - ripple ring di titik klik (di dalam tombol / fixed di body)
 * - burst partikel animejs
 * - squash & stretch "jolt" pada tombol
 */
export default function ClickFx() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const spawnBurst = (x: number, y: number) => {
      const wrap = document.createElement('span');
      wrap.className = 'click-burst';
      wrap.style.left = `${x}px`;
      wrap.style.top = `${y}px`;
      document.body.appendChild(wrap);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const spark = document.createElement('i');
        spark.className = 'click-spark';
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        spark.style.background = color;
        spark.style.boxShadow = `0 0 8px ${color}`;
        wrap.appendChild(spark);
        const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.55;
        const dist = 30 + Math.random() * 30;
        anime({
          targets: spark,
          translateX: Math.cos(angle) * dist,
          translateY: Math.sin(angle) * dist,
          scale: [1, 0],
          opacity: [1, 0],
          duration: 380 + Math.random() * 260,
          easing: 'cubicBezier(0.16, 1, 0.3, 1)',
        });
      }
      setTimeout(() => wrap.remove(), 900);
    };

    const spawnRipple = (x: number, y: number, btn: HTMLElement) => {
      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      const size = Math.max(btn.offsetWidth, btn.offsetHeight) * 1.5 + 24;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      const pos = window.getComputedStyle(btn).position;
      if (pos !== 'static') {
        const r = btn.getBoundingClientRect();
        ripple.style.left = `${x - r.left}px`;
        ripple.style.top = `${y - r.top}px`;
        btn.appendChild(ripple);
      } else {
        ripple.classList.add('fixed');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);
      }
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (!target || target.closest('input, select, textarea, label, [data-no-click-fx]')) return;
      const btn = target.closest<HTMLElement>('a, button, [role="button"], .tilt-3d, [data-click-fx]');
      if (!btn) return;
      spawnRipple(e.clientX, e.clientY, btn);
      spawnBurst(e.clientX, e.clientY);
      if (
        btn.id !== 'theme-toggle' &&
        !btn.classList.contains('magnetic') &&
        !btn.classList.contains('tilt-3d')
      ) {
        btn.classList.remove('fx-jolt');
        void btn.offsetWidth;
        btn.classList.add('fx-jolt');
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  return null;
}