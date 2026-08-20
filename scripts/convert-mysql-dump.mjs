import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const inputPath = resolve(root, '..', 'porto_cms_dump.sql');
const outputPath = resolve(root, 'supabase', '03-seed.sql');

const skipTables = new Set([
  'migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches',
  'failed_jobs', 'password_reset_tokens',
]);

const boolCols = new Set([
  'is_active', 'featured', 'is_current', 'is_synced', 'is_hidden',
  'glass_effect', 'dark_mode',
]);

function splitColumns(header) {
  return header.split(',').map((s) => s.trim().replace(/^`|`$/g, ''));
}

function parseTuple(str) {
  str = str.trim();
  if (!str.startsWith('(')) throw new Error('tuple tidak dimulai dengan (: ' + str.slice(0, 40));
  const vals = [];
  let i = 1;
  let cur = '';
  let inString = false;
  while (i < str.length) {
    const ch = str[i];
    if (inString) {
      if (ch === '\\') {
        const next = str[i + 1];
        cur += next === undefined ? '' : next;
        i += 2;
        continue;
      }
      if (ch === "'") {
        inString = false;
        cur += "'";
        i += 1;
        continue;
      }
      cur += ch;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inString = true;
      cur += "'";
      i += 1;
      continue;
    }
    if (ch === ',') {
      vals.push(cur.trim());
      cur = '';
      i += 1;
      continue;
    }
    if (ch === ')') {
      vals.push(cur.trim());
      return { values: vals, rest: str.slice(i + 1) };
    }
    cur += ch;
    i += 1;
  }
  throw new Error('tuple tidak ditutup dengan )');
}

function convertValue(raw, colName) {
  const v = raw.trim();
  if (v === 'NULL') return 'NULL';
  if (v.startsWith("'") && v.endsWith("'")) {
    let inner = v.slice(1, -1);
    inner = inner.replace(/\\'/g, "''").replace(/\\"/g, '"');
    return "'" + inner + "'";
  }
  if (boolCols.has(colName)) {
    if (v === '1') return 'true';
    if (v === '0') return 'false';
  }
  if (/^[\d.eE+-]+$/.test(v)) return v;
  return v;
}

const sql = readFileSync(inputPath, 'utf8');
const lines = sql.split(/\r?\n/);
const tables = new Map(); // name -> { cols: string[], rows: string[][] }

for (const line of lines) {
  const m = line.match(/^INSERT INTO `(\w+)` \((.+)\) VALUES (.+);\s*$/);
  if (!m) continue;
  const table = m[1];
  if (skipTables.has(table)) continue;
  const cols = splitColumns(m[2]);
  const rest = m[3];
  let leftover = rest;
  const tuples = [];
  do {
    const { values, rest: r } = parseTuple(leftover);
    tuples.push(values);
    leftover = r.trim();
    if (leftover.startsWith(',')) leftover = leftover.slice(1).trim();
  } while (leftover.startsWith('('));
  if (!tables.has(table)) tables.set(table, { cols, rows: [] });
  const entry = tables.get(table);
  for (const t of tuples) entry.rows.push(t);
}

if (tables.size === 0) {
  console.error('Tidak ada data INSERT ditemukan di dump.');
  process.exit(1);
}

// Users pertama (FK activity_logs -> users)
const order = ['users', ...[...tables.keys()].filter((t) => t !== 'users')];

let out = '-- Porto CMS Seed — dihasilkan dari porto_cms_dump.sql\n';
out += '-- Jalankan setelah 01-tables.sql dan 02-indexes-storage.sql\n\n';

for (const table of order) {
  const { cols, rows } = tables.get(table);
  const colList = cols.map((c) => '"' + c + '"').join(', ');
  const all = [];
  for (const row of rows) {
    const converted = row.map((raw, idx) => convertValue(raw, cols[idx]));
    all.push('(' + converted.join(', ') + ')');
  }
  out += `insert into public."${table}" (${colList}) values\n`;
  out += all.join(',\n');
  out += '\non conflict do nothing;\n\n';
}

writeFileSync(outputPath, out, 'utf8');
console.log(
  `OK: ${tables.size} tabel, ${[...tables.values()].reduce((a, t) => a + t.rows.length, 0)} baris -> ${outputPath}`
);