'use client';

import { useRef } from 'react';

/**
 * Futuristic hero name:
 * - Letter-by-letter 3D reveal (staggered, smooth cubic-bezier)
 * - Flowing holo shimmer (animated gradient across the text)
 * - Interactive cursor spotlight (holo glow following mouse)
 * - white-space: nowrap -> nama tidak pernah terpecah tengah kata
 */
export default function HeroName({ name }: { name: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const wrap = wrapRef.current;
    const glow = glowRef.current;
    if (!wrap || !glow) return;
    const r = wrap.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    glow.style.opacity = '1';
    glow.style.background = `radial-gradient(160px circle at ${x.toFixed(1)}% 50%, color-mix(in srgb, var(--p-accent) 40%, transparent), transparent 72%)`;
  };

  const onLeave = () => {
    if (glowRef.current) glowRef.current.style.opacity = '0';
  };

  return (
    <span id="hero-name" ref={wrapRef} className="hero-name" onMouseMove={onMove} onMouseLeave={onLeave} aria-label={name}>
      <span className="hero-name-glow" ref={glowRef} aria-hidden="true" />
      <span className="hero-name-letters">
        {name.split('').map((ch: string, i: number) => (
          <span key={i} className="hero-letter" style={{ animationDelay: `${320 + i * 55}ms` }}>
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
