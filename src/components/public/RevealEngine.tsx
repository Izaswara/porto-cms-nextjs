'use client';

import { useEffect } from 'react';

/**
 * Global scroll-reveal & micro-animations engine.
 * Optimized for smooth scrolling with prefers-reduced-motion support.
 * Heavy mousemove effects removed to improve scroll performance.
 */
export default function RevealEngine() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('yo-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.classList.add('yo-reveal');
      const dir = el.getAttribute('data-dir') || 'up';
      if (dir !== 'up') el.setAttribute('data-dir', dir);
      const delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.transitionDelay = `${Number(delay) * 0.1}s`;
      observer.observe(el);
    });

    // Stagger containers
    const staggerObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const children = Array.from(entry.target.children);
            children.forEach((child, i) => {
              const el = child as HTMLElement;
              el.classList.add('yo-reveal');
              el.style.transitionDelay = `${i * 0.08}s`;
              requestAnimationFrame(() => el.classList.add('yo-in'));
            });
            staggerObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll<HTMLElement>('.anime-stagger').forEach((el) => staggerObserver.observe(el));

    // Animated counters
    const counterObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = Number(el.getAttribute('data-counter') || 0);
            const suffix = el.getAttribute('data-suffix') || '';
            const dur = 1400;
            const start = performance.now();
            const step = (now: number) => {
              const p = Math.min(1, (now - start) / dur);
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent = `${Math.round(target * eased)}${suffix}`;
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            counterObserver.unobserve(el);
          }
        }
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll<HTMLElement>('[data-counter]').forEach((el) => counterObserver.observe(el));

    // Smooth scroll parallax for [data-parallax] — offset di-cache, tanpa getBoundingClientRect per frame
    const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    const parData = parallaxEls.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cy: r.top + window.scrollY + r.height / 2, speed: Number(el.getAttribute('data-parallax')) || 0.1 };
    });
    const reMeasurePar = () => {
      for (const d of parData) {
        const r = d.el.getBoundingClientRect();
        d.cy = r.top + window.scrollY + r.height / 2;
      }
    };
    let pScroll = window.scrollY;
    let pTarget = window.scrollY;
    let pRaf = 0;
    let pRunning = false;
    const parallaxLoop = () => {
      pScroll += (pTarget - pScroll) * 0.09;
      const vh = window.innerHeight;
      for (const d of parData) {
        const center = d.cy - window.scrollY;
        const offset = (center - vh / 2) / vh;
        d.el.style.transform = `translate3d(0, ${(-offset * d.speed * 320).toFixed(2)}px, 0)`;
      }
      if (Math.abs(pScroll - pTarget) < 0.05) {
        pRunning = false;
        return;
      }
      pRaf = requestAnimationFrame(parallaxLoop);
    };
    const onParallaxScroll = () => {
      pTarget = window.scrollY;
      if (!pRunning) {
        pRunning = true;
        pRaf = requestAnimationFrame(parallaxLoop);
      }
    };
    if (parallaxEls.length > 0) {
      onParallaxScroll();
      window.addEventListener('scroll', onParallaxScroll, { passive: true });
    }

    // Re-measure setelah layout stabil (resize, load)
    window.addEventListener('resize', reMeasurePar);
    window.addEventListener('load', reMeasurePar);
    const rem = window.setTimeout(reMeasurePar, 4000);

    return () => {
      observer.disconnect();
      staggerObserver.disconnect();
      counterObserver.disconnect();
      window.removeEventListener('scroll', onParallaxScroll);
      window.removeEventListener('resize', reMeasurePar);
      window.removeEventListener('load', reMeasurePar);
      window.clearTimeout(rem);
      cancelAnimationFrame(pRaf);
    };
  }, []);

  return null;
}