import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { isValidLocale, getTranslations } from '@/lib/i18n';
import { BlogCard } from '@/components/public/Cards';
import FilterBar from '@/components/public/FilterBar';

export const metadata: Metadata = { title: 'Blog' };

const PER_PAGE = 9;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const category = (sp.category ?? '').trim();
  const store = await cookies();
  const locale = isValidLocale(store.get('locale')?.value);

  let countQuery = db().from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published');
  if (q) countQuery = countQuery.ilike('title', `%${q}%`);
  if (category) countQuery = countQuery.eq('category', category);
  const { count: total } = await countQuery;

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PER_PAGE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), totalPages);
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let listQuery = db().from('posts').select('*').eq('status', 'published');
  if (q) listQuery = listQuery.ilike('title', `%${q}%`);
  if (category) listQuery = listQuery.eq('category', category);

  const [translations, postsRes, catRes] = await Promise.all([
    getTranslations(locale),
    listQuery.order('created_at', { ascending: false }).range(from, to),
    db().from('posts').select('category').eq('status', 'published').not('category', 'is', null),
  ]);

  const posts = postsRes.data ?? [];
  const categories = [...new Set((catRes.data ?? []).map((r) => String(r.category)).filter(Boolean))];
  const currentPage = page;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('page', String(p));
    return `/blog?${params.toString()}`;
  }

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="font-[Space_Grotesk] text-4xl font-bold text-white mb-2">
          Latest <span className="text-gradient">Posts</span>
        </h1>
        <p className="text-slate-500 mb-10">Artikel dan tulisan terbaru.</p>

        <FilterBar categories={categories} placeholder="Cari artikel..." />

        {posts.length > 0 ? (
          <>
            <div className="grid md:grid-cols-3 gap-6 anime-stagger">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} translations={translations} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                {currentPage > 1 && (
                  <a
                    href={pageHref(currentPage - 1)}
                    className="inline-flex items-center min-h-10 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all glass-card"
                  >
                    ← Prev
                  </a>
                )}
                {pages.map((p) => (
                  <a
                    key={p}
                    href={pageHref(p)}
                    className={`inline-flex items-center justify-center min-w-10 min-h-10 px-4 py-2 rounded-lg text-sm transition-all ${
                      p === currentPage
                        ? 'text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 glass-card'
                    }`}
                    style={p === currentPage ? { background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))' } : undefined}
                  >
                    {p}
                  </a>
                ))}
                {currentPage < totalPages && (
                  <a
                    href={pageHref(currentPage + 1)}
                    className="inline-flex items-center min-h-10 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all glass-card"
                  >
                    Next →
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="col-span-full text-center text-slate-500 py-20">
            {q || category ? 'Tidak ada artikel yang cocok dengan pencarian.' : 'Belum ada artikel.'}
          </div>
        )}
      </div>
    </div>
  );
}