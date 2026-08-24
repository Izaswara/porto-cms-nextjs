import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { isValidLocale, getTranslations } from '@/lib/i18n';
import { t } from '@/lib/public-data';
import { mediaUrl } from '@/lib/db';
import { getSettings, getMenus, getSocials } from '@/lib/cache';
import { siteUrl, FALLBACK_SITE_NAME } from '@/lib/site';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import RevealEngine from '@/components/public/RevealEngine';
import LenisProvider from '@/components/public/LenisProvider';
import LocaleSync from '@/components/public/LocaleSync';
import Hud from '@/components/public/Hud';
import LeftRail from '@/components/public/LeftRail';
import Preloader from '@/components/public/Preloader';
import MusicBar from '@/components/public/MusicBar';
import FixedRail from '@/components/public/FixedRail';
import EdgeRails from '@/components/public/EdgeRails';
import CustomCursor from '@/components/public/CustomCursor';
import ScrollRibbon from '@/components/public/ScrollRibbon';
import JsonLd from '@/components/public/JsonLd';
import type { Locale } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings['site_name'] || FALLBACK_SITE_NAME;
  const description =
    settings['site_description'] ||
    `Portfolio ${siteName} — projects, blog & gallery.`;
  const favicon = settings['site_favicon'] ? mediaUrl(settings['site_favicon']) ?? undefined : undefined;
  const ogImage = settings['site_og_image'] ? mediaUrl(settings['site_og_image']) : undefined;

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: siteName, template: `%s — ${siteName}` },
    description,
    applicationName: siteName,
    keywords: ['portfolio', 'developer', 'web developer', 'projects', 'blog', siteName],
    authors: [{ name: siteName }],
    creator: siteName,
    alternates: { canonical: '/' },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      alternateLocale: ['en_US'],
      url: '/',
      siteName,
      title: siteName,
      description,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: siteName }]
        : favicon
          ? [{ url: favicon, alt: siteName }]
          : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: favicon ? { icon: favicon } : { icon: '/favicon.svg' },
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const locale = isValidLocale(store.get('locale')?.value);
  const [settings, menus, socials, translations] = await Promise.all([
    getSettings(),
    getMenus(),
    getSocials(),
    getTranslations(locale),
  ]);

  const siteName = settings['site_name'] || FALLBACK_SITE_NAME;
  const siteEmail = settings['site_email'] || '';
  const base = siteUrl();

  // Structured data identitas situs — tampil di semua halaman publik
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: base,
      inLanguage: locale,
      description: settings['site_description'] || `Portfolio ${siteName}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: siteName,
      url: base,
      email: siteEmail || undefined,
      sameAs: socials.map((s) => s.url).filter(Boolean),
      jobTitle: settings['site_role'] || undefined,
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      {/* Layer warna ambient — kabut triad di belakang seluruh konten */}
      <div className="aurora-layer" aria-hidden="true">
        <span className="aurora-blob" />
      </div>
      <Preloader />
      <LocaleSync locale={locale as Locale} />
      <LenisProvider />
      <RevealEngine />
      <CustomCursor />
      <ScrollRibbon />
      <Hud />
      <LeftRail siteName={siteName} />
      <Navbar
        menus={menus}
        locale={locale as Locale}
        translations={translations}
        cvUrl={settings['cv_url'] || null}
      />
      <main className="relative z-10">{children}</main>
      <Footer
        siteName={siteName}
        siteFooter={settings['site_footer']}
        socials={socials}
      />
      <MusicBar />
      <EdgeRails socials={socials} />
      <FixedRail siteName={siteName} />
    </>
  );
}
