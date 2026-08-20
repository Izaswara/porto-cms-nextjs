import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { mediaUrl } from '@/lib/db';
import ViewTracker from '@/components/public/ViewTracker';

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
  return {
    title: seo?.meta_title || data.title,
    description: seo?.meta_description || data.description || undefined,
    openGraph: {
      title: seo?.og_title || data.title,
      description: seo?.og_description || data.description || undefined,
      images: mediaUrl((seo?.og_image as string) || (data.thumbnail as string) || '') ? [{ url: mediaUrl((seo?.og_image as string) || (data.thumbnail as string))! }] : undefined,
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

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <ViewTracker type="project" id={project.id as number} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <a href="/projects" className="text-sm text-slate-400 hover:text-white transition-colors">← Semua project</a>
        <h1 className="font-[Space_Grotesk] text-3xl md:text-5xl font-bold text-white mt-6" data-reveal>
          {project.title}
        </h1>
        {project.category && <p className="text-sm text-cyan-400 mt-2">{project.category}</p>}

        {project.thumbnail && (
          <div className="mt-8 glow-ring rounded-2xl overflow-hidden" data-reveal="zoom">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(String(project.thumbnail)) ?? ''} alt={project.title} className="w-full object-cover" />
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
                <span key={tech} className="px-3 py-1.5 rounded-full bg-white/5 text-slate-300 text-sm">{tech}</span>
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
                className="px-6 py-3 rounded-xl text-sm font-medium text-white border border-white/15 hover:bg-white/5 transition-all yo-btn"
              >
                🔗 GitHub
              </a>
            )}
            {project.live_url && (
              <a
                href={String(project.live_url)}
                target="_blank"
                className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 shine yo-btn"
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
