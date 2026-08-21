'use client';

import { useEffect, useRef, useState } from 'react';

/** Cursor custom + particle network + scroll progress + back to top */
export default function SiteFx() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth scroll untuk anchor links (CSS scroll-behavior dihapus biar scroll native nggak nyangkut)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const a = t.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const hash = a.getAttribute('href');
      if (!hash || hash === '#') return;
      const el = document.querySelector(hash);
      if (!el) return;
      e.preventDefault();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const scrollToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  useEffect(() => {
    // Scroll progress
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${pct})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let cursorRaf = 0;
    let particleRaf = 0;
    let cursorLoopRunning = false;
    let particleLoopRunning = false;

    // Custom cursor
    const dot = dotRef.current;
    const ring = ringRef.current;
    let mx = -100, my = -100, rx = -100, ry = -100;
    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const startCursorLoop = () => {
      cursorLoopRunning = true;
      const loop = () => {
        if (!cursorLoopRunning || !dot || !ring) return;
        if (performance.now() - lastActivity > 2500) {
          cursorLoopRunning = false;
          cancelAnimationFrame(cursorRaf);
          return;
        }
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        dot.style.left = `${mx}px`;
        dot.style.top = `${my}px`;
        ring.style.left = `${rx}px`;
        ring.style.top = `${ry}px`;
        cursorRaf = requestAnimationFrame(loop);
      };
      loop();
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, .tilt-3d, [data-reveal]')) ring?.classList.add('hover');
      else ring?.classList.remove('hover');
    };
    const cursorEnabled = Boolean(dot && ring && window.matchMedia('(pointer: fine)').matches);

    // Particle network
    const colors = ['#22d3ee', '#a78bfa', '#f59e0b'];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    let particles: { x: number; y: number; vx: number; vy: number; r: number; c: string }[] = [];
    let w = 0, h = 0;
    const resize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      particles = Array.from({ length: Math.min(24, Math.floor(w / 40)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 1.6 + 0.6,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
    };
    // Pause loop saat idle (2.5s tanpa aktivitas) — hemat CPU/GPU
    let lastActivity = performance.now();
    const poke = () => {
      lastActivity = performance.now();
      if (!cursorLoopRunning && cursorEnabled) startCursorLoop();
      if (!particleLoopRunning && ctx) startParticleLoop();
    };
    const startParticleLoop = () => {
      particleLoopRunning = true;
      const draw = () => {
        if (!particleLoopRunning || !ctx) return;
        if (performance.now() - lastActivity > 2500) {
          particleLoopRunning = false;
          cancelAnimationFrame(particleRaf);
          return;
        }
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.c;
          ctx.globalAlpha = 0.7;
          ctx.fill();
        }
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 110) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = a.c;
              ctx.globalAlpha = (1 - d / 110) * 0.15;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
        particleRaf = requestAnimationFrame(draw);
      };
      draw();
    };
    const startAllLoops = () => {
      if (cursorEnabled) startCursorLoop();
      if (ctx) startParticleLoop();
    };

    // Hentikan semua animasi saat tab tidak aktif
    const onVisibility = () => {
      if (document.hidden) {
        cursorLoopRunning = false;
        particleLoopRunning = false;
        cancelAnimationFrame(cursorRaf);
        cancelAnimationFrame(particleRaf);
      } else {
        startAllLoops();
      }
    };

    if (cursorEnabled) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseover', over);
      document.body.classList.add('cursor-enabled');
    }
    if (ctx) {
      resize();
      window.addEventListener('resize', resize);
    }
    startAllLoops();
    window.addEventListener('scroll', poke, { passive: true });
    window.addEventListener('mousemove', poke, { passive: true });
    window.addEventListener('pointerdown', poke, { passive: true });
    window.addEventListener('touchstart', poke, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', poke);
      window.removeEventListener('mousemove', poke);
      window.removeEventListener('pointerdown', poke);
      window.removeEventListener('touchstart', poke);
      document.removeEventListener('visibilitychange', onVisibility);
      cursorLoopRunning = false;
      particleLoopRunning = false;
      cancelAnimationFrame(cursorRaf);
      cancelAnimationFrame(particleRaf);
    };
  }, []);

  return (
    <>
      <div className="ai-site-grid" aria-hidden="true" />
      <div className="ai-aurora" aria-hidden="true">
        <span className="aa-1" />
        <span className="aa-2" />
        <span className="aa-3" />
      </div>
      <div className="shooting-stars" aria-hidden="true">
        <i className="ss-1" />
        <i className="ss-2" />
        <i className="ss-3" />
      </div>
      <div className="ai-site-scan" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
      <div id="scroll-progress" ref={progressRef} />
      <div id="speed-line" aria-hidden="true" />
      <canvas id="particles" ref={canvasRef} />
      <button
        id="back-to-top"
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
        title="Kembali ke atas"
        className={showTop ? 'show' : ''}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </>
  );
}
