import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import TechIcon from '@/components/public/TechIcon';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import { getSettings } from '@/lib/cache';
import ViewTracker from '@/components/public/ViewTracker';
import JsonLd from '@/components/public/JsonLd';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await db()
    .from('projects')
    .select('title, description, thumbnail, seo')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (!data) return { title: 'Project' };
  const seo = data.seo as Record<string, string> | null;
  const title = seo?.meta_title || data.title;
  const description = seo?.meta_description || data.description || undefined;
  const image = mediaUrl((seo?.og_image as string) || (data.thumbnail as string) || '');
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: 'article',
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      url: `/projects/${slug}`,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: project } = await db()
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!project) notFound();

  const techStack = Array.isArray(project.tech_stack) ? (project.tech_stack as string[]) : [];
  const thumbnail = mediaUrl(String(project.thumbnail ?? ''));
  const siteName = (await getSettings())['site_name'] || 'Faiz Dev';
  const projectJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: String(project.title),
    description: String(project.description ?? ''),
    image: thumbnail ?? undefined,
    author: { '@type': 'Person', name: siteName, url: siteUrl() },
    url: `${siteUrl()}/projects/${slug}`,
    keywords: techStack.length > 0 ? techStack.join(', ') : undefined,
    ...(project.live_url ? { sameAs: [String(project.live_url)] } : {}),
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <JsonLd data={projectJsonLd} />
      <ViewTracker type="project" id={project.id as number} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <a href="/projects" className="text-sm text-slate-400 hover:text-white transition-colors">← Semua project</a>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-white mt-6" data-reveal>
          {project.title}
        </h1>
        {project.category && <p className="font-mono-accent text-xs uppercase tracking-widest text-slate-500 mt-2">{project.category}</p>}

        {project.thumbnail && (
          <div className="relative mt-8 aspect-video border border-white/10 overflow-hidden group" data-reveal="zoom">
            <Image src={mediaUrl(String(project.thumbnail)) ?? ''} alt={String(project.title)} fill sizes="(max-width: 896px) 100vw, 896px" priority className="object-cover grayscale-[60%] contrast-[1.04] group-hover:grayscale-0 transition-[filter] duration-700" />
          </div>
        )}

        {project.description && (
          <div className="mt-8 prose prose-invert max-w-none text-slate-300 leading-relaxed" data-reveal>
            {String(project.description)
              .split('\n')
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>
        )}

        {techStack.length > 0 && (
          <div className="mt-8" data-reveal>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span key={tech} className="px-3 py-1.5 bg-white/5 text-slate-300 text-sm inline-flex items-center gap-2">
                  <TechIcon name={tech} className="w-4 h-4 opacity-90" />
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {(project.github_url || project.live_url) && (
          <div className="flex flex-wrap gap-3 mt-10" data-reveal>
            {project.github_url && (
              <a
                href={String(project.github_url)}
                target="_blank"
                className="px-6 py-3 text-sm font-medium text-white border border-white/15 hover:bg-white/5 transition-all yo-btn"
              >
                🔗 GitHub
              </a>
            )}
            {project.live_url && (
              <a
                href={String(project.live_url)}
                target="_blank"
                className="px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 shine yo-btn"
                style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))' }}
              >
                🚀 Live Demo
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
