'use client';

import { useEffect, useRef, useState } from 'react';
import VideoOverlay from './VideoOverlay';

const PHASES = ['INITIALIZING', 'LOADING ASSETS', 'CALIBRATING', 'COMPILING SHADERS', 'SYNCING CORE', 'SYSTEM READY'];
const JA_LINES = [
  '世界へようこそ — Welcome to the world',
  '想像の先へ — Beyond imagination',
  '火花散る物語 — A story of sparks',
  '魂を燃やせ — Ignite your soul',
];

export default function Preloader({ siteName = 'FAIZ INDRIASWARA' }: { siteName?: string }) {
  const [hidden, setHidden] = useState(false);
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState(0);
  const [ja, setJa] = useState('');
  const starsRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Starfield
    const space = starsRef.current;
    if (space) {
      for (let i = 0; i < 60; i++) {
        const s = document.createElement('span');
        s.className = 'loader-star';
        const size = Math.random() * 2.5 + 1;
        s.style.width = `${size}px`;
        s.style.height = `${size}px`;
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 100}%`;
        s.style.animationDuration = `${2 + Math.random() * 4}s`;
        s.style.animationDelay = `${Math.random() * 2}s`;
        space.appendChild(s);
      }
    }

    // Sparkle particles (loader-particle)
    const wrap = particlesRef.current;
    if (wrap) {
      for (let i = 0; i < 14; i++) {
        const pt = document.createElement('span');
        pt.className = 'loader-particle';
        const sz = Math.random() * 4 + 2;
        pt.style.width = `${sz}px`;
        pt.style.height = `${sz}px`;
        pt.style.left = `${Math.random() * 100}%`;
        pt.style.top = `${Math.random() * 100}%`;
        wrap.appendChild(pt);
      }
    }

    // Progress
    const start = Date.now();
    const DURATION = 2200;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setPct(p);
      setPhase(Math.min(PHASES.length - 1, Math.floor((p / 100) * (PHASES.length - 1))));
      if (p < 100) {
        setTimeout(tick, 60);
      } else {
        setTimeout(() => setHidden(true), 300);
      }
    };
    setTimeout(tick, 150);

    // Japanese tagline typing
    const line = JA_LINES[Math.floor(Math.random() * JA_LINES.length)];
    let i = 0;
    const type = () => {
      if (i > line.length) return;
      setJa(line.slice(0, i) + '<span class="ja-cursor">▍</span>');
      i++;
      setTimeout(type, 50);
    };
    setTimeout(type, 600);

    // Fallback hide after 4.2s
    const fallback = setTimeout(() => setHidden(true), 4200);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <div id="preloader" className={hidden ? 'hidden charging' : 'charging'} aria-hidden={hidden}>
      <VideoOverlay id="loading-video" src="/videos/loading.mp4" variant="fade" loop preload="auto" playing={!hidden} />
      <div className="loader-space" ref={starsRef} />
      <div className="loader-orb" style={{ width: 420, height: 420, background: 'var(--p-primary)', top: '10%', left: '15%' }} />
      <div className="loader-orb" style={{ width: 360, height: 360, background: 'var(--p-secondary)', bottom: '10%', right: '12%', animationDelay: '-4.5s' }} />
      <div className="loader-orb" style={{ width: 260, height: 260, background: 'var(--p-accent)', top: '55%', left: '60%', animationDelay: '-8s', opacity: 0.25 }} />

      <div className="loader-particle-wrap" ref={particlesRef} />

      <svg className="loader-emblem" viewBox="0 0 220 220" aria-hidden="true">
        <circle className="em-1" cx="110" cy="110" r="96" />
        <circle className="em-2" cx="110" cy="110" r="80" />
        <circle className="em-3" cx="110" cy="110" r="64" />
      </svg>

      <div className="loader-ring">
        <div className="loader-core" />
        <span className="loader-speed l" />
        <span className="loader-speed r" />
      </div>

      <div className="loader-phase">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--p-accent)', boxShadow: '0 0 8px var(--p-accent)', animation: 'pulse 1s infinite' }} />
        {PHASES[phase]}
      </div>
      <div className="loader-ja" dangerouslySetInnerHTML={{ __html: ja }} style={{ minHeight: 14 }} />

      <div className="loader-name" id="loader-name" aria-label={siteName}>
        {siteName.split('').map((ch, i) => (
          <span key={i} className={'loader-name-letter' + (ch === ' ' ? ' space' : '')} style={{ animationDelay: `${350 + i * 70}ms` }}>
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </div>

      <div className="loader-bar">
        <span />
        <em className="loader-pct">{pct}%</em>
      </div>
      <div className="loader-text">
        {'LOADING'.split('').map((ch, i) => (
          <span className="loader-char" key={i} style={{ '--i': i } as React.CSSProperties}>{ch}</span>
        ))}
      </div>
      <div className="loader-anime">✦ ENTERING THE DIGITAL WORLD ✦</div>
    </div>
  );
}
