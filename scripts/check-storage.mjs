import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, 'm'));
  return m ? m[1].trim() : '';
};

const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');
const sb = createClient(url, key, { auth: { persistSession: false } });

// Storage bucket check (pakai service role -> bypass RLS)
const { data: buckets, error } = await sb.storage.listBuckets();
console.log('buckets:', error ? `ERR ${error.message}` : buckets.map((b) => `${b.name}(public=${b.public})`).join(', '));
