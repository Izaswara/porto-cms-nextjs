import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, 'm'));
  return m ? m[1].trim() : '';
};

// Tes cookie session via fetch API seperti browser
const url = get('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3001';
const base = url.replace(/\/$/, '');

const login = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'faizindriaswara', password: 'faizindriaswara210305' }),
});
const setCookie = login.headers.get('set-cookie');
console.log('login status:', login.status);
console.log('set-cookie:', setCookie ? setCookie.slice(0, 100) : '(none)');
const cookie = setCookie ? setCookie.split(';')[0] : '';

const dash = await fetch(`${base}/api/admin/dashboard`, { headers: { cookie } });
console.log('dashboard status:', dash.status);
const txt = await dash.text();
console.log('dashboard body:', txt.slice(0, 200));
