import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError } from './api-client';

function fakeFetch(handler: (url: string, init: RequestInit) => Response): typeof fetch {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init ?? {})),
  ) as unknown as typeof fetch;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('ApiClient', () => {
  it('GET parses JSON and prefixes the base URL', async () => {
    const fetchImpl = fakeFetch((url) => {
      expect(url).toBe('http://api.test/health');
      return json({ status: 'ok', service: 'X API', db: 'ok', uptimeSeconds: 1, time: 't' });
    });
    const client = new ApiClient({ baseUrl: 'http://api.test', fetch: fetchImpl });
    await expect(client.health()).resolves.toMatchObject({ status: 'ok', db: 'ok' });
  });

  it('non-2xx throws ApiError carrying the envelope code/status', async () => {
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetch: fakeFetch(() =>
        json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in required.' } }, 401),
      ),
    });
    await expect(client.me()).rejects.toBeInstanceOf(ApiError);
    await client.me().catch((e: unknown) => {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.status).toBe(401);
      expect(err.code).toBe('UNAUTHENTICATED');
    });
  });

  it('calls onError and falls back to HTTP_<status> when there is no envelope', async () => {
    const onError = vi.fn();
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      fetch: fakeFetch(() => new Response('boom', { status: 503 })),
      onError,
    });
    await expect(client.ready()).rejects.toMatchObject({ status: 503, code: 'HTTP_503' });
    expect(onError).toHaveBeenCalledOnce();
  });

  it('POST sends a JSON body and content-type', async () => {
    const fetchImpl = fakeFetch((_url, init) => {
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify({ hello: 'world' }));
      return json({ ok: true });
    });
    const client = new ApiClient({ baseUrl: 'http://api.test', fetch: fetchImpl });
    await expect(client.post('/echo', { hello: 'world' })).resolves.toEqual({ ok: true });
  });
});
