'use client';

import { useEffect, useState } from 'react';

/**
 * Jam lokal live — detail kecil khas situs studio/awwwards.
 * Gaya didorong CSS variable (--lt-*) dengan default yang aman, sehingga
 * tiap konteks (footer / fixed-rail / menu) bisa menyesuaikan ukuran,
 * spacing & warna tanpa menumpuk utility yang bentrok.
 */
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
    <span className="local-time" suppressHydrationWarning>
      <span className="local-time-dot" aria-hidden="true" />
      {label} {time} WIB
    </span>
  );
}
