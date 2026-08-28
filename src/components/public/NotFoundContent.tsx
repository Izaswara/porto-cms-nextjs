const TAPE = [
  '404 Not Found',
  'このページは存在しません',
  'Halaman Tidak Ditemukan',
  '迷 — Mayoi',
  'Route Not Found',
  'Lost in the Void',
];

const LINKS = [
  { href: '/', meta: 'Home', label: 'Beranda' },
  { href: '/projects', meta: 'Work', label: 'Proyek' },
  { href: '/blog', meta: 'Writing', label: 'Blog' },
  { href: '/gallery', meta: 'Photo', label: 'Galeri' },
];

export default function NotFoundContent() {
  return (
    <section
      id="not-found"
      data-book
      data-kanji="迷"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden py-32"
    >
      <span className="page-veil" aria-hidden="true" />
      <div className="orb -left-24 top-24 w-[420px] h-[420px]" style={{ background: 'rgb(var(--tint-copper))', opacity: 0.08 }} aria-hidden="true" />
      <div className="orb -right-28 bottom-16 w-[460px] h-[460px]" style={{ background: 'rgb(var(--tint-indigo))', opacity: 0.07 }} aria-hidden="true" />

      {/* Corner metadata ala studio */}
      <p className="hero-corner top-24 left-5 sm:left-8 hidden lg:block">HTTP — 404 · Route Not Found</p>
      <p className="hero-corner top-24 right-5 sm:right-8 text-right hidden sm:block">ページが存在しません</p>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <p className="aw-eyebrow mb-7 justify-center fade-up" style={{ animationDelay: '.18s' }}>
          <span className="aw-num">404</span>
          <span className="aw-kanji">迷</span>
          Error · Page Not Found
        </p>

        <div className="nf-digits fade-up" style={{ animationDelay: '.28s' }} role="img" aria-label="404">
          <span className="nf-num" aria-hidden="true">4</span>
          <span className="nf-num nf-num--zero" aria-hidden="true">0</span>
          <span className="nf-num" aria-hidden="true">4</span>
        </div>

        <h1 className="section-heading text-white mt-7 fade-up" style={{ animationDelay: '.42s' }}>
          Halaman ini <span className="text-gradient">tersesat</span>
        </h1>
        <p className="font-body-serif text-xl text-slate-300 mt-4 fade-up" style={{ animationDelay: '.5s' }}>
          お探しのページはここにはありません。
        </p>
        <p className="text-slate-400 max-w-md mx-auto mt-2 fade-up" style={{ animationDelay: '.56s', lineHeight: 2 }}>
          Halaman yang Anda cari tidak ada — atau sudah berpindah tanpa jejak. Mari kembali ke jalur yang benar.
        </p>

        <div className="nf-term fade-up mt-9" style={{ animationDelay: '.62s' }}>
          <span>
            <span className="nf-term-arrow">➜</span> ~/porto <span style={{ color: 'rgba(148,163,184,.55)' }}>git:(main)</span>
          </span>
          <span>
            <span className="nf-term-arrow">➜</span> curl -s -o /dev/null -w {'%{http_code}'} $PWD
          </span>
          <span>
            <span className="nf-term-out">404</span> <span className="nf-term-cursor">▊</span>
          </span>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 fade-up" style={{ animationDelay: '.7s' }}>
          <a href="/" className="magnetic btn-solid shine inline-flex px-9 py-4 text-sm font-semibold transition-all hover:opacity-85">
            ← Kembali ke Beranda
          </a>
          <a href="/projects" className="btn-line">
            <span>Lihat Proyek</span>
          </a>
        </div>

        <nav className="mt-14 inline-flex flex-col sm:flex-row sm:divide-x divide-white/10 fade-up" aria-label="Quick links" style={{ animationDelay: '.78s' }}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="group px-6 py-3 text-center">
              <span className="block font-mono-accent text-[10px] uppercase tracking-[0.3em] text-slate-500 group-hover:text-white transition-colors">
                {l.meta}
              </span>
              <span className="block font-display text-lg sm:text-xl text-white mt-1 link-line">{l.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Marquee bawah — selaras strip skill di beranda */}
      <div className="mt-16 marquee-wrap py-5 border-t border-white/10 bg-white/[.02] relative z-10" aria-hidden="true">
        <div className="marquee">
          {[...TAPE, ...TAPE].map((item, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="block w-1.5 h-1.5 rotate-45 bg-white/50" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}