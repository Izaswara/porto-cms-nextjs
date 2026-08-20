import { SOCIAL_ICONS, type SocialMediaRow } from '@/lib/types';

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
    <footer className="border-t border-white/10 glass-navbar relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} {siteName}.{' '}
          <span className="text-slate-400">{siteFooter ?? 'Dibuat dengan Laravel.'}</span>
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
    </footer>
  );
}
