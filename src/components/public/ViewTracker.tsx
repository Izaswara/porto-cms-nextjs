'use client';

import { useEffect, useRef, useState } from 'react';

export default function ViewTracker({ type, id }: { type: 'project' | 'post'; id: number }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const key = `pcms-view:${type}:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage tidak tersedia — tetap lewati (tidak fatal)
    }
    fetch('/api/public/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    }).catch(() => {});
  }, [type, id]);

  return null;
}
