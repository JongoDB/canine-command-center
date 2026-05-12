import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Dog, Media } from '@ccc/shared';
import { closeDb, getPool, pingDb } from '../db/client';
import { applyMigrations } from '../db/migrate';
import { buildServer } from '../server';
import { createTestUser, type TestUser } from '../test-helpers';

const dbReachable = await pingDb(2500);
const suite = dbReachable ? describe : describe.skip;
if (!dbReachable) {
  console.warn('[media.test] DATABASE_URL not reachable — skipping DB-backed media tests');
}

// A 1×1 transparent PNG.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function multipartImageBody(
  buf: Buffer,
  mime: string,
  filename: string,
): { body: Buffer; contentType: string } {
  const boundary = `----ccc-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;
  return {
    body: Buffer.concat([Buffer.from(head, 'utf8'), buf, Buffer.from(tail, 'utf8')]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

suite('Media API — upload, fetch, owner scoping', () => {
  let app: FastifyInstance;
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    await applyMigrations();
    await getPool().query(
      'TRUNCATE TABLE "message", "conversation", "intake_response", "dog", "media", "session", "account", "verification", "user" CASCADE',
    );
    app = await buildServer();
    await app.ready();
    alice = await createTestUser(app, 'Alice');
    bob = await createTestUser(app, 'Bob');
  });

  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it('rejects unauthenticated upload/fetch', async () => {
    const { body, contentType } = multipartImageBody(PNG_1x1, 'image/png', 'p.png');
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/media',
          headers: { 'content-type': contentType },
          payload: body,
        })
      ).statusCode,
    ).toBe(401);
  });

  it('uploads a PNG and serves it back to the owner; another user gets a 404', async () => {
    const { body, contentType } = multipartImageBody(PNG_1x1, 'image/png', 'pixel.png');
    const up = await app.inject({
      method: 'POST',
      url: '/media',
      headers: { cookie: alice.cookie, 'content-type': contentType },
      payload: body,
    });
    expect(up.statusCode).toBe(201);
    const { media } = up.json() as { media: Media };
    expect(media.kind).toBe('photo');
    expect(media.mimeType).toBe('image/png');
    expect(media.sizeBytes).toBe(PNG_1x1.length);

    // Owner can fetch the bytes.
    const get = await app.inject({
      method: 'GET',
      url: `/media/${media.id}`,
      headers: { cookie: alice.cookie },
    });
    expect(get.statusCode).toBe(200);
    expect(get.headers['content-type']).toContain('image/png');
    expect(get.rawPayload.equals(PNG_1x1)).toBe(true);

    // Bob cannot.
    expect(
      (
        await app.inject({
          method: 'GET',
          url: `/media/${media.id}`,
          headers: { cookie: bob.cookie },
        })
      ).statusCode,
    ).toBe(404);

    // A dog can reference it as its photo, and the dog response carries the id.
    const dogRes = await app.inject({
      method: 'POST',
      url: '/dogs',
      headers: { cookie: alice.cookie },
      payload: { name: 'Sentry', photoMediaId: media.id },
    });
    expect(dogRes.statusCode).toBe(201);
    expect((dogRes.json() as { dog: Dog }).dog.photoMediaId).toBe(media.id);
  });

  it('rejects a non-image upload with 415', async () => {
    const { body, contentType } = multipartImageBody(
      Buffer.from('not an image'),
      'text/plain',
      'note.txt',
    );
    const res = await app.inject({
      method: 'POST',
      url: '/media',
      headers: { cookie: alice.cookie, 'content-type': contentType },
      payload: body,
    });
    expect(res.statusCode).toBe(415);
    expect((res.json() as { error: { code: string } }).error.code).toBe('UNSUPPORTED_TYPE');
  });

  it('404 on an unknown media id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/media/00000000-0000-0000-0000-000000000000',
      headers: { cookie: alice.cookie },
    });
    expect(res.statusCode).toBe(404);
  });
});
