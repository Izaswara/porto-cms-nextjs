import pg from 'pg';
import bcrypt from 'bcryptjs';

const conn = process.env.DB_CONNECTION_STRING;
const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await c.connect();
const hash = bcrypt.hashSync('faizindriaswara210305', 12);
await c.query("update public.users set password = $1 where username = 'faizindriaswara'", [hash]);
const { rows } = await c.query('select id, username, name from public.users');
console.log('users:', JSON.stringify(rows));
await c.end();
