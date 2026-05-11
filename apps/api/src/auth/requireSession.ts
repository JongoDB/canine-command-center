import type { FastifyReply, FastifyRequest } from 'fastify';
import { auth, type AuthSession, type SessionUser } from './auth';

declare module 'fastify' {
  interface FastifyRequest {
    /** Populated by the `requireSession` preHandler on authenticated routes. */
    auth?: { user: SessionUser; session: AuthSession };
  }
}

/** Build a Fetch `Headers` object from a Fastify request's headers. */
function headersFrom(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    headers.append(key, Array.isArray(value) ? value.join(', ') : value);
  }
  return headers;
}

/**
 * Fastify preHandler that requires a valid session. On success it attaches
 * `request.auth = { user, session }`; otherwise it replies `401` with the
 * standard error envelope and the route body never runs.
 *
 * Reads the session from the cookie (web) or the `Authorization: Bearer` header
 * (mobile, once the bearer plugin lands in M0.6) — Better Auth handles both.
 */
export async function requireSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const result = await auth.api.getSession({ headers: headersFrom(request) });
  if (!result) {
    await reply
      .status(401)
      .send({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } });
    return;
  }
  request.auth = { user: result.user, session: result.session };
}

/** Like `requireSession`, but doesn't 401 — just attaches `request.auth` if present. */
export async function attachSession(request: FastifyRequest): Promise<void> {
  const result = await auth.api.getSession({ headers: headersFrom(request) });
  if (result) request.auth = { user: result.user, session: result.session };
}
