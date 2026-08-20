'use client';

import { useEffect, useRef } from 'react';

/** Scroll-driven cinematic scene (Firefly SAM) — stage di-pin via JS
 *  (position: sticky tidak reliable karena html/body pakai overflow-x: hidden).
 *  Scroll masuk -> stage netep (fixed) -> scroll lagi -> stage lepas ke bawah (absolute). */
export default function CinemaScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const embersRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = document.getElementById('scroll-scene');
    const stage = document.getElementById('scene-stage');
    if (!scene || !stage) return;
    const video = videoRef.current;
    const glow = glowRef.current;
    const embersWrap = embersRef.current;
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('.chapter'));

    let sceneH = 0;
    let maxProgress = 0;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const band = (pct: number, a: number, b: number) => clamp((pct - a) / (b - a), 0, 1);

    let videoReady = false;
    let currentChapter = -1;
    let visible = false;

    const MAX_SECONDS = 10;

    const onTimeUpdate = () => {
      if (video && video.duration > MAX_SECONDS && video.currentTime >= MAX_SECONDS) {
        video.currentTime = 0;
      }
    };

    const setLoading = (show: boolean) => loadingRef.current?.classList.toggle('show', show);

    const checkVideo = () => {
      if (video && video.readyState >= 1) {
        videoReady = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        if (visible) video.play().catch(() => {});
        fallbackRef.current?.classList.remove('show');
        setLoading(false);
      } else if (video && video.error) {
        videoReady = false;
        fallbackRef.current?.classList.add('show');
        setLoading(false);
      }
    };
    if (video) {
      video.addEventListener('loadedmetadata', checkVideo);
      video.addEventListener('canplay', checkVideo);
      video.addEventListener('error', checkVideo);
      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('waiting', () => setLoading(true));
      video.addEventListener('stalled', () => setLoading(true));
      video.addEventListener('playing', () => setLoading(false));
      setTimeout(checkVideo, 2500);
      setLoading(true);
    } else {
      fallbackRef.current?.classList.add('show');
      setLoading(false);
    }

    const sceneObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (!video || !videoReady) return;
        if (visible) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: '0px 0px 20% 0px' }
    );
    if (scene) sceneObserver.observe(scene);

    // Spawn embers
    const embers: { el: HTMLElement; x: number; y: number; drift: number }[] = [];
    if (embersWrap) {
      for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'ce-particle';
        const size = Math.random() * 6 + 3;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.opacity = '0';
        embersWrap.appendChild(p);
        embers.push({
          el: p,
          x: parseFloat(p.style.left),
          y: 100 + Math.random() * 10,
          drift: (Math.random() - 0.5) * 2,
        });
      }
    }

    const measure = () => {
      sceneH = scene.offsetHeight || window.innerHeight * 5.2;
      maxProgress = sceneH - window.innerHeight;
    };

    const FILTERS = [
      'saturate(1) contrast(1.05) brightness(0.95)',
      'saturate(1.25) contrast(1.1) brightness(0.95)',
      'saturate(1.5) contrast(1.15) brightness(0.9)',
      'saturate(1.8) contrast(1.2) brightness(0.85)',
    ];

    // rAF throttle: update maksimal 1x per frame, filter video hanya per chapter
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const rect = scene.getBoundingClientRect();
        const topOffset = -rect.top;

        // Pin stage: netep saat di dalam jangkauan scroll, lepas saat keluar
        if (topOffset <= 0) {
          stage.style.position = 'absolute';
          stage.style.top = '0px';
        } else if (topOffset >= maxProgress) {
          stage.style.position = 'absolute';
          stage.style.top = `${maxProgress}px`;
        } else {
          stage.style.position = 'fixed';
          stage.style.top = '0px';
        }

        if (topOffset < 0 || topOffset > maxProgress) return;
        const pct = Math.min(topOffset / maxProgress, 1);

        if (video && videoReady) {
          // 3D settle: transform-only (composited — murah)
          const tilt = (1 - band(pct, 0, 0.5)) * 9;
          video.style.opacity = String(clamp(band(pct, 0.0, 0.03), 0, 1));
          video.style.transform = `perspective(1200px) rotateX(${tilt}deg) scale(${1.18 - pct * 0.18})`;
        }
        if (glow) glow.style.opacity = String(band(pct, 0.15, 0.6) * 1.2);

        const emberIntensity = band(pct, 0.1, 0.7);
        embers.forEach((e, i) => {
          const cycle = (pct * 2 + i * 0.05) % 1;
          const y = 100 - cycle * 120;
          e.x += e.drift * 0.15;
          if (e.x > 100) e.x = 0;
          if (e.x < 0) e.x = 100;
          e.el.style.transform = `translate(${e.x}vw, ${y}vh) translateY(${-cycle * 20}px) rotate(${cycle * 180}deg)`;
          e.el.style.opacity = String(emberIntensity * (0.4 + 0.6 * Math.sin(cycle * Math.PI)));
        });

        // Filter video: diskret per chapter (bukan tiap scroll tick)
        const chapterIdx = pct < 0.25 ? 0 : pct < 0.55 ? 1 : pct < 0.85 ? 2 : 3;
        if (chapterIdx !== currentChapter) {
          currentChapter = chapterIdx;
          if (video) video.style.filter = FILTERS[chapterIdx];
          chapters.forEach((ch, i) => {
            const isActive = i === chapterIdx;
            ch.style.opacity = isActive ? '1' : '0';
            ch.style.transform = isActive ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)';
            ch.style.transition = 'all .7s cubic-bezier(.22,.61,.36,1)';
          });
        }
      });
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      measure();
      onScroll();
    });
    chapters.forEach((ch, i) => {
      ch.style.opacity = i === 0 ? '1' : '0';
      ch.style.transform = i === 0 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)';
    });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      sceneObserver.disconnect();
      if (video) {
        video.pause();
        video.currentTime = 0;
        video.removeEventListener('timeupdate', onTimeUpdate);
      }
    };
  }, []);

  return (
    <section id="scroll-scene" className="relative" style={{ height: '520vh' }}>
      <div className="scene-stage" id="scene-stage">
        <div className="cinema-frame" id="cinema-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <video ref={videoRef} id="firefly-video" className="cinema-video" muted playsInline preload="metadata" src="/videos/firefly-ultimate.mp4#t=0,10" />
          <div className="cinema-vignette" />
          <div className="cinema-glow" ref={glowRef} />
          <div className="cinema-embers" ref={embersRef} />
        </div>
        <div className="cinema-loading" ref={loadingRef} aria-hidden="true">
          <div className="cinema-loading-spinner" />
          <div className="cinema-loading-text">Loading scene</div>
        </div>
        <div className="cinema-fallback" id="cinema-fallback" ref={fallbackRef}>
          <div className="cf-orb cf-orb-1" />
          <div className="cf-orb cf-orb-2" />
          <div className="cf-core" />
          <div className="cf-text">Video belum tersedia. Letakkan video di <code>public/videos/firefly-ultimate.mp4</code></div>
        </div>
        <div className="scene-text">
          <div className="chapter" data-chapter="0">
            Firefly
            <p>She stands amid the falling stars</p>
          </div>
          <div className="chapter" data-chapter="1">
            Ignition
            <p>The crimson flame awakens</p>
          </div>
          <div className="chapter" data-chapter="2">
            Supernova
            <p>SAM armor is forged in fire</p>
          </div>
          <div className="chapter" data-chapter="3">
            Firefly Unleashed
            <p>SAM is born to burn the stars</p>
          </div>
        </div>
      </div>
    </section>
  );
}