import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { isValidLocale, getTranslations } from '@/lib/i18n';
import { t } from '@/lib/public-data';
import { ProjectCard } from '@/components/public/Cards';
import FilterBar from '@/components/public/FilterBar';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const category = (sp.category ?? '').trim();
  const store = await cookies();
  const locale = isValidLocale(store.get('locale')?.value);

  let query = db().from('projects').select('*').eq('status', 'published');
  if (q) query = query.ilike('title', `%${q}%`);
  if (category) query = query.eq('category', category);

  const [translations, projectsRes, catRes] = await Promise.all([
    getTranslations(locale),
    query.order('created_at', { ascending: false }),
    db().from('projects').select('category').eq('status', 'published').not('category', 'is', null),
  ]);

  const categories = [...new Set((catRes.data ?? []).map((r) => String(r.category)).filter(Boolean))];

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="font-[Space_Grotesk] text-4xl font-bold text-white mb-2">
          All <span className="text-gradient">Projects</span>
        </h1>
        <p className="text-slate-500 mb-10">Kumpulan project yang pernah saya kerjakan.</p>

        <FilterBar categories={categories} placeholder="Cari project..." />

        {projectsRes.data && projectsRes.data.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 anime-stagger">
            {projectsRes.data.map((project) => (
              <ProjectCard key={project.id} project={project} translations={translations} />
            ))}
          </div>
        ) : (
          <p className="col-span-full text-center text-slate-500 py-20">
            {q || category ? 'Tidak ada project yang cocok dengan pencarian.' : 'Belum ada project.'}
          </p>
        )}
      </div>
    </div>
  );
}
