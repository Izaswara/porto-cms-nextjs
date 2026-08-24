'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function FilterBar({ categories, placeholder }: { categories: string[]; placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [q, setQ] = useState(search.get('q') ?? '');
  const cat = search.get('category') ?? '';
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function push(nextQ: string, nextCat: string) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextCat) params.set('category', nextCat);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(q, cat), 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const chipBase = 'px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer border';
  const textStyle = { color: 'var(--app-text)' };
  const mutedStyle = { color: 'var(--app-muted)' };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
      <div className="relative flex-1 max-w-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder ?? 'Cari...'}
          className="w-full glass-card px-4 py-2.5 pr-10 text-sm outline-none"
          style={{ color: 'var(--app-text)', background: 'transparent' }}
        />
        <svg
          className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={mutedStyle}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <div className="flex flex-wrap gap-2">
        {['', ...categories].map((c) => {
          const active = (c === '' && !cat) || c === cat;
          return (
            <button
              key={c || 'all'}
              onClick={() => push(q, c)}
              className={`${chipBase} ${active ? 'chip-active border-transparent' : 'glass-card'}`}
              style={!active ? { color: 'var(--app-muted)', borderColor: 'var(--hairline)' } : undefined}
            >
              {c || 'Semua'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
