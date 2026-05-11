/**
 * Drizzle migration runner.
 *
 * As a module: `applyMigrations()` applies any pending migrations (idempotent;
 * used by tests to ensure the schema exists).
 *
 * As a script (`tsx src/db/migrate.ts`): applies migrations, closes the pool,
 * and exits — that's `pnpm db:migrate` (local; reads apps/api/.env) and
 * `pnpm db:check` (CI; DATABASE_URL → throwaway Postgres).
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from './client';
import { applySeeds } from './seed';

export const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'drizzle',
);

/** Apply pending migrations, then upsert reference seeds. Idempotent. */
export async function applyMigrations(): Promise<void> {
  await migrate(getDb(), { migrationsFolder });
  await applySeeds();
}

async function runAsScript(): Promise<void> {
  await applyMigrations();
  await closeDb();
  console.log('migrations applied + seeds upserted — database is up to date');
}

// Only run when invoked directly (`tsx src/db/migrate.ts`), not when imported.
const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (entrypoint === import.meta.url) {
  runAsScript().catch(async (err: unknown) => {
    console.error('migration failed:', err instanceof Error ? err.message : err);
    await closeDb().catch(() => {});
    process.exitCode = 1;
  });
}
