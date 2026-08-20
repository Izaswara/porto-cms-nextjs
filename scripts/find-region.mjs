import pg from 'pg';

const pass = process.argv[2];
const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'sa-east-1', 'ca-central-1',
];

async function tryRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new pg.Client({
    host,
    port: 6543,
    user: 'postgres.usigyfsnlzpdnkrzunsv',
    password: pass,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  return new Promise((resolve) => {
    client.connect((err) => {
      if (err) return resolve({ region, ok: false });
      client.end();
      resolve({ region, ok: true });
    });
  });
}

console.log('Mencari region pooler...');
const results = await Promise.all(regions.map(tryRegion));
const found = results.find((r) => r.ok);
if (found) console.log(`FOUND: ${found.region}`);
else console.log('TIDAK DITEMUKAN di region umum. Cek di dashboard: Settings -> Database -> Connection string.');
