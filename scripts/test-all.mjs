import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const m = env.match(/NEXT_PUBLIC_SITE_URL=(.+)$/m);
const base = (m ? m[1].trim() : 'http://localhost:3001').replace(/\/$/, '');
console.log('base:', base);

const login = await fetch(base + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'faizindriaswara', password: 'faizindriaswara210305' }),
});
const cookie = login.headers.get('set-cookie').split(';')[0];

for (const p of ['/owner/dashboard', '/owner/resources/projects?page=1', '/owner/settings', '/api/admin/projects?per_page=5', '/owner/media', '/owner/backup']) {
  try {
    const r = await fetch(base + p, { headers: { cookie } });
    const t = await r.text();
    console.log(p, '=>', r.status, t.length + 'b');
  } catch (e) {
    console.log(p, '=> FAIL', e.message);
  }
}

// publik
for (const p of ['/projects', '/blog', '/gallery']) {
  const r = await fetch(base + p);
  const t = await r.text();
  const hasErr = t.includes('Application error') || t.includes('Internal Server Error');
  console.log('PUB', p, '=>', r.status, t.length + 'b', hasErr ? '*** ERROR PAGE ***' : '');
}
