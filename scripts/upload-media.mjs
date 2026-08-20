import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, 'm'));
  return m ? m[1].trim() : '';
};

const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const LARAVEL_STORAGE = 'C:/Users/FAIZ/OneDrive/Documents/ProjectPribadi/Porto/porto-cms/storage/app/public';

const files = [
  'media/general/DHvTuSqFBt8PRf6m1hQXWwhnvM7Iojc6tGjK393X.jpg',
  'media/hero/syORpWkO0uehqdy3pYFjDK7sn3kSwNWzVYzFlk8V.jpg',
  'media/projects/Ud9H0TyuVJVfV2DfvPHfVHlg4za8Ld5ZFIiMSGk3.png',
];

for (const rel of files) {
  const src = path.join(LARAVEL_STORAGE, rel);
  if (!existsSync(src)) {
    console.log(`SKIP (tidak ada): ${rel}`);
    continue;
  }
  const buf = readFileSync(src);
  const { error } = await sb.storage.from('media').upload(rel, buf, { contentType: 'application/octet-stream', upsert: true });
  console.log(error ? `FAIL ${rel}: ${error.message}` : `OK ${rel} (${buf.length} bytes)`);
}
