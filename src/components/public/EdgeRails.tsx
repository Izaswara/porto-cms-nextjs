import type { SocialMediaRow } from '@/lib/types';

/**
 * EdgeRails — rail sosial vertikal di sisi kanan viewport (desktop saja).
 * Pola penempatan khas situs nominasi Awwwards. Murni statis, tanpa JS.
 */
export default function EdgeRails({ socials }: { socials: SocialMediaRow[] }) {
  if (socials.length === 0) return null;
  return (
    <div className="edge-rail edge-rail-right" aria-hidden="false">
      <span className="edge-rail-text text-slate-500">FOLLOW —</span>
      <div className="flex flex-col items-center gap-4">
        {socials.slice(0, 3).map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={s.platform}
            className="text-slate-500 hover:text-white transition-colors"
          >
            {String(s.platform).slice(0, 2).toUpperCase()}
          </a>
        ))}
      </div>
    </div>
  );
}
