import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { isValidLocale, getTranslations } from '@/lib/i18n';
import { t } from '@/lib/public-data';
import { mediaUrl } from '@/lib/db';
import Preloader from '@/components/public/Preloader';
import SiteFx from '@/components/public/SiteFx';
import ClickFx from '@/components/public/ClickFx';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import RevealEngine from '@/components/public/RevealEngine';
import LocaleSync from '@/components/public/LocaleSync';
import Hud from '@/components/public/Hud';
import MusicBar from '@/components/public/MusicBar';
import type { Locale, SocialMediaRow } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await db().from('settings').select('key, value');
  const settings: Record<string, string | null> = {};
  for (const row of data ?? []) settings[row.key] = row.value;
  const siteName = settings['site_name'] || 'Faiz Dev';
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: { default: siteName, template: `%s — ${siteName}` },
    description: `Portfolio ${siteName} — projects, blog & gallery.`,
    icons: settings['site_favicon'] ? { icon: mediaUrl(settings['site_favicon']) ?? undefined } : undefined,
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const locale = isValidLocale(store.get('locale')?.value);
  const [settingsRes, menusRes, socialsRes, translations] = await Promise.all([
    db().from('settings').select('key, value'),
    db().from('menus').select('url, slug, name').eq('is_active', true).eq('is_hidden', false).order('sort_order', { ascending: true }),
    db().from('social_media').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    getTranslations(locale),
  ]);

  const settings: Record<string, string | null> = {};
  for (const row of settingsRes.data ?? []) settings[row.key] = row.value;

  const siteName = settings['site_name'] || 'Faiz Dev';
  const menus = (menusRes.data ?? []).map((m) => ({ url: m.url ?? '#', slug: m.slug, name: m.name }));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root{--p-primary:#ff3333;--p-secondary:#d90429;--p-accent:#ff6b6b;}` }} />
      <LocaleSync locale={locale as Locale} />
      <Preloader siteName={siteName} />
      <SiteFx />
      <ClickFx />
      <RevealEngine />
      <Hud />
      <Navbar
        siteName={siteName}
        siteLogo={mediaUrl(settings['site_logo'])}
        menus={menus}
        locale={locale as Locale}
        translations={translations}
        contactLabel={t(translations, 'home.contact_me', 'Contact Me')}
        cvUrl={settings['cv_url'] || null}
      />
      <main className="relative z-10">{children}</main>
      <Footer
        siteName={siteName}
        siteFooter={settings['site_footer']}
        socials={(socialsRes.data ?? []) as SocialMediaRow[]}
      />
      <MusicBar />
    </>
  );
}
