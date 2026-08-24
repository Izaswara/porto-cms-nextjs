import Image from 'next/image';
import TechIcon from '@/components/public/TechIcon';
import { mediaUrl } from '@/lib/db';
import { t } from '@/lib/public-data';
import { formatDate, truncate } from '@/lib/utils';

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  cover_image: string | null;
  created_at: string | null;
}

function fmtViews(views: unknown): string | null {
  const n = Number(views ?? 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function ProjectCard({ project, translations, viewAll }: { project: Record<string, unknown> & { id: number }; translations: Record<string, string>; viewAll?: boolean }) {
  const slug = String(project.slug);
  const thumbnail = mediaUrl(project.thumbnail as string | null);
  const techs = Array.isArray(project.tech_stack) ? (project.tech_stack as string[]) : [];
  const views = fmtViews(project.views);
  return (
    <a href={`/projects/${slug}`} className="group">
      <div className="plate-card project-card blog-card overflow-hidden hover:-translate-y-1 transition-all">
        {thumbnail ? (
          <div className="relative aspect-video overflow-hidden">
            <Image src={thumbnail} alt={String(project.title)} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-[filter,transform] duration-700" />
          </div>
        ) : (
          <div className="aspect-video bg-white/[.03] flex items-center justify-center">
            <span className="text-slate-600">No image</span>
          </div>
        )}
        <div className="p-5">
          <p className="font-mono-accent text-[11px] uppercase tracking-wider text-slate-500 mb-1">{String(project.category ?? '')}</p>
          <h3 className="font-display font-semibold text-white group-hover:text-neutral-300 transition-colors">{String(project.title)}</h3>
          <p className="text-sm text-slate-400 mt-2 line-clamp-2">{String(project.description ?? '')}</p>
          {techs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {techs.map((tech) => (
                <span key={tech} className="font-mono-accent text-[10px] px-2 py-0.5 bg-white/5 text-slate-500 inline-flex items-center gap-1.5">
                  <TechIcon name={tech} className="w-3 h-3 opacity-80" />
                  {tech}
                </span>
              ))}
            </div>
          )}
          {views && (
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.33c-.22-.21-.22-.45 0-.66A10.5 10.5 0 0112 5.5c3.8 0 7.1 2 9.96 6.17.22.21.22.45 0 .66A10.5 10.5 0 0112 18.5c-3.8 0-7.1-2-9.96-6.17z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {views}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export function BlogCard({ post, translations }: { post: Record<string, unknown> & { id: number }; translations: Record<string, string> }) {
  const slug = String(post.slug);
  const cover = mediaUrl(post.cover_image as string | null);
  const category = post.category ? String(post.category) : null;
  const excerpt = (post.excerpt as string | null) ?? truncate(post.content as string | null, 100);
  const views = fmtViews(post.views);
  return (
    <a href={`/blog/${slug}`} className="group">
      <div className="plate-card project-card blog-card overflow-hidden hover:-translate-y-1 transition-all">
        {cover && (
          <div className="relative aspect-video overflow-hidden">
            <Image src={cover} alt={String(post.title)} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-[filter,transform] duration-700" />
          </div>
        )}
        <div className="p-5">
          {category && <p className="font-mono-accent text-[10px] uppercase tracking-wider text-slate-500 mb-2">{category}</p>}
          <h3 className="font-display font-semibold text-white group-hover:text-neutral-300 transition-colors">{String(post.title)}</h3>
          <p className="text-sm text-slate-400 mt-2 line-clamp-2">{excerpt}</p>
          <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
            {views && (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.33c-.22-.21-.22-.45 0-.66A10.5 10.5 0 0112 5.5c3.8 0 7.1 2 9.96 6.17.22.21.22.45 0 .66A10.5 10.5 0 0112 18.5c-3.8 0-7.1-2-9.96-6.17z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {views}
                <span className="opacity-60">·</span>
              </>
            )}
            {formatDate(post.created_at as string | null, 'mdY')}
          </p>
        </div>
      </div>
    </a>
  );
}
