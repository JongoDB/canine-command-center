import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './server';

// Runs with whatever DATABASE_URL is set — an unreachable address by default
// (then db: "down"), or a real Postgres in CI / when run with one (then "ok").
// The assertions hold either way.
describe('API server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200, status ok, reports a db sub-status', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; db: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toContain('API');
    expect(['ok', 'down']).toContain(body.db);
  });

  it('GET /health/ready → 200/ok when the DB is reachable, else 503/down (consistently)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    const body = res.json() as { status: string; db: string };
    if (res.statusCode === 200) {
      expect(body).toEqual({ status: 'ready', db: 'ok' });
    } else {
      expect(res.statusCode).toBe(503);
      expect(body).toEqual({ status: 'not-ready', db: 'down' });
    }
  });

  it('unknown route → 404 with the error envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/no-such-route' });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('protected route without a session → 401 with the error envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHENTICATED');
  });
});
