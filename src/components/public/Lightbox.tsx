'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  images: string[];
}

export default function Lightbox({ images }: LightboxProps) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (index === null) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowLeft') setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
      if (e.key === 'ArrowRight') setIndex((i) => (i === null ? i : (i + 1) % images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, images.length]);

  if (index === null) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
      onClick={() => setIndex(null)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
        onClick={() => setIndex(null)}
        aria-label="Tutup"
      >
        ✕
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
        }}
        aria-label="Sebelumnya"
      >
        ‹
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIndex((i) => (i === null ? i : (i + 1) % images.length));
        }}
        aria-label="Berikutnya"
      >
        ›
      </button>
    </div>,
    document.body
  );
}

export function GalleryGrid({ images, label }: { images: string[]; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div id="gallery-grid" className="grid grid-cols-2 lg:grid-cols-3 gap-4 anime-stagger mt-8">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setOpen(true)}
            className="group relative aspect-square overflow-hidden rounded-xl glass-card cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${label} ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 text-white text-2xl">
              🔍
            </span>
          </button>
        ))}
      </div>
      {open && <Lightbox images={images} />}
    </>
  );
}
