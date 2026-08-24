'use client';

import { useEffect, useRef } from 'react';
import { useLiquidGroup } from '@/lib/liquid';

/**
 * HeroName — nama di hero dengan liquid distortion per huruf.
 *
 * Saat kursor mendekat, setiap huruf tertarik ke kursor lalu bergelombang
 * (translate + rotate + skewY + scaleX + blur) dengan noise organik per
 * huruf — huruf terasa meleleh menyatu dengan lensa di latar.
 *
 * Loop rAF mati otomatis saat kursor jauh & huruf pulang tenang.
 * Nonaktif di perangkat sentuh & prefers-reduced-motion.
 */
export default function HeroName({ name }: { name: string }) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);

  // Mesin liquid bersama (satu rAF untuk semua grup teks hero)
  useLiquidGroup(
    wrapRef,
    () => letterRefs.current,
    { R: 220, ampX: 18, ampY: 26, rot: 9, sk: 16, stretch: 0.2, blur: 1.4, chroma: true }
  );

  return (
    <span id="hero-name" ref={wrapRef} className="hero-name" aria-label={name}>
      <span className="hero-name-letters">
        {name.split('').map((ch: string, i: number) => (
          <span
            key={i}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            className="hero-letter"
            style={{ animationDelay: `${320 + i * 55}ms` }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
