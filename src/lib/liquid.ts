'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Mesin liquid distortion bersama untuk teks hero.
 *
 * Satu loop rAF tunggal menggerakkan SEMUA grup teks yang terdaftar
 * (nama, "Hi I'm", eyebrow, JP, subtitle, dst.) dengan matematika yang
 * sama dengan lensa WebGL di latar: tarik ke arah kursor + gelombang
 * sin + skew + stretch + blur + chromatic aberration.
 *
 * - Posisi huruf/unit diukur dari offset statis (bebas umpan-balik
 *   transform), diukur ulang saat resize.
 * - Semua nilai di-lerp → jejak air mengikuti kursor dengan inersia.
 * - Loop mati otomatis saat kursor jauh & semua unit pulang tenang.
 * - Nonaktif untuk perangkat sentuh & prefers-reduced-motion.
 */

export interface LiquidCur {
  x: number;
  y: number;
  r: number;
  sk: number;
  sx: number;
  b: number;
}

export interface LiquidItem {
  el: HTMLElement;
  ox: number;
  oy: number;
  w: number;
  h: number;
  phase: number;
  cur: LiquidCur;
}

export interface LiquidOpts {
  R?: number;      // radius jangkauan
  ampX?: number;   // dorongan horizontal ke arah kursor
  ampY?: number;   // amplitudo gelombang vertikal
  rot?: number;    // rotasi maks (deg)
  sk?: number;     // skewY maks (deg) — efek meleleh
  stretch?: number;// scaleX tambahan
  blur?: number;   // blur maks (px)
  chroma?: boolean;// text-shadow pecah merah/biru
}

interface Group {
  container: HTMLElement;
  getItems: () => Array<HTMLElement | null>;
  items: LiquidItem[];
  opts: Required<LiquidOpts>;
  measure: () => void;
}

const groups = new Set<Group>();
let raf = 0;
let running = false;
let bound = false;
let mx = -9999;
let my = -9999;
let smx = -9999;
let smy = -9999;
let calmFrames = 0;

const DEFAULTS: Required<LiquidOpts> = {
  R: 240,
  ampX: 12,
  ampY: 14,
  rot: 6,
  sk: 8,
  stretch: 0.12,
  blur: 1,
  chroma: false,
};

/**
 * Offset LAYOUT huruf relatif ke kontainer grup — dihitung dengan
 * menjumlahkan rantai offsetParent sampai ketemu kontainer. Nilai
 * offsetLeft/offsetTop bersih dari pengaruh transform, tapi offsetParent
 * bisa "melompat" ke ancestor ber-transform/will-change (mis. .mask-in)
 * sehingga offset tunggal tidak lagi relatif ke kontainer. Penjumlahan
 * rantai membuat pengukuran selalu akurat terlepas dari CSS di sekitar.
 */
function offsetWithin(el: HTMLElement, container: HTMLElement): { ox: number; oy: number } {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== container) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  if (n !== container) return { ox: el.offsetLeft, oy: el.offsetTop }; // fallback aman
  return { ox: x, oy: y };
}

function onMove(e: PointerEvent) {
  mx = e.clientX;
  my = e.clientY;
  start();
}

function ensureBound() {
  if (bound) return;
  bound = true;
  window.addEventListener('pointermove', onMove, { passive: true });
}

