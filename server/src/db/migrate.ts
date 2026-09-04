import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { client, db } from './client';

async function main() {
  await migrate(db, { migrationsFolder: path.join(__dirname, '..', '..', 'drizzle') });
  // eslint-disable-next-line no-console
  console.log('Migrations applied');
  await client.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', err);
  process.exit(1);
});
