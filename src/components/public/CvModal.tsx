'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CvModalProps {
  url: string;
  onClose: () => void;
}

/** Modal preview CV via iframe + tombol download. */
export default function CvModal({ url, onClose }: CvModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-black/90 flex flex-col items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div className="w-full max-w-4xl flex items-center justify-between mb-3">
        <span className="font-cinzel text-[11px] uppercase tracking-[0.3em] text-slate-300" style={{ fontFamily: 'var(--font-cinzel)' }}>
          <span style={{ color: 'var(--p-secondary)' }}>●</span> CV PREVIEW
        </span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="btn-solid inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wider transition-all hover:opacity-85"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            DOWNLOAD
          </a>
          <button
            onClick={onClose}
            aria-label="Tutup CV"
            className="w-10 h-10 rounded-none flex items-center justify-center text-slate-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        className="cv-frame w-full max-w-4xl h-[78vh] overflow-hidden border border-white/15 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe src={url} title="CV" className="w-full h-full" />
      </div>
    </div>,
    document.body
  );
}
