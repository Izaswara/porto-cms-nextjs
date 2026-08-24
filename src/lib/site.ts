export const FALLBACK_SITE_NAME = 'Faiz Dev';

/** Base URL situs dari env, tanpa trailing slash */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}
