import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { auth } from './auth';

/**
 * Mounts Better Auth's handler under `/api/auth/*`.
 *
 * Better Auth's handler is a Web-standard `(Request) => Promise<Response>`, so
 * we bridge Fastify's req/reply to/from Fetch primitives. Bodies are JSON
 * (Fastify has already parsed them), so we re-serialise on the way in.
 * `Set-Cookie` is special-cased because the Fetch `Headers` API joins repeated
 * headers with commas — which breaks cookies — so we pull them out via
 * `getSetCookie()`.
 */
function toFetchRequest(request: FastifyRequest): Request {
  const url = new URL(request.url, `${request.protocol}://${request.hostname}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const v of value) headers.append(key, v);
    else headers.append(key, value);
  }
  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  return new Request(url, {
    method,
    headers,
    body:
      hasBody && request.body !== undefined && request.body !== null
        ? JSON.stringify(request.body)
        : undefined,
  });
}

async function sendFetchResponse(res: Response, reply: FastifyReply): Promise<void> {
  reply.status(res.status);
  const setCookies =
    typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return;
    reply.header(key, value);
  });
  if (setCookies.length > 0) reply.header('set-cookie', setCookies);
  const body = res.body ? await res.text() : null;
  await reply.send(body);
}

export async function authPlugin(app: FastifyInstance): Promise<void> {
  app.all('/api/auth/*', async (request, reply) => {
    const res = await auth.handler(toFetchRequest(request));
    await sendFetchResponse(res, reply);
  });
}
