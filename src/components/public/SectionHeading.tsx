'use client';

import { useEffect, useRef, useState } from 'react';
import LiquidTitle from './LiquidTitle';

interface SectionHeadingProps {
  pre: string;
  grad: string;
  desc?: string;
  emoji?: string;
  index?: string;
  kanji?: string;
}

/**
 * Judul section gaya Izanami:
 * - Reveal "mask": tiap segmen judul naik dari dalam wadah terpotong
 *   (overflow hidden + translateY), berjenjang antar segmen.
 * - Hairline di bawah judul draw-in (scaleX) setelah teks muncul.
 * - Teks judul punya efek liquid per huruf yang sama dengan nama di hero
 *   (LiquidTitle) — huruf tertarik & bergelombang mengikuti kursor.
 * Dipicu sekali oleh IntersectionObserver saat 35% elemen terlihat.
 */
export default function SectionHeading({ pre, grad, desc, emoji, index, kanji }: SectionHeadingProps) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`text-center mask-group ${active ? 'in' : ''}`} ref={ref}>
      {(index || kanji) && (
        <p className="aw-eyebrow mb-3 justify-center" aria-hidden="true">
          {index && <span className="aw-num">{index}</span>}
          {kanji && <span className="aw-kanji">{kanji}</span>}
        </p>
      )}
      <LiquidTitle
        pre={pre}
        grad={grad}
        emoji={emoji}
        masked
        inView={active}
        className="section-heading text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 text-balance"
      />
      {/* Hairline draw-in — pengganti beam lama */}
      <span className={`sh-line ${active ? 'in' : ''}`} aria-hidden="true" />
      {desc && (
        <p className="text-slate-500 text-center mb-10 mt-6" data-reveal>
          {desc}
        </p>
      )}
    </div>
  );
}
