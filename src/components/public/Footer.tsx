import { SOCIAL_ICONS, type SocialMediaRow } from '@/lib/types';
import LocalTime from './LocalTime';

/**
 * Footer editorial — senada bahasa visual baru:
 * baris meta Cinzel (© / jam lokal / back-to-top), wordmark raksasa
 * Playfair outline, tick sudut ala kartu, social icons.
 */
export default function Footer({
  siteName,
  siteFooter,
  socials,
}: {
  siteName: string;
  siteFooter: string | null;
  socials: SocialMediaRow[];
}) {
  return (
    <footer className="footer-editorial border-t border-white/10 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        {/* Baris meta mono */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono-accent text-[10px] uppercase tracking-[0.32em] text-slate-500 mb-10">
          <span>© {new Date().getFullYear()} — {siteName}</span>
          <LocalTime label="" />
          <a href="#hero" className="link-line hover:text-white transition-colors">
            Back to top ↑
          </a>
        </div>

        <a href="#hero" className="block w-fit" aria-label={`Kembali ke atas — ${siteName}`}>
          <span className="footer-wordmark block">{siteName}</span>
        </a>
        {siteFooter && (
          <p className="font-body-serif text-slate-400 mt-4 max-w-md" style={{ lineHeight: 2 }}>
            {siteFooter}
          </p>
        )}

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono-accent text-[11px] uppercase tracking-[0.28em] text-slate-500">
            ( 終 ) End of page
          </p>
          <div className="flex items-center gap-4">
            {socials.map((social) => {
              const mapped = social.icon ? SOCIAL_ICONS[social.icon.toLowerCase()] : undefined;
              const iconPath =
                mapped ??
                (social.icon && /^[Mm]/.test(social.icon.trim())
                  ? social.icon
                  : 'M7 17L17 7M7 7h10v10');
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  title={social.platform}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                  </svg>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
