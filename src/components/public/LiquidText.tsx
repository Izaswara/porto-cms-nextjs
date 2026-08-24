'use client';

import { useRef } from 'react';
import { useLiquidGroup } from '@/lib/liquid';

interface LiquidTextProps {
  text: string;
  mode?: 'letter' | 'word';
  className?: string;
  /** Parameter liquid khusus (opsional) */
  R?: number;
  ampX?: number;
  ampY?: number;
  sk?: number;
  blur?: number;
  chroma?: boolean;
}

/**
 * LiquidText — teks apa pun yang ikut liquid distortion bersama lensa
 * latar. mode 'letter' memecah per huruf (untuk teks pendek/judul),
 * mode 'word' per kata (untuk paragraf agar tetap terbaca & ringan).
 *
 * Unit dirender sebagai span inline-block dengan aria-hidden, sementara
 * teks utuh disimpan di aria-label container (aksesibel tetap aman).
 */
export default function LiquidText({
  text,
  mode = 'letter',
  className,
  R,
  ampX,
  ampY,
  sk,
  blur,
  chroma,
}: LiquidTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const unitRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const units = mode === 'word' ? text.split(/(\s+)/) : [...text];

  useLiquidGroup(ref, () => unitRefs.current, { R, ampX, ampY, sk, blur, chroma });

  return (
    <span ref={ref} className={`inline-block ${className ?? ''}`} aria-label={text}>
      {units.map((u, i) =>
        /^\s+$/.test(u) ? (
          <span key={`s${i}`}>{'\u00A0'}</span>
        ) : (
          <span
            key={i}
            ref={(el) => {
              unitRefs.current[i] = el;
            }}
            className="inline-block will-change-transform"
            aria-hidden="true"
          >
            {u}
          </span>
        )
      )}
    </span>
  );
}
