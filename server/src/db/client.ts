import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
}

// The `postgres` driver reads `sslmode` off the connection string itself
// (defaulting to no SSL if absent) — managed providers like Neon/Supabase
// give you a connection string with `?sslmode=require` already in it, and
// local/docker Postgres URLs typically have none. No need to guess here.
export const client = postgres(DATABASE_URL, { max: 10 });
export const db = drizzle(client, { schema });

export async function isDbReachable(): Promise<boolean> {
  try {
    await client`select 1`;
    return true;
  } catch {
    return false;
  }
}
