'use client';

import { useEffect } from 'react';

/**
 * Global scroll-reveal & micro-animations engine.
 * Mirrors the anime.js + IntersectionObserver behaviors of the Blade layout:
 * - [data-reveal] / [data-reveal-delay] / [data-dir] -> .yo-reveal.yo-in
 * - .tilt-3d -> 3D tilt on hover
 * - .magnetic -> magnetic pull
 * - [data-counter] -> animated counters
 * - .anime-stagger -> stagger children into view
 * - .glitch handled via CSS
 */
export default function RevealEngine() {
  useEffect(() => {
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

    // 3D tilt
    const tiltEls = document.querySelectorAll<HTMLElement>('.tilt-3d');
    const tilt = (el: HTMLElement) => (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    };
    const untilt = (el: HTMLElement) => () => {
      el.style.transform = '';
    };
    tiltEls.forEach((el) => {
      el.addEventListener('mousemove', tilt(el));
      el.addEventListener('mouseleave', untilt(el));
    });

    // Magnetic buttons
    const magEls = document.querySelectorAll<HTMLElement>('.magnetic');
    magEls.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.2;
        const y = (e.clientY - r.top - r.height / 2) * 0.2;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });

    // Cursor spotlight on glass cards
    const spotlightCards = document.querySelectorAll<HTMLElement>('.glass-card');
    const onSpotlightMove = (e: MouseEvent) => {
      for (const card of spotlightCards) {
        const r = card.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          card.style.setProperty('--mx', `${e.clientX - r.left}px`);
          card.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
      }
    };
    if (spotlightCards.length > 0) {
      window.addEventListener('mousemove', onSpotlightMove, { passive: true });
    }

    // Scramble typing effect for #scramble-text
    const scramble = document.getElementById('scramble-text');
    if (scramble) {
      const words = (scramble.getAttribute('data-words') || '').split(',').filter(Boolean);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let idx = 0;
      let interval: ReturnType<typeof setInterval>;
      const type = () => {
        const word = words[idx % words.length];
        let iter = 0;
        clearInterval(interval);
        interval = setInterval(() => {
          scramble.textContent = word
            .split('')
            .map((ch, i) => (i < iter ? ch : chars[Math.floor(Math.random() * chars.length)]))
            .join('');
          if (iter >= word.length) {
            clearInterval(interval);
            idx++;
            setTimeout(type, 2600);
          }
          iter++;
        }, 45);
      };
      if (words.length > 1) type();
    }

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

    // Smooth scroll feel: depth fade + hero cinematic exit + speed line (tanpa blur)
    const depthEls = Array.from(document.querySelectorAll<HTMLElement>('[data-depth]'));
    const depthData = depthEls.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cy: r.top + window.scrollY + r.height / 2 };
    });
    const reMeasureDepth = () => {
      for (const d of depthData) {
        const r = d.el.getBoundingClientRect();
        d.cy = r.top + window.scrollY + r.height / 2;
      }
    };
    const reMeasure = () => {
      reMeasureDepth();
      reMeasurePar();
    };
    const speedLine = document.getElementById('speed-line');
    const heroExit = document.querySelector<HTMLElement>('[data-hero-exit]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let vLastY = window.scrollY;
    let vLastT = performance.now();
    let velocity = 0;
    let smoothSpeed = 0;
    let cineRaf = 0;
    let cineRunning = false;

    const cineLoop = () => {
      const now = performance.now();
      const dt = Math.max(16, now - vLastT);
      const y = window.scrollY;
      const dy = y - vLastY;
      vLastY = y;
      vLastT = now;
      velocity = (dy / dt) * 16.67;
      smoothSpeed += (Math.min(1, Math.abs(velocity) / 80) - smoothSpeed) * 0.12;

      const vh = window.innerHeight;

      if (heroExit) {
        const p = Math.min(1, y / vh);
        heroExit.style.transform = `translate3d(0, ${(-p * 110).toFixed(1)}px, 0) scale(${(1 - p * 0.05).toFixed(4)})`;
        heroExit.style.opacity = `${(1 - p * 0.55).toFixed(3)}`;
      }

      if (!reduced) {
        if (speedLine) {
          speedLine.style.transform = `scaleX(${smoothSpeed.toFixed(4)})`;
          speedLine.style.opacity = smoothSpeed > 0.03 ? `${Math.min(0.85, Math.max(smoothSpeed, 0.12))}` : '';
        }
        for (const d of depthData) {
          const center = d.cy - y;
          if (center < -vh * 0.6 || center > vh * 1.6) continue;
          const dist = Math.min(1, Math.abs(center - vh / 2) / (vh * 0.9));
          const shift = -((center - vh / 2) / (vh * 0.9)) * 26;
          d.el.style.opacity = `${(1 - dist * 0.55).toFixed(3)}`;
          d.el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        }
      }

      const heroPast = heroExit ? y > vh * 1.15 : true;
      if (smoothSpeed > 0.02 || !heroPast) {
        cineRaf = requestAnimationFrame(cineLoop);
      } else {
        cineRunning = false;
      }
    };
    const onCineScroll = () => {
      if (cineRunning) return;
      cineRunning = true;
      cineRaf = requestAnimationFrame(cineLoop);
    };
    if (heroExit || depthEls.length > 0 || speedLine) {
      onCineScroll();
      window.addEventListener('scroll', onCineScroll, { passive: true });
    }

    // Re-measure setelah layout stabil (resize, load, gambar)
    window.addEventListener('resize', reMeasure);
    window.addEventListener('load', reMeasure);
    const rem1 = window.setTimeout(reMeasure, 1500);
    const rem2 = window.setTimeout(reMeasure, 4000);

    // Navbar: sembunyi saat scroll ke bawah, muncul lagi saat scroll ke atas
    const navbar = document.getElementById('navbar');
    const menu = document.getElementById('neural-menu');
    let lastY = window.scrollY;
    let navTicking = false;
    const onNavScroll = () => {
      if (navTicking) return;
      navTicking = true;
      requestAnimationFrame(() => {
        navTicking = false;
        const y = window.scrollY;
        if (!navbar) return;
        const menuOpen = menu?.classList.contains('open');
        const scrollingDown = y > lastY + 6;
        const scrollingUp = y < lastY - 6;
        if (scrollingDown && y > 140 && !menuOpen) navbar.classList.add('nav-hidden');
        else if (scrollingUp || y <= 140) navbar.classList.remove('nav-hidden');
        navbar.classList.toggle('nav-scrolled', y > 24);
        lastY = y;
      });
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();

    return () => {
      observer.disconnect();
      staggerObserver.disconnect();
      counterObserver.disconnect();
      tiltEls.forEach((el) => {
        el.removeEventListener('mousemove', () => {});
        el.removeEventListener('mouseleave', () => {});
      });
      magEls.forEach((el) => {
        el.removeEventListener('mousemove', () => {});
        el.removeEventListener('mouseleave', () => {});
      });
      window.removeEventListener('scroll', onParallaxScroll);
      window.removeEventListener('scroll', onCineScroll);
      window.removeEventListener('scroll', onNavScroll);
      window.removeEventListener('mousemove', onSpotlightMove);
      window.removeEventListener('resize', reMeasure);
      window.removeEventListener('load', reMeasure);
      window.clearTimeout(rem1);
      window.clearTimeout(rem2);
      cancelAnimationFrame(pRaf);
      cancelAnimationFrame(cineRaf);
    };
  }, []);

  return null;
}
