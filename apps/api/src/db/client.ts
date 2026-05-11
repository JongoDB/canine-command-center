import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

/**
 * Single Postgres connection pool + Drizzle client for the process.
 *
 * The pool is created lazily on first access so importing this module (e.g. in
 * tests, or by `drizzle-kit`) doesn't open sockets. Nothing connects until the
 * first query — a failed connection surfaces as a rejected query, not a crash
 * at import time (see the `/health` route).
 */
let _pool: Pool | undefined;
let _db: NodePgDatabase<typeof schema> | undefined;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: env.DATABASE_URL,
      // Fail fast instead of hanging when Postgres isn't reachable.
      connectionTimeoutMillis: 5_000,
      // Keep the test/dev pool small; tune for prod in Phase 6.
      max: env.NODE_ENV === 'test' ? 2 : 10,
    });
    // Don't let a background client error take down the process.
    _pool.on('error', () => {});
  }
  return _pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

/** Close the pool (registered as a Fastify onClose hook; also used in tests). */
export async function closeDb(): Promise<void> {
  if (_pool) {
    const p = _pool;
    _pool = undefined;
    _db = undefined;
    await p.end();
  }
}

/** Cheap liveness probe — `SELECT 1` with a short timeout. */
export async function pingDb(timeoutMs = 1_000): Promise<boolean> {
  try {
    await Promise.race([
      getPool().query('SELECT 1'),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('db ping timeout')), timeoutMs),
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}
