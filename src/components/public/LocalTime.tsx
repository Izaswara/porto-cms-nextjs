'use client';

import { useEffect, useState } from 'react';

/** Jam lokal live — detail kecil khas situs studio/awwwards. */
export default function LocalTime({ label = 'JAKARTA' }: { label?: string }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
    const tick = () => setTime(fmt.format(new Date()).replace(/\./g, ':'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="hidden lg:inline-flex items-center gap-2 font-mono-accent text-[11px] tracking-[0.18em] text-slate-500" suppressHydrationWarning>
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
      {label} {time} WIB
    </span>
  );
}
