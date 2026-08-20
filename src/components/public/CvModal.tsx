'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CvModalProps {
  url: string;
  onClose: () => void;
}

export default function CvModal({ url, onClose }: CvModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="cv-header w-full max-w-4xl flex items-center justify-between mb-3">
        <span className="font-[Space_Grotesk] text-xs tracking-[0.25em] text-slate-400">
          <span className="text-[var(--p-accent)]">●</span> CV PREVIEW
        </span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
            </svg>
            DOWNLOAD
          </a>
          <button
            onClick={onClose}
            aria-label="Tutup CV"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        className="cv-frame w-full max-w-4xl h-[78vh] rounded-2xl overflow-hidden border border-white/15 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe src={url} title="CV" className="w-full h-full" />
      </div>
    </div>,
    document.body
  );
}
