'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLiquidGroup } from '@/lib/liquid';

interface LiquidTitleProps {
  pre: string;
  grad?: string;
  emoji?: string;
  /** grad dirender italic (meniru <em> ala aw-display) */
  em?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Bungkus segmen dengan .mask/.mask-in (reveal naik dari wadah terpotong) */
  masked?: boolean;
  /** State reveal untuk mode masked */
  inView?: boolean;
  as?: 'h1' | 'h2';
}

/**
 * LiquidTitle — judul section dengan efek liquid per huruf yang sama
 * dengan nama di hero (useLiquidGroup): huruf tertarik ke kursor lalu
 * bergelombang (translate + rotate + skew + stretch + blur + chroma).
 *
 * - h2 diberi position:relative → jadi acuan offset huruf (pola #hero-name).
 * - Mode masked: segmen naik dari mask; begitu reveal selesai, clip
 *   overflow dilepas (lt-free) dan transform mask-in dinetralkan agar
 *   offsetLeft huruf kembali relatif ke judul (akurat untuk mesin liquid).
 * - Teks asli di aria-label; huruf aria-hidden agar screen reader benar.
 */
export default function LiquidTitle({
  pre,
  grad,
  emoji,
  em,
  className,
  style,
  masked,
  inView,
  as: Tag = 'h2',
}: LiquidTitleProps) {
  const headRef = useRef<HTMLHeadingElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [free, setFree] = useState(false);

  useLiquidGroup(headRef, () => letterRefs.current, {
    R: 180,
    ampX: 11,
    ampY: 20,
    rot: 8,
    sk: 14,
    stretch: 0.18,
    blur: 1.3,
    chroma: true,
  });

  // Reveal mask selesai (~1s transisi) → lepas clip overflow wadah mask
  // agar distorsi liquid tidak terpotong (CSS .lt-free).
  useEffect(() => {
    if (!masked || !inView) return;
    const el = headRef.current;
    const done = () => setFree(true);
    const t = window.setTimeout(done, 1350);
    el?.addEventListener('transitionend', done, { once: true });
    return () => {
      window.clearTimeout(t);
      el?.removeEventListener('transitionend', done);
    };
  }, [masked, inView]);

  let idx = 0;
  const renderLetters = (text: string, isGrad: boolean) =>
    text.split('').map((ch) => {
      const i = idx++;
      return (
        <span
          key={i}
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          className={`sec-letter${isGrad ? ` text-gradient${em ? ' italic' : ''}` : ''}`}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      );
    });

  const aria = `${pre}${grad ? ` ${grad}` : ''}${emoji ? ` ${emoji}` : ''}`;

  const segment = (text: string, isGrad: boolean, delay?: string) => {
    const inner = <span className="lt-seg" aria-hidden="true">{renderLetters(text, isGrad)}</span>;
    if (!masked) return inner;
    return (
      <span className="mask">
        <span className="mask-in" style={delay ? { transitionDelay: delay } : undefined}>
          {inner}
        </span>
      </span>
    );
  };

  return (
    <Tag ref={headRef} className={`relative${className ? ` ${className}` : ''}${free ? ' lt-free' : ''}`} style={style} aria-label={aria}>
      {emoji && (
        <span className="mask" aria-hidden="true">
          <span className="mask-in">{emoji}</span>
        </span>
      )}
      {segment(pre, false)}
      {grad ? <> {segment(grad, true, '180ms')}</> : null}
    </Tag>
  );
}
