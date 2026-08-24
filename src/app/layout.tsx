import type { Metadata } from 'next';
import './globals.css';
import { Playfair_Display, Cinzel, Shippori_Mincho } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});
const mincho = Shippori_Mincho({
  weight: ['400', '500', '600', '700'],
  variable: '--font-mincho',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: 'Porto CMS',
    template: '%s — Porto CMS',
  },
  description: 'Portfolio CMS powered by Next.js & Supabase.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${playfair.variable} ${cinzel.variable} ${mincho.variable}`} suppressHydrationWarning>
      <head />
      <body className="min-h-screen font-sans antialiased text-slate-300">{children}</body>
    </html>
  );
}
