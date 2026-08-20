/**
 * Porto CMS — Seed via Supabase REST API (tidak butuh DB connection string)
 * Membaca supabase/03-seed.sql dan meng-insert lewat PostgREST dengan service role key.
 * Jalankan: node scripts/seed-rest.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const env = readFileSync(path.join(ROOT, '.env.local'), 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, 'm'));
  return m ? m[1].trim() : '';
};
const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local');
  process.exit(1);
}

// ===== 1. Parse 03-seed.sql =====
const sql = readFileSync(path.join(ROOT, 'supabase', '03-seed.sql'), 'utf8');

// Perbaiki mojibake ganda (emoji & teks Jepang & tanda baca): string yang dibaca
// UTF-8 sebenarnya adalah karakter cp1252 dari byte UTF-8 asli.
const CP1252_TO_BYTE = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};
const fixMojibake = (s) => {
  if (!/[\u0080-\uFFFF]/.test(s)) return s; // pure ASCII -> aman
  try {
    const bytes = [];
    for (const ch of s) {
      const code = ch.codePointAt(0);
      bytes.push(code <= 0x9f || code <= 0xff ? code : (CP1252_TO_BYTE[code] ?? 0x3f));
    }
    return Buffer.from(bytes).toString('utf8');
  } catch {
    return s;
  }
};

// Kolom jsonb per tabel
const JSONB_COLS = {
  hero_sections: ['typing_texts', 'buttons', 'social_media'],
  about_sections: ['statistics', 'skills'],
  projects: ['tech_stack', 'seo', 'tags'],
  experiences: ['achievements'],
  posts: ['tags', 'seo'],
  prompts: ['variables'],
  media: ['metadata'],
  activity_logs: ['properties'],
  galleries: ['images', 'seo'],
  themes: ['custom_css'],
};

function splitTopLevel(s, sep) {
  const out = [];
  let cur = '';
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "'") {
        if (s[i + 1] === "'") { cur += "'"; i++; }
        else inStr = false;
      }
      cur += c;
      continue;
    }
    if (c === "'") { inStr = true; cur += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === sep && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

// Parse setiap statement: insert into public."table" (cols) values (row1),(row2) on conflict do nothing;
function parseInserts(sqlText) {
  const stmts = [];
  const marker = 'insert into public.';
  let idx = 0;
  while (true) {
    const start = sqlText.indexOf(marker, idx);
    if (start === -1) break;
    const afterTable = start + marker.length;
    const tableEnd = sqlText.indexOf('"', afterTable + 1);
    const table = sqlText.slice(afterTable + 1, tableEnd);
    const afterTableName = tableEnd + 1;
    const colsStart = sqlText.indexOf('(', afterTableName);
    const colsEnd = sqlText.indexOf(')', colsStart);
    const cols = splitTopLevel(sqlText.slice(colsStart + 1, colsEnd), ',').map((c) => c.trim().replace(/"/g, ''));

    const valuesStart = sqlText.indexOf('values', colsEnd);
    const conflictEnd = sqlText.toLowerCase().indexOf('on conflict', valuesStart);
    const rowsGroup = sqlText.slice(valuesStart + 'values'.length, conflictEnd);
    const rows = splitTopLevel(rowsGroup, ',').map((r) => r.trim()).filter((r) => r.startsWith('(') && r.endsWith(')') && r.length > 2);

    const jsonbCols = new Set(JSONB_COLS[table] ?? []);
    const parsed = [];
    for (const row of rows) {
      const vals = splitTopLevel(row.slice(1, -1), ',');
      const obj = {};
      cols.forEach((c, i) => {
        obj[c] = parseValue(vals[i] ?? 'NULL', jsonbCols.has(c));
      });
      parsed.push(obj);
    }
    stmts.push({ table, rows: parsed });
    idx = conflictEnd;
  }
  return stmts;
}

function parseValue(raw, isJsonb) {
  const v = raw.trim();
  if (v === 'NULL' || v === '') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^[0-9]+$/.test(v)) return Number(v);
  if (v.startsWith("'") && v.endsWith("'")) {
    let s = v.slice(1, -1).replace(/''/g, "'");
    s = fixMojibake(s);
    if (isJsonb && s) {
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    }
    return s;
  }
  return v;
}

const statements = parseInserts(sql);

// ===== 2. Insert via PostgREST =====
async function insert(table, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${table}: HTTP ${res.status} ${txt.slice(0, 300)}`);
  }
  return res.status;
}

let ok = 0;
const failed = [];

const RESET_TABLES = [
  'about_sections', 'activity_logs', 'certificates', 'education', 'experiences',
  'hero_sections', 'media', 'menus', 'posts', 'projects', 'prompts', 'settings',
  'skills', 'social_media', 'themes', 'translations',
];

async function del(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=gt.0`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
}

if (process.argv.includes('--reset')) {
  console.log('Reset: menghapus data seed lama...');
  for (const t of RESET_TABLES) {
    try {
      await del(t);
      console.log(`  clear ${t}`);
    } catch (e) {
      console.log(`  clear FAIL ${t}: ${e.message}`);
    }
  }
}

for (const st of statements) {
  try {
    const status = await insert(st.table, st.rows);
    console.log(`OK   ${st.table.padEnd(16)} ${st.rows.length} baris (HTTP ${status})`);
    ok += st.rows.length;
  } catch (e) {
    console.log(`FAIL ${st.table.padEnd(16)} ${e.message}`);
    failed.push(st.table);
  }
}

console.log(`\nSelesai: ${ok} baris di-insert. Gagal: ${failed.length ? failed.join(', ') : '-'}`);

if (failed.length) {
  writeFileSync(
    path.join(ROOT, 'scripts', 'seed-failed.json'),
    JSON.stringify(statements.filter((s) => failed.includes(s.table)), null, 2)
  );
  console.log('Detail payload gagal disimpan ke scripts/seed-failed.json');
}
