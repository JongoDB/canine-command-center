/**
 * Apply pending Drizzle migrations, then exit. Idempotent — running it against
 * an already-current database is a no-op. Used by:
 *   - `pnpm db:migrate` (local dev; reads apps/api/.env)
 *   - `pnpm db:check`   (CI; DATABASE_URL points at a throwaway Postgres)
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from './client';

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'drizzle',
);

async function main(): Promise<void> {
  const db = getDb();
  await migrate(db, { migrationsFolder });
  await closeDb();
  console.log('migrations applied — database is up to date');
}

main().catch(async (err: unknown) => {
  console.error('migration failed:', err instanceof Error ? err.message : err);
  await closeDb().catch(() => {});
  process.exitCode = 1;
});
