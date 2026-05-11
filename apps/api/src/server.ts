import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { BRANDING } from '@ccc/shared';
import { authPlugin } from './auth/plugin';
import type { LlmStreamFn } from './ai/llm';
import { corsOrigins, env, isDev, isTest } from './config/env';
import { closeDb } from './db/client';
import { breedRoutes } from './routes/breeds';
import { chatRoutes } from './routes/chat';
import { dogRoutes } from './routes/dogs';
import { healthRoutes } from './routes/health';
import { meRoutes } from './routes/me';

export interface BuildServerOpts {
  /** Optional LLM stream override — tests inject a fake; production uses the real Anthropic client. */
  llm?: LlmStreamFn;
}

/**
 * Build a fully-wired Fastify instance (without listening). Used by `index.ts`
 * to start the server and by tests via `app.inject(...)`.
 */
export async function buildServer(opts: BuildServerOpts = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isTest
      ? false
      : {
          level: env.LOG_LEVEL,
          ...(isDev
            ? {
                transport: {
                  target: 'pino-pretty',
                  options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
                },
              }
            : {}),
        },
    trustProxy: true,
    bodyLimit: 1_048_576, // 1 MiB; raised per-route for uploads later
  });

  await app.register(helmet, {
    // The API serves JSON, not HTML; CSP/COEP just get in the way for now.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await app.register(cors, {
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true, // the web client sends the Better Auth session cookie (M0.4)
  });

  await app.register(sensible);

  // Consistent error envelope: { error: { code, message, details? } }.
  app.setErrorHandler((err: FastifyError, req, reply) => {
    const status =
      typeof err.statusCode === 'number' && err.statusCode >= 400 ? err.statusCode : 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    return reply.status(status).send({
      error: {
        code: err.code ?? (status >= 500 ? 'INTERNAL' : 'BAD_REQUEST'),
        message: status >= 500 ? 'Internal server error' : err.message,
        ...(err.validation ? { details: err.validation } : {}),
      },
    });
  });

  app.setNotFoundHandler((req, reply) => {
    return reply.status(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` },
    });
  });

  // Auth — mounts Better Auth at /api/auth/* (sign-up/in/out, verify, reset, …).
  await app.register(authPlugin);

  // Routes. Domain routes (breeds, program, health, chat, …) register here as
  // they land in later milestones.
  await app.register(healthRoutes);
  await app.register(meRoutes);
  await app.register(dogRoutes);
  await app.register(breedRoutes);
  await app.register(chatRoutes(opts.llm ? { llm: opts.llm } : {}));

  // Close the shared DB pool when the server shuts down. Skipped in tests
  // because suites build/close many app instances against one shared pool — the
  // test files' afterAll closes it once at the end.
  if (!isTest) {
    app.addHook('onClose', async () => {
      await closeDb();
    });
  }

  app.log.info(`${BRANDING.appName} API ready`);
  return app;
}
