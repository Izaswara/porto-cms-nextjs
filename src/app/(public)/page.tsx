import type { Metadata } from 'next';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { mediaUrl } from '@/lib/db';
import { isValidLocale, getTranslations } from '@/lib/i18n';
import { t } from '@/lib/public-data';
import { formatDate } from '@/lib/utils';
import { getSettings, getHomeContent, getShowcase } from '@/lib/cache';
import ShowcaseSection from '@/components/public/ShowcaseSection';
import SectionHeading from '@/components/public/SectionHeading';
import LiquidTitle from '@/components/public/LiquidTitle';
import { StackCards, ProfilePin } from '@/components/public/CardStack';
import GlassLens from '@/components/public/GlassLens';
import HeroPhoto from '@/components/public/HeroPhoto';
import HeroName from '@/components/public/HeroName';
import LiquidText from '@/components/public/LiquidText';
import TechIcon, { techSlug } from '@/components/public/TechIcon';
import ContactForm from '@/components/public/ContactForm';

interface StatItem { label: string; value: number | string; suffix?: string }

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: { canonical: '/' },
    openGraph: { url: '/' },
  };
}

export default async function HomePage() {
  const store = await cookies();
  const locale = isValidLocale(store.get('locale')?.value);
  const [translations, settings, content, showcase] = await Promise.all([
    getTranslations(locale),
    getSettings(),
    getHomeContent(),
    getShowcase(),
  ]);

  const siteName = settings['site_name'] || 'Faiz Dev';
  const siteEmail = settings['site_email'] || '';
  const heroData = content.hero;
  const aboutData = content.about;
  const skillsData = content.skills;
  const experiencesData = content.experiences;
  const educationData = content.education;
  const certificatesData = content.certificates;
  const postsData = content.posts;
  const galleriesData = content.galleries;
  const projectsData = content.projects;

  const heroName = String(heroData?.name ?? '');
  const heroPhoto = mediaUrl(String(heroData?.photo ?? ''));
  const heroBg = mediaUrl(String(heroData?.background_image ?? ''));
  const typingTexts = Array.isArray(heroData?.typing_texts) ? (heroData.typing_texts as string[]) : [];
  const heroButtons = Array.isArray(heroData?.buttons) ? (heroData.buttons as { label: string; url: string; style?: string }[]) : [];
  const aboutStats = Array.isArray(aboutData?.statistics) ? (aboutData.statistics as StatItem[]) : [];

  const ShowcaseGroup = ({ list }: { list: typeof showcase.after_projects }) =>
    list.length > 0 ? (
      <>
        {list.map((item, i) => (
          <ShowcaseSection key={item.id} item={item} index={i} />
        ))}
      </>
    ) : null;

  return (
    <>
      {/* ===== HERO - foto profil sebagai KARTU editorial, background dari admin ===== */}
      <section id="hero" className="relative flex flex-col justify-end overflow-hidden" style={{ minHeight: '100svh' }}>
        {/* Layer background: foto background dari admin dengan glass lens + B&W redup */}
        <div className="absolute inset-0" aria-hidden="true" data-hero-fade>
          {heroBg ? (
            <div className="absolute inset-0 grayscale-[45%] contrast-[1.04]">
              <GlassLens src={heroBg} priority sizes="100vw" intensity={1.1} />
            </div>
          ) : (
            <div className="w-full h-full grain" style={{ background: 'radial-gradient(ellipse at 62% 38%, #191919 0%, #000000 72%)' }} />
          )}
          <div className="orb -right-24 top-24 w-[380px] h-[380px]" style={{ background: 'rgb(var(--tint-copper))', opacity: 0.08 }} />
          {/* Scrim kiri ke kanan: teks tetap terbaca tapi lensa tetap kelihatan */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0.42) 45%, rgba(0,0,0,0.12) 100%)' }} />
          {/* Scrim atas ke bawah: nyatu ke body di bawah */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 30%, rgba(0,0,0,0.55) 80%, #000000 100%)' }} />
          {/* Veil hitam: menutup hero saat scroll keluar (transisi ke About) */}
          <div className="absolute inset-0 bg-black" style={{ opacity: 0 }} data-hero-veil />
        </div>

        {/* Meta sudut ala studio */}
        <p className="hero-corner top-24 right-5 sm:right-8 text-right hidden sm:block fade-up" style={{ animationDelay: '.9s' }}>
          Based in Indonesia —<br />Working Worldwide
        </p>
        <p className="hero-corner top-24 left-5 sm:left-8 hidden lg:block fade-up" style={{ animationDelay: '1s' }}>
          ( ポートフォリオ )
        </p>

        <div className="w-full relative z-10 px-5 sm:px-[7vw] pb-24 pt-36">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-12 lg:gap-16 items-end">
            <div className="max-w-3xl">
              <p className="aw-eyebrow fade-up mb-6" style={{ animationDelay: '.1s' }}>
                <span className="aw-num">01</span>
                <span className="aw-kanji">私</span>
                <LiquidText
                  text={t(translations, 'home.portfolio', 'Portfolio')}
                  className="uppercase"
                  R={240}
                  ampX={10}
                  ampY={12}
                  sk={8}
                  blur={0.9}
                  chroma
                />
              </p>
              <h1 className="aw-display mb-2" style={{ color: '#f5ede2' }}>
                <LiquidText
                  text={t(translations, 'home.hi', "Hi, I'm")}
                  className="align-baseline"
                  chroma
                />{' '}
                <HeroName name={heroName || siteName} />
              </h1>
              {typeof heroData?.subtitle === 'string' && heroData.subtitle && (
                <p className="fade-up font-body-serif text-xl md:text-2xl mt-4 leading-relaxed" style={{ animationDelay: '.38s', lineHeight: 1.9 }}>
                  <LiquidText text={String(heroData.subtitle)} mode="word" R={300} ampX={14} ampY={10} sk={5} blur={0.8} chroma />
                </p>
              )}
              {typingTexts.length > 0 && (
                <p className="fade-up mt-3 text-lg text-slate-300" data-wave style={{ animationDelay: '.48s', fontFamily: 'var(--font-mincho)' }}>
                  <span id="scramble-text" data-words={typingTexts.join(',')}>{typingTexts[0]}</span>
                  <span className="animate-pulse" style={{ color: 'var(--p-secondary)' }}>＿</span>
                </p>
              )}
              {typeof heroData?.description === 'string' && heroData.description && (
                <p className="fade-up text-slate-300/90 mt-5 max-w-xl" style={{ animationDelay: '.58s', lineHeight: 2 }}>
                  <LiquidText text={String(heroData.description)} mode="word" R={300} ampX={12} ampY={8} sk={4} blur={0.7} chroma />
                </p>
              )}
              {heroButtons.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-10">
                  {heroButtons.map((btn, i) => (
                    <a
                      key={i}
                      href={btn.url || '#'}
                      className={`btn-line fade-up magnetic ${btn.style === 'outline' ? 'opacity-80 hover:opacity-100' : ''}`}
                      style={{ animationDelay: `${0.7 + i * 0.12}s` }}
                    >
                      <span>{btn.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Foto profil: kartu potret editorial — DIBEDAKAN dari background */}
            {heroPhoto && (
              <div className="fade-up justify-self-center lg:justify-self-end pb-2" style={{ animationDelay: '.82s' }}>
                <HeroPhoto
                  photo={heroPhoto}
                  name={heroName || siteName}
                  role={typingTexts[0] || (typeof heroData?.subtitle === 'string' ? heroData.subtitle : undefined)}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== SHOWCASE (after hero) ===== */}
      <ShowcaseGroup list={showcase.after_hero} />

      {/* ===== MARQUEE ===== */}
      <div className="marquee-wrap py-6 border-y border-white/10 bg-white/[.03] relative z-10">
        <div className="marquee">
          {[...skillsData.map((s) => String(s.name)), ...skillsData.map((s) => String(s.name))].map((name, i) => (
            <span key={i} className="font-display text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2.5">
              <TechIcon name={name} className="w-4 h-4 opacity-70" /> {name}
            </span>
          ))}
        </div>
      </div>

      {/* ===== ABOUT ===== */}
      {aboutData && (
        <section id="about" className="py-20 relative" data-book data-depth data-kanji="私">
          <span className="page-veil" aria-hidden="true" />
          <span className="page-veil" aria-hidden="true" />
          {/* Layer warna: kabut tembaga hangat */}
          <div className="orb -left-32 top-24 w-[420px] h-[420px]" style={{ background: 'rgb(var(--tint-copper))', opacity: 0.07 }} aria-hidden="true" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading index="01" kanji="私" pre={t(translations, 'about.title', 'About')} grad={t(translations, 'about.me', 'Me')} />
            <div className="grid md:grid-cols-2 gap-10 mt-12">
              {typeof aboutData.photo === 'string' && aboutData.photo && (
                <ProfilePin
                  src={mediaUrl(aboutData.photo) ?? ''}
                  alt={`Foto ${siteName}`}
                  name={heroName || siteName}
                  role={typingTexts[0] || (typeof heroData?.subtitle === 'string' ? heroData.subtitle : undefined)}
                />
              )}
              <div className="space-y-4 self-center" data-reveal="right">
                <p className="text-slate-300 leading-relaxed" style={{ lineHeight: 2 }}>{String(aboutData.description ?? '')}</p>
                {typeof aboutData.quote === 'string' && aboutData.quote && (
                  <blockquote className="border-l pl-5 py-3 font-body-serif text-lg italic text-slate-300" style={{ borderColor: 'var(--p-secondary)', lineHeight: 2 }}>
                    <span className="text-slate-500 mr-1">&ldquo;</span>{String(aboutData.quote)}<span className="text-slate-500 ml-1">&rdquo;</span>
                  </blockquote>
                )}
                {aboutStats.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 anime-stagger">
                    {aboutStats.map((stat, i) => (
                      <div key={i} className="text-center p-3 glass-card tilt-3d">
                        <p
                          className="font-mono-accent text-2xl font-bold text-white tabular-nums"
                          data-counter={typeof stat.value === 'number' ? String(stat.value) : String(Number(stat.value) || 0)}
                          data-suffix={typeof stat.value === 'number' ? (stat.suffix ?? '') : ''}
                        >
                          {String(stat.value ?? '0')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{stat.label ?? ''}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== SKILLS ===== */}
      {skillsData.length > 0 && (
        <section id="skills" className="py-20 border-t border-white/5 relative" data-book data-depth data-kanji="技">
          <span className="page-veil" aria-hidden="true" />
          <span className="page-veil" aria-hidden="true" />
          <div className="orb -right-28 top-10 w-[360px] h-[360px]" style={{ background: 'rgb(var(--tint-cyan))', opacity: 0.05 }} aria-hidden="true" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading
              index="02"
              kanji="技"
              pre={t(translations, 'skills.title', 'Skills &')}
              grad={t(translations, 'skills.tools', 'Tools')}
              desc={t(translations, 'skills.desc', 'Teknologi yang saya kuasai')}
            />
            <div className="flex flex-wrap justify-center gap-3 anime-stagger">
              {skillsData.map((skill) => (
                <div key={skill.id} className="glass-card px-5 py-3 flex items-center gap-2.5 hover:-translate-y-0.5 transition-all text-sm text-slate-300 tilt-3d">
                  {techSlug(String(skill.name)) ? (
                    <TechIcon name={String(skill.name)} className="w-4 h-4" />
                  ) : (
                    Boolean(skill.icon) && <span className="text-lg">{String(skill.icon)}</span>
                  )}
                  <span>{String(skill.name)}</span>
                  {skill.level != null && <span className="text-xs" style={{ color: 'var(--p-secondary)' }}>{String(skill.level)}%</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROJECTS — index rows ala panel bernomor Izanami ===== */}
      {projectsData.length > 0 && (
        <section id="projects" className="py-20 border-t border-white/5 relative" data-book data-depth data-kanji="作品">
          <span className="page-veil" aria-hidden="true" />
          <span className="page-veil" aria-hidden="true" />
          <div className="orb -left-24 bottom-10 w-[400px] h-[400px]" style={{ background: 'rgb(var(--tint-indigo))', opacity: 0.06 }} aria-hidden="true" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-12" data-reveal>
              <div>
                <p className="aw-eyebrow mb-4"><span className="aw-num">03</span> <span className="aw-kanji">作品</span> {t(translations, 'home.view_all', 'Work')}</p>
                <LiquidTitle
                  className="section-heading text-white"
                  pre={t(translations, 'projects.title', 'Featured')}
                  grad={t(translations, 'projects.subtitle', 'Projects')}
                />
              </div>
              <a href="/projects" className="link-line font-mono-accent text-xs uppercase tracking-[0.25em] text-slate-400 hover:text-white transition-colors">{t(translations, 'home.view_all', 'Lihat semua')} →</a>
            </div>
            <div data-reveal>
              {projectsData.map((project, i) => {
                const slug = String(project.slug);
                const thumbnail = mediaUrl(project.thumbnail as string | null);
                const techs = Array.isArray(project.tech_stack) ? (project.tech_stack as string[]) : [];
                return (
                  <a key={project.id} href={`/projects/${slug}`} className="index-row group">
                    <span className="index-num">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="index-title block">{String(project.title)}</span>
                      {techs.length > 0 && (
                        <span className="block mt-2 text-sm text-slate-500" style={{ fontFamily: 'var(--font-mincho)' }}>
                          {techs.slice(0, 4).join(' · ')}
                        </span>
                      )}
                    </span>
                    <span className="index-cat">
                      {String(project.category ?? '')}
                      <span className="block mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--p-secondary)' }}>View →</span>
                    </span>
                    {thumbnail && (
                      <span className="index-thumb">
                        <Image src={thumbnail} alt="" fill sizes="220px" className="object-cover" />
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== SHOWCASE (after projects) ===== */}
      <ShowcaseGroup list={showcase.after_projects} />

      {/* ===== EXPERIENCE ===== */}
      {experiencesData.length > 0 && (
        <section id="experience" className="py-20 border-t border-white/5 relative" data-book data-depth data-kanji="経験">
          <span className="page-veil" aria-hidden="true" />
          <span className="page-veil" aria-hidden="true" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <SectionHeading
              index="04"
              kanji="経験"
              pre={t(translations, 'experience.title', 'Work')}
              grad={t(translations, 'experience.work', 'Experience')}
            />
            <div className="space-y-6 anime-stagger mt-12">
              {experiencesData.map((exp) => {
                const achievements = Array.isArray(exp.achievements) ? (exp.achievements as string[]) : [];
                return (
                  <div key={exp.id} className="glass-card p-6 flex flex-col sm:flex-row gap-4 hover:-translate-y-0.5 transition-all tilt-3d">
                    <div className="sm:w-32 shrink-0">
                      <p className="text-xs text-slate-500">
                        {formatDate(exp.start_date as string | null, 'my')} — {exp.is_current ? 'Present' : formatDate(exp.end_date as string | null, 'my') || 'Present'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{String(exp.title)}</h3>
                      <p className="text-sm text-white">
                        {String(exp.company)}
                        {Boolean(exp.location) ? <> · {String(exp.location)}</> : null}
                      </p>
                      {Boolean(exp.description) && <p className="text-sm text-slate-400 mt-2" style={{ lineHeight: 1.9 }}>{String(exp.description)}</p>}
                      {achievements.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {achievements.map((ach, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-slate-500 mt-1">•</span> {ach}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== SHOWCASE (after experience) ===== */}
      <ShowcaseGroup list={showcase.after_experience} />

      {/* ===== EDUCATION ===== */}
      {educationData.length > 0 && (
        <section id="education" className="py-20 border-t border-white/5 relative" data-book data-depth data-kanji="学">
          <span className="page-veil" aria-hidden="true" />
          <span className="page-veil" aria-hidden="true" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <SectionHeading index="05" kanji="学" pre={t(translations, 'education.title', 'Education')} grad="" />
            <div className="space-y-6 anime-stagger mt-12">
              {educationData.map((edu) => (
                <div key={edu.id} className="glass-card p-6 flex flex-col sm:flex-row gap-4 tilt-3d">
                  <div className="sm:w-32 shrink-0">
                    <p className="text-xs text-slate-500">
                      {formatDate(edu.start_date as string | null, 'y')} — {edu.is_current ? 'Present' : formatDate(edu.end_date as string | null, 'y') || 'Present'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{String(edu.degree ?? '')}</h3>
                    <p className="text-sm text-white">{String(edu.institution)}</p>
                    {Boolean(edu.description) && <p className="text-sm text-slate-400 mt-2" style={{ lineHeight: 1.9 }}>{String(edu.description)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CERTIFICATES ===== */}
      {certificatesData.length > 0 && (
        <section id="certificates" className="py-20 border-t border-white/5 relative overflow-hidden" data-book data-depth data-kanji="証">
          <span className="page-veil" aria-hidden="true" />
          <div className="px-5 sm:px-[7vw]">
            <SectionHeading index="06" kanji="証" pre={t(translations, 'certificates.title', 'Certificates')} grad="" />
            <p className="hidden sm:block text-right font-mono-accent text-[10px] uppercase tracking-[0.35em] text-slate-500 -mt-6">
              Geser →
            </p>
          </div>

          {/* Strip horizontal: kartu sertifikat snap per kartu */}
          <div className="cert-strip flex gap-6 overflow-x-auto snap-x snap-mandatory px-5 sm:px-[7vw] mt-10 pb-2 anime-stagger">
            {certificatesData.map((cert, i) => {
              const img = typeof cert.image === 'string' ? cert.image : null;
              const initial = String(cert.title ?? 'C').charAt(0).toUpperCase();
              return (
                <article
                  key={cert.id}
                  className="cert-card group relative shrink-0 w-[300px] sm:w-[400px] snap-start border border-white/10 bg-white/[0.03] hover:border-white/25 transition-colors"
                >
                  <span className="absolute top-4 left-5 z-10 font-label text-[11px] tracking-[0.3em] text-white/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="relative h-52 overflow-hidden" data-img-reveal>
                    {img ? (
                      <Image
                        src={mediaUrl(img) ?? ''}
                        alt={`Sertifikat ${String(cert.title)}`}
                        fill
                        sizes="400px"
                        className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-[filter,transform] duration-700"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center bg-neutral-950">
                        <span className="font-serif italic text-8xl text-white/10 select-none">{initial}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>

                  <div className="p-5">
                    <p className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-slate-500">
                      {String(cert.issuer)}
                      {cert.issue_date ? ` · ${formatDate(cert.issue_date as string, 'my')}` : ''}
                    </p>
                    <h3 className="font-serif text-2xl text-white mt-2 leading-snug">{String(cert.title)}</h3>
                    {Boolean(cert.description) && (
                      <p className="text-sm text-slate-400 mt-2" style={{ lineHeight: 1.9 }}>
                        {String(cert.description)}
                      </p>
                    )}
                    {Boolean(cert.credential_url) && (
                      <a
                        href={String(cert.credential_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-line font-mono-accent text-[11px] uppercase tracking-[0.25em] text-slate-400 hover:text-white transition-colors mt-4 inline-block"
                      >
                        {t(translations, 'certificates.credential', 'Lihat kredensial')} →
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Edge fade kanan & kiri — strip menyatu ke hitam pekat */}
          <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-black to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-black to-transparent" aria-hidden="true" />
        </section>
      )}

      {/* ===== BLOG ===== */}
      {postsData.length > 0 && (
        <section id="blog" className="py-20 border-t border-white/5 relative" data-book data-depth data-kanji="記事">
          <span className="page-veil" aria-hidden="true" />
          <span className="page-veil" aria-hidden="true" />
          <div className="orb -right-24 top-16 w-[380px] h-[380px]" style={{ background: 'rgb(var(--tint-indigo))', opacity: 0.055 }} aria-hidden="true" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-10" data-reveal>
              <div>
                <p className="aw-eyebrow mb-4"><span className="aw-num">07</span> <span className="aw-kanji">記事</span> {t(translations, 'blog.subtitle', 'Posts')}</p>
                <LiquidTitle
                  className="section-heading text-white"
                  pre={t(translations, 'blog.title', 'Latest')}
                  grad={t(translations, 'blog.subtitle', 'Posts')}
                />
                <p className="text-slate-500 mt-2">{t(translations, 'blog.desc', 'Artikel dan tulisan terbaru')}</p>
              </div>
              <a href="/blog" className="link-line font-mono-accent text-xs uppercase tracking-[0.25em] text-slate-400 hover:text-white transition-colors">{t(translations, 'home.view_all', 'Lihat semua')} →</a>
            </div>
            <StackCards
              items={postsData.map((post, i) => ({
                id: post.id,
                href: `/blog/${String(post.slug)}`,
                image: mediaUrl(post.cover_image as string | null),
                alt: String(post.title),
                eyebrow: `${String(i + 1).padStart(2, '0')} · ${formatDate(post.published_at as string | null, 'my')}`,
                title: String(post.title),
                subtitle: Boolean(post.excerpt) ? String(post.excerpt).slice(0, 150) : undefined,
                cta: t(translations, 'blog.read', 'Read'),
              }))}
            />
          </div>
        </section>
      )}

      {/* ===== SHOWCASE (after blog) ===== */}
      <ShowcaseGroup list={showcase.after_blog} />

      {/* ===== GALLERY ===== */}
      {galleriesData.length > 0 && (
        <section id="gallery-home" className="py-20 border-t border-white/5 relative" data-book data-depth data-kanji="写真">
          <span className="page-veil" aria-hidden="true" />
          <span className="page-veil" aria-hidden="true" />
          <div className="orb -left-28 top-20 w-[380px] h-[380px]" style={{ background: 'rgb(var(--tint-cyan))', opacity: 0.05 }} aria-hidden="true" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-10" data-reveal>
              <div>
                <p className="aw-eyebrow mb-4"><span className="aw-num">08</span> <span className="aw-kanji">写真</span> {t(translations, 'gallery.subtitle', 'Gallery')}</p>
                <LiquidTitle
                  className="section-heading text-white"
                  pre={t(translations, 'gallery.title', 'Photo')}
                  grad={t(translations, 'gallery.subtitle', 'Gallery')}
                />
                <p className="text-slate-500 mt-2">{t(translations, 'gallery.desc', 'Dokumentasi pekerjaan & pengalaman')}</p>
              </div>
              <a href="/gallery" className="link-line font-mono-accent text-xs uppercase tracking-[0.25em] text-slate-400 hover:text-white transition-colors">{t(translations, 'home.view_all', 'Lihat semua')} →</a>
            </div>
            <StackCards
              items={galleriesData.map((gallery, i) => {
                const images = Array.isArray(gallery.images) ? (gallery.images as string[]) : [];
                const cover = mediaUrl((gallery.cover_image as string | null) || images[0] || null);
                return {
                  id: gallery.id,
                  href: `/gallery/${String(gallery.slug)}`,
                  image: cover,
                  alt: String(gallery.title),
                  eyebrow: `${String(i + 1).padStart(2, '0')} · ${String(gallery.category ?? '')}`,
                  title: String(gallery.title),
                  subtitle: `${images.length} foto`,
                  cta: t(translations, 'gallery.view', 'Lihat Album'),
                };
              })}
            />
          </div>
        </section>
      )}

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-24 border-t border-white/5 relative overflow-hidden" data-book data-depth data-kanji="連絡">
        <span className="page-veil" aria-hidden="true" />
        <span className="page-veil" aria-hidden="true" />
        <div className="orb -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px]" style={{ background: 'rgb(var(--tint-indigo))', opacity: 0.08 }} aria-hidden="true" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10" data-reveal="zoom">
          <p className="aw-eyebrow mb-4 justify-center"><span className="aw-num">09</span> <span className="aw-kanji">連絡</span> {t(translations, 'connect.email', 'Email Me')}</p>
          <LiquidTitle
            className="aw-display mb-5"
            style={{ color: 'var(--app-text)' }}
            pre={t(translations, 'contact.title', "Let's")}
            grad={t(translations, 'contact.subtitle', 'Connect')}
            em
          />
          <p className="text-slate-400 mb-8 max-w-md mx-auto" style={{ lineHeight: 2 }}>{t(translations, 'contact.desc', 'Punya proyek atau pertanyaan? Jangan ragu untuk menghubungi saya.')}</p>
          <a
            href={`mailto:${siteEmail}`}
            className="magnetic btn-solid inline-flex px-9 py-4 text-sm font-semibold transition-all hover:opacity-85 shine"
          >
            {t(translations, 'connect.email', 'Email Me')} →
          </a>
          <div className="mt-12">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
