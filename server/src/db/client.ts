import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
}

// The `postgres` driver reads `sslmode` off the connection string itself,
// defaulting to no SSL if absent. Some managed providers' copy-pasted
// connection strings include `?sslmode=require`; Supabase's (both direct
// and pooled) does not, despite requiring SSL for external connections.
// Rather than guess from the URL, default explicitly by environment: an
// explicit `sslmode` in the URL always wins; otherwise require SSL in
// production (where "the DB is some external managed service" is a safe
// assumption) and leave it off for local/docker-compose dev.
const hasExplicitSslMode = /[?&]sslmode=/.test(DATABASE_URL);
const sslOption = hasExplicitSslMode ? undefined : process.env.NODE_ENV === 'production' ? 'require' : false;

export const client = postgres(DATABASE_URL, { max: 10, ...(sslOption !== undefined ? { ssl: sslOption } : {}) });
export const db = drizzle(client, { schema });

export async function isDbReachable(): Promise<boolean> {
  try {
    await client`select 1`;
    return true;
  } catch {
    return false;
  }
}
