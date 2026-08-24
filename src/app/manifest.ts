import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Faiz Dev — Portfolio',
    short_name: 'Faiz Dev',
    description: 'Portfolio pribadi — projects, blog & gallery.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'id',
    icons: [],
  };
}
