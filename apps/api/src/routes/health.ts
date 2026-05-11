import type { FastifyInstance } from 'fastify';
import { BRANDING } from '@ccc/shared';
import { pingDb } from '../db/client';

const startedAt = Date.now();

/**
 * Health/status endpoints.
 *   GET /health        — liveness: always 200; reports DB sub-status.
 *   GET /health/ready  — readiness: 200 only when the DB is reachable, else 503.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => {
    const db = (await pingDb()) ? 'ok' : 'down';
    return {
      status: 'ok' as const,
      service: `${BRANDING.appName} API`,
      db,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      time: new Date().toISOString(),
    };
  });

  app.get('/health/ready', async (_req, reply) => {
    const ok = await pingDb();
    return reply.status(ok ? 200 : 503).send({
      status: ok ? ('ready' as const) : ('not-ready' as const),
      db: ok ? ('ok' as const) : ('down' as const),
    });
  });
}
