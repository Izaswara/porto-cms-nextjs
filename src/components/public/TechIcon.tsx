/**
 * TechIcon — logo resmi framework/tools via Simple Icons CDN.
 *
 * Semua logo dirender PUTIH (param /ffffff) agar konsisten dengan tema
 * black & white. Nama teknologi dinormalisasi (huruf kecil, tanpa
 * tanda baca) lalu dipetakan ke slug simple-icons.
 *
 * Jika teknologi tidak dikenal → null (pemanggil bisa fallback ke emoji).
 */

const SLUGS: Record<string, string> = {
  nextjs: 'nextdotjs',
  next: 'nextdotjs',
  react: 'react',
  reactjs: 'react',
  reactnative: 'react',
  typescript: 'typescript',
  ts: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  nodejs: 'nodedotjs',
  node: 'nodedotjs',
  express: 'express',
  tailwindcss: 'tailwindcss',
  tailwind: 'tailwindcss',
  supabase: 'supabase',
  postgresql: 'postgresql',
  postgres: 'postgresql',
  prisma: 'prisma',
  figma: 'figma',
  git: 'git',
  github: 'github',
  vercel: 'vercel',
  redis: 'redis',
  redux: 'redux',
  firebase: 'firebase',
  docker: 'docker',
  graphql: 'graphql',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  mysql: 'mysql',
  laravel: 'laravel',
  php: 'php',
  python: 'python',
  vuejs: 'vuedotjs',
  vue: 'vuedotjs',
  nuxtjs: 'nuxtdotjs',
  nuxt: 'nuxtdotjs',
  sass: 'sass',
  scss: 'sass',
  bootstrap: 'bootstrap',
  framer: 'framer',
  framermotion: 'framer',
  threejs: 'threedotjs',
  three: 'threedotjs',
  astro: 'astro',
  css: 'css3',
  html: 'html5',
  jquery: 'jquery',
  jest: 'jest',
  vitest: 'vitest',
  storybook: 'storybook',
  webpack: 'webpack',
  vite: 'vite',
  npm: 'npm',
  yarn: 'yarn',
  pnpm: 'pnpm',
  cloudflare: 'cloudflare',
  netlify: 'netlify',
  aws: 'amazonwebservices',
  stripe: 'stripe',
};

/** Normalisasi nama → slug simple-icons, atau null bila tidak dikenal */
export function techSlug(name: string): string | null {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return SLUGS[key] ?? null;
}

export default function TechIcon({
  name,
  className = 'w-4 h-4',
}: {
  name: string;
  className?: string;
}) {
  const slug = techSlug(name);
  if (!slug) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${slug}/ffffff`}
      alt={name}
      loading="lazy"
      className={`${className} shrink-0`}
    />
  );
}
