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
    let id: ReturnType<typeof setInterval> | undefined;
    // Jeda interval saat tab tidak terlihat — hemat main-thread pada
    // perangkat lemah & battery. Resume saat kembali aktif.
    const sync = () => {
      if (document.hidden) {
        if (id) clearInterval(id);
        id = undefined;
      } else if (!id) {
        tick();
        id = setInterval(tick, 1000);
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    const onVis = () => id && clearInterval(id);
    window.addEventListener('pagehide', onVis);
    return () => {
      if (id) clearInterval(id);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pagehide', onVis);
    };
  }, []);

  return (
    <span className="local-time" suppressHydrationWarning>
      <span className="local-time-dot" aria-hidden="true" />
      {label} {time} WIB
    </span>
  );
}
