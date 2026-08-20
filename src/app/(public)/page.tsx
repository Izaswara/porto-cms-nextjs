import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';
import { isValidLocale, getTranslations } from '@/lib/i18n';
import { t } from '@/lib/public-data';
import { formatDate } from '@/lib/utils';
import CinemaScene from '@/components/public/CinemaScene';
import SectionHeading from '@/components/public/SectionHeading';
import { ProjectCard, BlogCard } from '@/components/public/Cards';
import HeroPhoto from '@/components/public/HeroPhoto';
import HeroName from '@/components/public/HeroName';
import ContactForm from '@/components/public/ContactForm';
import type { Locale } from '@/lib/types';

interface StatItem { label: string; value: number | string; suffix?: string }

export const metadata: Metadata = { title: 'Home' };

export default async function HomePage() {
  const store = await cookies();
  const locale = isValidLocale(store.get('locale')?.value);
  const [translations, settingsRes, themeRes, menusRes, socialsRes, hero, about, projects, skills, experiences, education, certificates, posts, galleries] = await Promise.all([
    getTranslations(locale),
    db().from('settings').select('key, value'),
    db().from('themes').select('*').eq('is_active', true).maybeSingle(),
    db().from('menus').select('url, slug, name').eq('is_active', true).eq('is_hidden', false).order('sort_order', { ascending: true }),
    db().from('social_media').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('hero_sections').select('*').eq('is_active', true).maybeSingle(),
    db().from('about_sections').select('*').eq('is_active', true).maybeSingle(),
    db().from('projects').select('*').eq('status', 'published').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(6),
    db().from('skills').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('experiences').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('education').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('certificates').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    db().from('posts').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
    db().from('galleries').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false }).limit(3),
  ]);

  const settings: Record<string, string | null> = {};
  for (const row of settingsRes.data ?? []) settings[row.key] = row.value;
  const siteName = settings['site_name'] || 'Faiz Dev';
  const siteEmail = settings['site_email'] || '';
  const heroData = hero.data;
  const aboutData = about.data;
  const skillsData = skills.data ?? [];
  const experiencesData = experiences.data ?? [];
  const educationData = education.data ?? [];
  const certificatesData = certificates.data ?? [];
  const postsData = posts.data ?? [];
  const galleriesData = galleries.data ?? [];
  const socialsData = socialsRes.data ?? [];
  const projectsData = projects.data ?? [];
  const menus = menusRes.data ?? [];

  const heroName = heroData?.name || '';
  const typingTexts = Array.isArray(heroData?.typing_texts) ? (heroData.typing_texts as string[]) : [];
  const heroButtons = Array.isArray(heroData?.buttons) ? (heroData.buttons as { label: string; url: string; style?: string }[]) : [];
  const aboutStats = Array.isArray(aboutData?.statistics) ? (aboutData.statistics as StatItem[]) : [];

  return (
    <>
      {/* ===== HERO ===== */}
      <section id="hero" className="min-h-screen flex items-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 pointer-events-none">
          {/* Ambient glow orbs — animasi transform-only */}
          <div className="orb -top-40 -left-40 w-[540px] h-[540px]" style={{ background: 'var(--p-primary)', opacity: 0.24 }} />
          <div className="orb -bottom-44 -right-44 w-[580px] h-[580px]" style={{ background: 'var(--p-secondary)', animationDelay: '-4s', opacity: 0.16 }} />

          {/* Neural network: nodes + data pulses */}
          <svg className="ai-neural absolute inset-x-0 top-0 w-full h-[560px]" viewBox="0 0 1200 560" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="aiNeuralStroke" x1="0" y1="0" x2="1200" y2="560">
                <stop offset="0" style={{ stopColor: 'var(--p-primary)', stopOpacity: 0.7 }} />
                <stop offset="1" style={{ stopColor: 'var(--p-secondary)', stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            <g>
              <path className="ne-edge" d="M140 90 C 300 40, 380 200, 470 250 C 620 320, 700 160, 860 200" />
              <path className="ne-edge e2" d="M860 200 C 1000 240, 1060 380, 1130 450" />
              <path className="ne-edge e3" d="M140 90 C 200 320, 420 460, 560 470 C 760 480, 940 420, 1130 450" />
              <path className="ne-edge" d="M470 250 C 520 380, 700 430, 860 200" />
              <path className="ne-edge e2" d="M140 90 C 400 60, 760 120, 860 200" />
              <path className="ne-edge e3" d="M560 470 C 720 380, 900 320, 1130 450" />
              <path className="ne-edge" d="M860 200 C 880 300, 1000 320, 1040 380" />
            </g>
            <g>
              <circle className="ne-node" cx="140" cy="90" r="4.5" />
              <circle className="ne-node n2" cx="470" cy="250" r="3.5" />
              <circle className="ne-node n3" cx="860" cy="200" r="4" />
              <circle className="ne-node" cx="1130" cy="450" r="5" />
              <circle className="ne-node n2" cx="560" cy="470" r="4" />
              <circle className="ne-node n3" cx="1040" cy="380" r="3" />
            </g>
          </svg>

          {/* Hologram sphere */}
          <div className="ai-holo hidden lg:block absolute -top-6 right-[6%] w-[380px] h-[380px] opacity-70" aria-hidden="true">
            <div className="holo-scene">
              <div className="holo-glow" />
              <div className="holo-ring h-r1" />
              <div className="holo-ring h-r2" />
              <div className="holo-ring h-r3" />
              <div className="holo-ring h-r4" />
              <div className="holo-lat l1" />
              <div className="holo-lat l2" />
              <div className="holo-lat l3" />
              <div className="holo-core" />
            </div>
          </div>

          {/* Wireframe data cube */}
          <div className="cube-wrap hidden xl:block absolute top-40 left-[7%] opacity-60" data-parallax="0.12">
            <div className="ai-data-cube">
              <i /><i /><i /><i /><i /><i />
            </div>
          </div>

          {/* Perspective grid floor */}
          <div className="ai-floor hidden sm:block absolute left-[-20%] right-[-20%] bottom-[-4%] h-[38%]" aria-hidden="true" />

          {/* Dot & grid matrix */}
          <div className="absolute inset-0 hero-dots" />
          <div className="absolute inset-0 opacity-20 hero-grid" />
          <div className="absolute inset-0 ai-vignette" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full relative z-10" data-hero-exit>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="fade-up font-[Space_Grotesk] text-xs uppercase tracking-[.2em] text-slate-500 mb-4 inline-flex items-center gap-2" style={{ animationDelay: '.1s' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--p-primary)' }} />
                {t(translations, 'home.portfolio', 'Portfolio')}
              </p>
              <h1 className="font-[Space_Grotesk] text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight" style={{ color: 'var(--app-text)' }}>
                {t(translations, 'home.hi', "Hi, I'm")}{' '}
                <HeroName name={heroName || siteName} />
              </h1>
              {heroData?.subtitle && (
                <p className="fade-up font-[Space_Grotesk] text-lg md:text-xl mt-3 glitch" style={{ color: 'var(--app-text)', animationDelay: '.38s' }} data-text={String(heroData.subtitle)}>
                  {String(heroData.subtitle)}
                </p>
              )}
              {typingTexts.length > 0 && (
                <p className="fade-up text-cyan-300 font-medium mt-2 text-lg" style={{ animationDelay: '.48s' }}>
                  <span id="scramble-text" data-words={typingTexts.join(',')}>{typingTexts[0]}</span>
                  <span className="animate-pulse">|</span>
                </p>
              )}
              {heroData?.description && (
                <p className="fade-up text-slate-400 mt-4 leading-relaxed max-w-lg" style={{ animationDelay: '.58s' }}>{String(heroData.description)}</p>
              )}
              {heroButtons.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-8">
                  {heroButtons.map((btn, i) => (
                    <a
                      key={i}
                      href={btn.url || '#'}
                      className="magnetic fade-up px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 shine inline-block"
                      style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))', color: 'white', animationDelay: `${0.7 + i * 0.08}s` }}
                    >
                      {btn.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="fade-up relative flex justify-center lg:justify-end" style={{ animationDelay: '.28s' }}>
              <HeroPhoto photo={mediaUrl(String(heroData.photo)) ?? null} name={heroName || siteName} />
            </div>
          </div>

          <div className="fade-up absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-slate-500" style={{ animationDelay: '.95s' }}>
            <span className="text-[10px] uppercase tracking-widest">{t(translations, 'home.scroll', 'Scroll')}</span>
            <div className="w-6 h-10 rounded-full border border-white/15 flex justify-center pt-2">
              <div className="w-1 h-2 rounded-full animate-bounce" style={{ background: 'var(--p-primary)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="marquee-wrap py-6 border-y border-white/10 bg-white/[.03] relative z-10">
        <div className="marquee">
          {[...skillsData.map((s) => String(s.name)), ...skillsData.map((s) => String(s.name))].map((name, i) => (
            <span key={i} className="font-[Space_Grotesk] text-sm uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <span style={{ color: 'var(--p-primary)' }}>✦</span> {name}
            </span>
          ))}
        </div>
      </div>

      {/* ===== ABOUT ===== */}
      {aboutData && (
        <section id="about" className="py-20 relative" data-depth>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading pre={t(translations, 'about.title', 'About')} grad={t(translations, 'about.me', 'Me')} />
            <div className="grid md:grid-cols-2 gap-10 items-center mt-12">
              <div className="tilt-3d bob-anime" data-reveal="left">
                {aboutData.photo && (
                  <div className="w-64 h-64 mx-auto rounded-2xl overflow-hidden glow-ring animate-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(String(aboutData.photo)) ?? ''} alt="About" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-4" data-reveal="right">
                <p className="text-slate-300 leading-relaxed">{String(aboutData.description ?? '')}</p>
                {aboutData.quote && (
                  <blockquote className="border-l-2 px-4 py-3 italic text-slate-400" style={{ borderColor: 'var(--p-primary)' }}>
                    &quot;{String(aboutData.quote)}&quot;
                  </blockquote>
                )}
                {aboutStats.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 anime-stagger">
                    {aboutStats.map((stat, i) => (
                      <div key={i} className="text-center p-3 glass-card rounded-xl tilt-3d">
                        <p
                          className="text-2xl font-bold text-white"
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

      {/* ===== CINEMATIC SCENE ===== */}
      <CinemaScene />

      {/* ===== SKILLS ===== */}
      {skillsData.length > 0 && (
        <section id="skills" className="py-20 border-t border-white/5 relative" data-depth>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading
              pre={t(translations, 'skills.title', 'Skills &')}
              grad={t(translations, 'skills.tools', 'Tools')}
              desc={t(translations, 'skills.desc', 'Teknologi yang saya kuasai')}
            />
            <div className="flex flex-wrap justify-center gap-3 anime-stagger">
              {skillsData.map((skill) => (
                <div key={skill.id} className="glass-card px-5 py-3 rounded-xl flex items-center gap-2 hover:-translate-y-0.5 transition-all text-sm text-slate-300 tilt-3d">
                  {skill.icon && <span className="text-lg">{String(skill.icon)}</span>}
                  <span>{String(skill.name)}</span>
                  {skill.level != null && <span className="text-xs" style={{ color: 'var(--p-primary)' }}>{String(skill.level)}%</span>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROJECTS ===== */}
      {projectsData.length > 0 && (
        <section id="projects" className="py-20 border-t border-white/5 relative" data-depth>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-10" data-reveal>
              <div>
                <h2 className="font-[Space_Grotesk] text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  {t(translations, 'projects.title', 'Featured')} <span className="text-gradient">{t(translations, 'projects.subtitle', 'Projects')}</span>
                </h2>
                <p className="text-slate-500 mt-2">{t(translations, 'projects.desc', 'Beberapa project terbaru saya')}</p>
              </div>
              <a href="/projects" className="text-sm text-slate-400 hover:text-white transition-colors">{t(translations, 'home.view_all', 'Lihat semua')} →</a>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 anime-stagger">
              {projectsData.map((project) => (
                <ProjectCard key={project.id} project={project} translations={translations} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== EXPERIENCE ===== */}
      {experiencesData.length > 0 && (
        <section id="experience" className="py-20 border-t border-white/5" data-depth>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <SectionHeading
              pre={t(translations, 'experience.title', 'Work')}
              grad={t(translations, 'experience.work', 'Experience')}
            />
            <div className="space-y-6 anime-stagger mt-12">
              {experiencesData.map((exp) => {
                const achievements = Array.isArray(exp.achievements) ? (exp.achievements as string[]) : [];
                return (
                  <div key={exp.id} className="glass-card rounded-xl p-6 flex flex-col sm:flex-row gap-4 hover:-translate-y-0.5 transition-all tilt-3d">
                    <div className="sm:w-32 shrink-0">
                      <p className="text-xs text-slate-500">
                        {formatDate(exp.start_date as string | null, 'my')} — {exp.is_current ? 'Present' : formatDate(exp.end_date as string | null, 'my') || 'Present'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{String(exp.title)}</h3>
                      <p className="text-sm text-cyan-300">
                        {String(exp.company)}
                        {exp.location ? <> · {String(exp.location)}</> : null}
                      </p>
                      {exp.description && <p className="text-sm text-slate-400 mt-2">{String(exp.description)}</p>}
                      {achievements.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {achievements.map((ach, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-cyan-400 mt-1">•</span> {ach}
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

      {/* ===== EDUCATION ===== */}
      {educationData.length > 0 && (
        <section id="education" className="py-20 border-t border-white/5" data-depth>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <SectionHeading pre="🎓 " grad={t(translations, 'education.title', 'Education')} />
            <div className="space-y-6 anime-stagger mt-12">
              {educationData.map((edu) => (
                <div key={edu.id} className="glass-card rounded-xl p-6 flex flex-col sm:flex-row gap-4 tilt-3d">
                  <div className="sm:w-32 shrink-0">
                    <p className="text-xs text-slate-500">
                      {formatDate(edu.start_date as string | null, 'y')} — {edu.is_current ? 'Present' : formatDate(edu.end_date as string | null, 'y') || 'Present'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{String(edu.degree ?? '')}</h3>
                    <p className="text-sm text-cyan-300">{String(edu.institution)}</p>
                    {edu.description && <p className="text-sm text-slate-400 mt-2">{String(edu.description)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CERTIFICATES ===== */}
      {certificatesData.length > 0 && (
        <section id="certificates" className="py-20 border-t border-white/5" data-depth>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading pre="🏆 " grad={t(translations, 'certificates.title', 'Certificates')} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 anime-stagger mt-12">
              {certificatesData.map((cert) => (
                <div key={cert.id} className="glass-card rounded-xl p-5 hover:-translate-y-0.5 transition-all tilt-3d">
                  {cert.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(String(cert.image)) ?? ''} alt={String(cert.title)} className="w-full h-40 object-cover rounded-lg mb-4" />
                  )}
                  <h3 className="font-medium text-white">{String(cert.title)}</h3>
                  <p className="text-xs text-slate-500">{String(cert.issuer)}</p>
                  {cert.credential_url && (
                    <a href={String(cert.credential_url)} target="_blank" className="text-xs text-cyan-400 hover:underline mt-2 inline-block">
                      {t(translations, 'certificates.credential', 'Lihat kredensial')} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== BLOG ===== */}
      {postsData.length > 0 && (
        <section id="blog" className="py-20 border-t border-white/5" data-depth>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-10" data-reveal>
              <div>
                <h2 className="font-[Space_Grotesk] text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  {t(translations, 'blog.title', 'Latest')} <span className="text-gradient">{t(translations, 'blog.subtitle', 'Posts')}</span>
                </h2>
                <p className="text-slate-500 mt-2">{t(translations, 'blog.desc', 'Artikel dan tulisan terbaru')}</p>
              </div>
              <a href="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">{t(translations, 'home.view_all', 'Lihat semua')} →</a>
            </div>
            <div className="grid md:grid-cols-3 gap-6 anime-stagger">
              {postsData.map((post) => (
                <BlogCard key={post.id} post={post} translations={translations} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== GALLERY ===== */}
      {galleriesData.length > 0 && (
        <section id="gallery-home" className="py-20 border-t border-white/5" data-depth>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-10" data-reveal>
              <div>
                <h2 className="font-[Space_Grotesk] text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                  {t(translations, 'gallery.title', 'Photo')} <span className="text-gradient">{t(translations, 'gallery.subtitle', 'Gallery')}</span>
                </h2>
                <p className="text-slate-500 mt-2">{t(translations, 'gallery.desc', 'Dokumentasi pekerjaan & pengalaman')}</p>
              </div>
              <a href="/gallery" className="text-sm text-slate-400 hover:text-white transition-colors">{t(translations, 'home.view_all', 'Lihat semua')} →</a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 anime-stagger">
              {galleriesData.map((gallery) => {
                const images = Array.isArray(gallery.images) ? (gallery.images as string[]) : [];
                const cover = mediaUrl((gallery.cover_image as string | null) || images[0] || null);
                return (
                  <a key={gallery.id} href={`/gallery/${gallery.slug}`} className="group">
                    <div className="glass-card rounded-xl overflow-hidden hover:-translate-y-1 transition-all">
                      <div className="relative aspect-video overflow-hidden">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={String(gallery.title)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-white/[.03] flex items-center justify-center text-4xl">🖼️</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                          <div>
                            {gallery.category && (
                              <p className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">{String(gallery.category)}</p>
                            )}
                            <h3 className="font-semibold text-white">{String(gallery.title)}</h3>
                            <p className="text-[11px] text-slate-300 mt-1">{images.length} foto</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-20 border-t border-white/5 relative" data-depth>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center" data-reveal="zoom">
          <h2 className="font-[Space_Grotesk] text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t(translations, 'contact.title', "Let's")} <span className="text-gradient">{t(translations, 'contact.subtitle', 'Connect')}</span>
          </h2>
          <p className="text-slate-400 mb-8">{t(translations, 'contact.desc', 'Punya proyek atau pertanyaan? Jangan ragu untuk menghubungi saya.')}</p>
          <a
            href={`mailto:${siteEmail}`}
            className="magnetic inline-flex px-8 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 shine"
            style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))' }}
          >
            {t(translations, 'connect.email', 'Email Me')}
          </a>
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
