import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, 'm'));
  return m ? m[1].trim() : '';
};

const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');
console.log('URL:', url);

const sb = createClient(url, key, { auth: { persistSession: false } });

async function check(table) {
  const { data, error } = await sb.from(table).select('*', { count: 'exact', head: true });
  if (error) console.log(`  ${table}: ERROR ${error.message}`);
  else console.log(`  ${table}: OK (${data?.length ?? 0} baris / ${error ? '-' : 'no-data'})`);
}

const { data: users, error: uerr } = await sb.from('users').select('id, name, username').limit(3);
if (uerr) console.log('users query ERR:', uerr.message);
else console.log('users sample:', JSON.stringify(users));

for (const t of ['settings', 'projects', 'posts', 'skills', 'hero_sections', 'themes', 'galleries', 'translations']) {
  await check(t);
}

// storage bucket test
const { data: buckets, error: berr } = await sb.storage.listBuckets();
if (berr) console.log('storage ERR:', berr.message);
else console.log('buckets:', buckets.map((b) => b.name).join(', '));
