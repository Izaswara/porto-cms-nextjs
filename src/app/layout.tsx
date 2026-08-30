import type { Metadata } from 'next';
import './globals.css';
import { Playfair_Display, Cinzel, Shippori_Mincho } from 'next/font/google';
import AdaptiveProvider from '@/components/AdaptiveProvider';

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
      <AdaptiveProvider />
      <body className="min-h-screen font-sans antialiased text-slate-300">
        {/*
          Boot detection — inline & sinkron, berjalan SEBELUM React hydrate,
          agar atribut data-performance/reduced-motion/touch sudah benar saat
          komponen client membaca-nya (menghindari race di first paint).
          Runtime kecil & aman; AdaptiveProvider meneruskan pemantauan network.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;function r(){var m=window.matchMedia;var red=m&&m('(prefers-reduced-motion: reduce)').matches;var c=(navigator.connection||{});var sd=c.saveData===true;var et=c.effectiveType||'';var mem=(navigator.deviceMemory==null?null:navigator.deviceMemory);var cor=(typeof navigator.hardwareConcurrency==='number'?navigator.hardwareConcurrency:null);var coarse=m&&m('(any-pointer: coarse)').matches&&!m('(pointer: fine)').matches;var dpr=window.devicePixelRatio||1;var p='medium';if(red||sd||et==='slow-2g'||et==='2g'){p='low';}else if((mem!==null&&mem<=4)||(cor!==null&&cor<=4)||et==='3g'||(coarse&&dpr<=1)){if((mem!==null&&mem<=2)||(cor!==null&&cor<=2)||et==='3g'){p='low';}}else if((mem===null||mem>=8)&&(cor===null||cor>=8)&&dpr>=1.5){p='high';}d.setAttribute('data-performance',p);d.setAttribute('data-reduced-motion',red?'1':'0');d.setAttribute('data-touch',coarse?'1':'0');d.setAttribute('data-save-data',sd?'1':'0');d.setAttribute('data-network',et||'unknown');}r();}catch(e){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
