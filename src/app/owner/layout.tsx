'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ClickFx from '@/components/public/ClickFx';
import './owner.css';

const NAV = [
  { href: '/owner/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/owner/ai', label: 'AI Assistant', icon: '🤖' },
  { href: '/owner/sections/hero', label: 'Hero', icon: '🦸' },
  { href: '/owner/sections/about', label: 'About', icon: '👤' },
  { href: '/owner/resources/projects', label: 'Projects', icon: '💼' },
  { href: '/owner/resources/blogs', label: 'Blog', icon: '📝' },
  { href: '/owner/resources/skills', label: 'Skills', icon: '⚡' },
  { href: '/owner/resources/experience', label: 'Experience', icon: '🧑‍💻' },
  { href: '/owner/resources/education', label: 'Education', icon: '🎓' },
  { href: '/owner/resources/certificates', label: 'Certificates', icon: '🏅' },
  { href: '/owner/resources/galleries', label: 'Galleries', icon: '🖼️' },
  { href: '/owner/resources/social', label: 'Social Media', icon: '🔗' },
  { href: '/owner/resources/contacts', label: 'Pesan Masuk', icon: '✉️' },
  { href: '/owner/resources/menu', label: 'Menu', icon: '🧭' },
  { href: '/owner/resources/prompts', label: 'AI Prompts', icon: '✨' },
  { href: '/owner/resources/themes', label: 'Themes', icon: '🎨' },
  { href: '/owner/resources/translations', label: 'Translations', icon: '🌐' },
  { href: '/owner/settings', label: 'Settings', icon: '⚙️' },
  { href: '/owner/media', label: 'Media', icon: '🗂️' },
  { href: '/owner/backup', label: 'Backup', icon: '💾' },
  { href: '/owner/activity', label: 'Activity Log', icon: '📜' },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) router.push('/owner/login');
      } catch {
        router.push('/owner/login');
      }
    };
    check();
  }, [pathname, router]);

  if (pathname === '/owner/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 font-[Inter]">
      <ClickFx />
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-slate-900/80 border-r border-white/10 overflow-y-auto transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="font-[Space_Grotesk] font-bold text-white">Porto CMS</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white cursor-pointer">×</button>
        </div>
        <nav className="p-2 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/owner/dashboard' && pathname.startsWith(item.href));
            const href = item.href.startsWith('/owner/resources/') ? `${item.href}?page=1` : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={async () => {
              await fetch('/api/auth/login', { method: 'DELETE' });
              router.push('/owner/login');
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            ⎋ Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:pl-60 min-w-0">
        <header className="sticky top-0 z-30 h-14 px-4 bg-slate-950/80 backdrop-blur border-b border-white/10 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="lg:hidden text-slate-300 cursor-pointer text-lg">☰</button>
          <span className="text-sm text-slate-500 hidden sm:block">Owner Dashboard</span>
          <div className="ml-auto flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-slate-400 hover:text-cyan-300 transition-colors">Lihat situs ↗</a>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}