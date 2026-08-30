'use client';

import { useEffect } from 'react';
import { initAdaptive } from '@/lib/adaptive';

/**
 * AdaptiveProvider — satu-satunya tempat yang menginisialisasi deteksi
 * kemampuan perangkat & performance mode. Menyetel atribut data-* pada
 * <html>. Tidak merender apa pun; murni efek samping global.
 */
export default function AdaptiveProvider() {
  useEffect(() => initAdaptive(), []);
  return null;
}
