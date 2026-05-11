import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './server';

// These run without a real Postgres (DATABASE_URL in vitest.config.ts points at
// an unreachable address), so the DB sub-status is "down" — which is correct
// behaviour for a liveness probe. A DB-up integration test runs in CI against a
// Postgres service container (see .github/workflows/ci.yml, M0.3+).
describe('API server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200, status ok, db sub-status reported', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; db: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toContain('API');
    expect(['ok', 'down']).toContain(body.db);
  });

  it('GET /health/ready → 503 when the DB is unreachable', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { db: string }).db).toBe('down');
  });

  it('unknown route → 404 with the error envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