const loop = () => {
  if (smx < -999) {
    smx = mx;
    smy = my;
  }
  smx += (mx - smx) * 0.14;
  smy += (my - smy) * 0.14;

  const now = performance.now();
  let anyClose = false;
  let allSettled = true;

  for (const g of groups) {
    const rect = g.container.getBoundingClientRect();
    for (const it of g.items) {
      const cx = rect.left + it.ox + it.w / 2;
      const cy = rect.top + it.oy + it.h / 2;
      const dx = smx - cx;
      const dy = smy - cy;
      const dist = Math.hypot(dx, dy);
      let f = Math.max(0, 1 - dist / g.opts.R);
      f = f * f * (3 - 2 * f); // smoothstep — tepi lembut seperti kaca
      if (f > 0.01) anyClose = true;

      const n = Math.sin(it.phase + now * 0.0028);
      const wave = Math.sin(dist * 0.032 - now * 0.005 + it.phase);
      const dirX = dx === 0 ? 0 : Math.sign(dx);

      const tX = (dirX * g.opts.ampX + n * g.opts.ampX * 0.5) * f;
      const tY = (wave * -g.opts.ampY + dy * 0.05) * f;
      const tR = (n * g.opts.rot + wave * g.opts.rot * 0.4) * f;
      const tSk = n * g.opts.sk * f;
      const tSx = 1 + (g.opts.stretch + n * g.opts.stretch * 0.6) * f;
      const tB = g.opts.blur * f;

      const c = it.cur;
      c.x += (tX - c.x) * 0.16;
      c.y += (tY - c.y) * 0.16;
      c.r += (tR - c.r) * 0.16;
      c.sk += (tSk - c.sk) * 0.16;
      c.sx += (tSx - c.sx) * 0.16;
      c.b += (tB - c.b) * 0.16;

      it.el.style.transform = `translate(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px) rotate(${c.r.toFixed(2)}deg) skewY(${c.sk.toFixed(2)}deg) scaleX(${c.sx.toFixed(3)})`;
      it.el.style.filter = c.b > 0.06 ? `blur(${c.b.toFixed(2)}px)` : 'none';

      // Chromatic aberration — pecah merah/biru senada shader latar
      if (g.opts.chroma) {
        const chroma = Math.min(1, c.b / Math.max(g.opts.blur, 0.001));
        it.el.style.textShadow =
          chroma > 0.05
            ? `${(-3 * chroma).toFixed(1)}px 0 rgba(255, 64, 64, ${(0.5 * chroma).toFixed(2)}), ${(3 * chroma).toFixed(1)}px 0 rgba(96, 140, 255, ${(0.5 * chroma).toFixed(2)})`
            : 'none';
      }

      if (Math.abs(c.x) + Math.abs(c.y) + Math.abs(c.sk) > 0.4) allSettled = false;
    }
  }

  // Kursor jauh & semua tenang → bersihkan gaya & matikan loop
  if (!anyClose && allSettled && ++calmFrames > 70) {
    for (const g of groups) {
      for (const it of g.items) {
        it.el.style.transform = '';
        it.el.style.filter = '';
        it.el.style.textShadow = 'none';
      }
    }
    running = false;
    return;
  }
  calmFrames = anyClose ? 0 : calmFrames;
  raf = requestAnimationFrame(loop);
};

function start() {
  ensureBound();
  if (!running) {
    running = true;
    calmFrames = 0;
    raf = requestAnimationFrame(loop);
  }
}

/**
 * Hook: daftarkan grup unit teks (huruf/word span) ke mesin liquid.
 * containerRef = wadah yang jadi acuan pengukuran; getEls = daftar
 * elemen unit (boleh berisi null — dilewati).
 */
export function useLiquidGroup(
  containerRef: RefObject<HTMLElement | null>,
  getEls: () => Array<HTMLElement | null>,
  opts?: LiquidOpts
) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Nonaktif di perangkat sentuh & mode performa rendah (comment aslinya
    // mengklaim ini, tapi tidak pernah diimplementasikan — sekarang nyata).
    // Touch/mobile coarse tidak punya hover stabil: menggerakkan teks saat
    // scroll/drag cukup boros. Fallback aman jika atribut belum sempat disetel.
    const doc = document.documentElement;
    const touch =
      window.matchMedia('(any-pointer: coarse)').matches &&
      !window.matchMedia('(pointer: fine)').matches;
    const lowMode = doc.getAttribute('data-performance') === 'low';
    if (touch || lowMode) return;
    const container = containerRef.current;
    if (!container) return;

    const group: Group = {
      container,
      getItems: getEls,
      items: [],
      opts: { ...DEFAULTS, ...opts },
      measure: () => {},
    };

    const build = () => {
      group.items = group
        .getItems()
        .flatMap((el, i) => {
          if (!el) return [];
          const { ox, oy } = offsetWithin(el, container);
          return [
            {
              el,
              ox,
              oy,
              w: el.offsetWidth,
              h: el.offsetHeight,
              phase: i * 2.399963 + Math.random() * 0.8,
              cur: { x: 0, y: 0, r: 0, sk: 0, sx: 1, b: 0 } as LiquidCur,
            },
          ];
        })
        .map((it) => {
          // Lerp JS menggerakkan transform — transition CSS dimatikan
          // untuk transform (filter tetap diberi transisi halus).
          it.el.style.transition = 'filter 0.25s ease';
          it.el.style.willChange = 'transform, filter';
          return it;
        });
    };

    build();
    group.measure = build;
    groups.add(group);
    start();
    window.addEventListener('resize', build);

    return () => {
      window.removeEventListener('resize', build);
      groups.delete(group);
      if (groups.size === 0) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
