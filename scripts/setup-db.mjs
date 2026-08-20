/**
 * Porto CMS — Database Setup Script
 * Jalankan: node scripts/setup-db.mjs
 * Membutuhkan env: DB_CONNECTION_STRING (connection string Postgres Supabase)
 *
 * Otomatis menjalankan: 01-tables.sql -> 02-indexes-storage.sql -> 03-seed.sql
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_DIR = path.join(__dirname, '..', 'supabase');

const conn = process.env.DB_CONNECTION_STRING;
if (!conn) {
  console.error('ERROR: env DB_CONNECTION_STRING belum diisi.');
  console.error('Contoh: postgresql://postgres.yourref:YOURPASSWORD@aws-0-region.pooler.supabase.com:6543/postgres');
  process.exit(1);
}

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });

async function runFile(filename) {
  const sql = await readFile(path.join(SUPABASE_DIR, filename), 'utf8');
  process.stdout.write(`  -> ${filename} ... `);
  await client.query(sql);
  console.log('OK');
}

try {
  await client.connect();
  console.log('Terhubung ke database.\nMenjalankan setup...');
  await runFile('01-tables.sql');
  await runFile('02-indexes-storage.sql');
  await runFile('03-seed.sql');

  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name"
  );
  console.log(`\nSelesai! ${rows.length} tabel dibuat:`);
  console.log(rows.map((r) => r.table_name).join(', '));

  const count = await client.query("select count(*) as c from public.users");
  console.log(`\nData user seed: ${count.rows[0].c}`);
} catch (e) {
  console.error('\nGAGAL:', e.message);
  process.exit(1);
} finally {
  await client.end();
}
