'use client';

/**
 * Adaptive engine — device capability detection + progressive performance mode.
 *
 * Tidak bergantung pada user-agent. Hanya memakai feature detection (dengan
 * fallback aman bila API tidak tersedia) lalu menyetel atribut data-* pada
 * <html> yang bisa dibaca oleh CSS dan komponen lain:
 *
 *   - data-performance="low|medium|high"   ← klasifikasi konservatif
 *   - data-save-data="1|0"                 ← navigator.connection.saveData
 *   - data-reduced-motion="1|0"            ← prefers-reduced-motion
 *   - data-touch="1|0"                     ← pointer coarse / any-pointer coarse
 *   - data-network="slow-2g|2g|3g|4g|wifi|unknown"
 *
 * Klasifikasi bersifat PROGRESSIVE, bukan penghalang fungsional. Perangkat
 * low-end tetap bisa membaca semua konten — hanya efek dekoratif yang berat
 * yang diturunkan. Seluruh logic berjalan sekali per muatan penuh dan
 * memperbarui data-network/save-data saat koneksi berubah.
 */

export type PerformanceMode = 'low' | 'medium' | 'high';
export type NetworkSpeed = 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';

export interface AdaptiveState {
  performance: PerformanceMode;
  reducedMotion: boolean;
  saveData: boolean;
  touch: boolean;
  hover: boolean;
  finePointer: boolean;
  network: NetworkSpeed;
  dpr: number;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
}

const DEFAULTS: AdaptiveState = {
  performance: 'medium',
  reducedMotion: false,
  saveData: false,
  touch: false,
  hover: true,
  finePointer: true,
  network: 'unknown',
  dpr: 1,
  hardwareConcurrency: null,
  deviceMemory: null,
};

// ── Network Information API (progressive, safe fallback) ────────
type NetworkInfo = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  addEventListener?: (t: string, fn: () => void) => void;
  removeEventListener?: (t: string, fn: () => void) => void;
};

function readNetwork(): { network: NetworkSpeed; saveData: boolean } {
  const con = (navigator as unknown as { connection?: NetworkInfo }).connection;
  const saveData = con?.saveData === true;
  const et = con?.effectiveType;
  let network: NetworkSpeed = 'unknown';
  if (et === 'slow-2g') network = 'slow-2g';
  else if (et === '2g') network = '2g';
  else if (et === '3g') network = '3g';
  else if (et === '4g') network = '4g';
  return { network, saveData };
}

/** Klasifikasi konservatif. Setiap syarat yang "berat" menurunkan mode. */
function classify(partial: {
  memory: number | null;
  cores: number | null;
  network: NetworkSpeed;
  saveData: boolean;
  reduced: boolean;
  dpr: number;
  touch: boolean;
}): PerformanceMode {
  const { memory, cores, network, saveData, reduced, dpr, touch } = partial;

  // Reduced motion / kecil / lambat tidak butuh visual berat.
  if (reduced) return 'low';

  // Tandanya jelas low-end.
  if (saveData) return 'low';
  if (network === 'slow-2g' || network === '2g') return 'low';

  const lowSignal =
    (memory !== null && memory <= 4) ||
    (cores !== null && cores <= 4) ||
    network === '3g' ||
    (touch && dpr <= 1); // mobile layar kecil tanpa retina → hemat

  if (lowSignal) {
    // Setidaknya satu sinyal kuat berarti kemungkinan besar low-end.
    const strongLow =
      (memory !== null && memory <= 2) ||
      (cores !== null && cores <= 2) ||
      network === '3g';
    return strongLow ? 'low' : 'medium';
  }

  const highSignal =
    (memory === null || memory >= 8) &&
    (cores === null || cores >= 8) &&
    dpr >= 1.5;
  return highSignal ? 'high' : 'medium';
}

/**
 * Inisialisasi deteksi + set atribut pada <html>. Dipanggil sekali di
 * client (bisa dari komponen provider yang dimount begitu saja) lalu
 * mendengarkan perubahan koneksi untuk memperbarui mode.
 *
 * Mengembalikan fungsi cleanup.
 */
export function initAdaptive(): () => void {
  if (typeof window === 'undefined') return () => {};
  const doc = document.documentElement;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = window.matchMedia('(hover: hover)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const coarse = window.matchMedia('(any-pointer: coarse)').matches;
  const touch = coarse && !fine;

  const con = (navigator as unknown as { connection?: NetworkInfo }).connection;
  const hardwareConcurrency =
    typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;
  const deviceMemory =
    (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null;
  const dpr = window.devicePixelRatio || 1;

  const apply = () => {
    const { network, saveData } = readNetwork();
    const performance = classify({
      memory: deviceMemory,
      cores: hardwareConcurrency,
      network,
      saveData,
      reduced,
      dpr,
      touch,
    });

    const state: AdaptiveState = {
      performance,
      reducedMotion: reduced,
      saveData,
      touch,
      hover,
      finePointer: fine,
      network,
      dpr,
      hardwareConcurrency,
      deviceMemory,
    };

    doc.setAttribute('data-performance', performance);
    doc.setAttribute('data-save-data', saveData ? '1' : '0');
    doc.setAttribute('data-reduced-motion', reduced ? '1' : '0');
    doc.setAttribute('data-touch', touch ? '1' : '0');
    doc.setAttribute('data-network', network);

    // Expose state terbaru ke runtime (untuk komponen yang memanggil secara
    // imperatif lewat getAdaptiveState()).
    currentState = state;
  };

  apply();

  const onChange = () => apply();
  con?.addEventListener?.('change', onChange);
  return () => con?.removeEventListener?.('change', onChange);
}

let currentState = DEFAULTS;

/** Getter sinkron — membaca state terakhir yang sudah dihitung. */
export function getAdaptiveState(): AdaptiveState {
  return currentState;
}

/** Hook-style convenience: baca mode performa saat ini. */
export function getPerformanceMode(): PerformanceMode {
  return currentState.performance;
}
