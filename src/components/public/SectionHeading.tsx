'use client';

import { useEffect, useRef, useState } from 'react';

interface SectionHeadingProps {
  pre: string;
  grad: string;
  desc?: string;
  emoji?: string;
}

const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]#$%&*+=~';

function ScrambleSpan({ text, active, startDelay, className }: { text: string; active: boolean; startDelay: number; className?: string }) {
  const [display, setDisplay] = useState(() => ' '.repeat(text.length));
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active || done) return;
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;
      if (elapsed < startDelay) return;
      const frame = elapsed - startDelay;
      const revealCount = Math.floor(frame / 2);
      setDisplay(
        Array.from(text)
          .map((ch, i) => {
            if (i < revealCount || ch === ' ') return ch;
            return SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
          })
          .join('')
      );
      if (revealCount >= text.length) {
        clearInterval(interval);
        setDisplay(text);
        setDone(true);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [active, text, startDelay, done]);

  return (
    <span className={className}>
      {Array.from(display).map((ch, i) => (
        <span key={i} className="sh-char">{ch}</span>
      ))}
    </span>
  );
}

export default function SectionHeading({ pre, grad, desc, emoji }: SectionHeadingProps) {
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
    <div className="text-center" ref={ref}>
      <h2 className="section-heading font-[Space_Grotesk] text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
        {emoji && <span>{emoji} </span>}
        <ScrambleSpan text={pre} active={active} startDelay={2} />
        <ScrambleSpan text={grad} active={active} startDelay={2 + pre.length * 2} className="text-gradient" />
      </h2>
      {active && <span className="sh-beam" aria-hidden="true" />}
      {desc && (
        <p className="text-slate-500 text-center mb-10" data-reveal>
          {desc}
        </p>
      )}
    </div>
  );
}
