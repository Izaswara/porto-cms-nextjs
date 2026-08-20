'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

interface VideoOverlayProps {
  src: string;
  id?: string;
  variant?: 'slide' | 'fade';
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  phase?: 'in' | 'nav' | 'out';
  playing?: boolean;
  className?: string;
  containerStyle?: CSSProperties;
  onEnded?: () => void;
  onTime?: (video: HTMLVideoElement) => void;
  onError?: () => void;
  onFadeOutDone?: () => void;
}

/** Overlay video: slide-up/fade-in di awal, fade-out di akhir. Dipakai untuk transisi menu, theme & loading. */
export default function VideoOverlay({
  src,
  id,
  variant = 'fade',
  loop = false,
  preload = 'metadata',
  phase = 'in',
  playing = true,
  className,
  containerStyle,
  onEnded,
  onTime,
  onError,
  onFadeOutDone,
}: VideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    // Pastikan src selalu terpasang (StrictMode nge-cleanup & hapus src pas re-mount,
    // jadi mesti di-set ulang biar video nggak blank)
    video.src = src;
    const play = () => video.play().catch(() => {});
    if (video.readyState >= 2) play();
    else {
      video.addEventListener('canplay', play, { once: true });
      video.addEventListener('loadeddata', play, { once: true });
    }
    return () => {
      video.pause();
      video.removeEventListener('canplay', play);
      video.removeEventListener('loadeddata', play);
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) video.play().catch(() => {});
    else video.pause();
  }, [playing]);

  useEffect(() => {
    if (phase !== 'out') return;
    const t = window.setTimeout(() => onFadeOutDone?.(), 600);
    return () => clearTimeout(t);
  }, [phase, onFadeOutDone]);

  return (
    <div className={`video-overlay vo-${variant}${phase === 'out' ? ' vo-out' : ''}${className ? ` ${className}` : ''}`} style={containerStyle} aria-hidden="true">
      <video
        ref={videoRef}
        id={id}
        src={src}
        muted
        autoPlay
        playsInline
        loop={loop}
        preload={preload}
        onEnded={onEnded}
        onError={onError}
        onTimeUpdate={(e) => onTime?.(e.currentTarget)}
      />
    </div>
  );
}