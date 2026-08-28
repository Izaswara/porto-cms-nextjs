'use client';

import { useEffect } from 'react';

/**
 * ClickSweep — respon klik ala HUD Izanami:
 * tampil empat "tick" sudut (braket-L halus) persis motif bingkai kartu
 * di situs, lalu memudar. EFEK INI HANYA berlaku saat menekan opsi di
 * dalam menu navigasi fullscreen (.menu-link) — tidak untuk tombol lain.
 * Listener capture + pointerdown supaya efek terlihat sebelum navigasi.
 */
export default function ClickSweep() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const CLEAR_MS = 650;
    const SEL = '.menu-link';

    const spawn = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(SEL);
      if (!el) return;
      if (el.hasAttribute('data-no-sweep')) return;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 22) return;
      // jangan menumpuk sapuan pada elemen yang sama
      if (el.querySelector('.clk-sweep')) return;

      const pos = getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';

      const wrap = document.createElement('span');
      wrap.className = 'clk-sweep';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML = `
        <span class="clk-tick clk-tl"></span>
        <span class="clk-tick clk-tr"></span>
        <span class="clk-tick clk-bl"></span>
        <span class="clk-tick clk-br"></span>
      `;
      el.appendChild(wrap);
      window.setTimeout(() => wrap.remove(), CLEAR_MS);
    };

    // capture + pointerdown → efek muncul lebih dulu dari aksi klik
    document.addEventListener('pointerdown', spawn, true);
    return () => document.removeEventListener('pointerdown', spawn, true);
  }, []);

  return null;
}