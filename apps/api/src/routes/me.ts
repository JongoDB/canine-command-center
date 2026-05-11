import type { FastifyInstance } from 'fastify';
import { requireSession } from '../auth/requireSession';

/** Current-user routes. Grows (settings, notification prefs, …) in later milestones. */
export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get('/me', { preHandler: requireSession }, async (request) => {
    // requireSession guarantees this is set.
    const u = request.auth!.user;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: u.emailVerified,
      image: u.image ?? null,
      createdAt: u.createdAt,
    };
  });
}
