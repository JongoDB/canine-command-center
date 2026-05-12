import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { Media } from '@ccc/shared';
import { requireSession } from '../auth/requireSession';
import { getDb } from '../db/client';
import { media as mediaTable, type MediaRow } from '../db/schema';
import { storage } from '../services/storage';

/** Images we accept for now (photos). EXIF stripping + thumbnails come later. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};
const MAX_MIB = 10; // keep in sync with the @fastify/multipart limit in server.ts

function toMedia(row: MediaRow): Media {
  return {
    id: row.id,
    kind: row.kind,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width ?? null,
    height: row.height ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireSession);

  // Upload an image (multipart/form-data, field name doesn't matter — first file wins).
  app.post('/media', async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply
        .status(400)
        .send({ error: { code: 'NO_FILE', message: 'No file in the upload.' } });
    }
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext) {
      return reply.status(415).send({
        error: { code: 'UNSUPPORTED_TYPE', message: `Unsupported image type: ${file.mimetype}` },
      });
    }
    let buf: Buffer;
    try {
      buf = await file.toBuffer();
    } catch {
      return reply
        .status(413)
        .send({ error: { code: 'TOO_LARGE', message: `Image too large (max ${MAX_MIB} MiB).` } });
    }
    if (file.file.truncated) {
      return reply
        .status(413)
        .send({ error: { code: 'TOO_LARGE', message: `Image too large (max ${MAX_MIB} MiB).` } });
    }
    if (buf.length === 0) {
      return reply.status(400).send({ error: { code: 'EMPTY_FILE', message: 'Empty file.' } });
    }

    const id = randomUUID();
    const key = `media/${id}${ext}`;
    await storage.put(key, buf);
    const [row] = await getDb()
      .insert(mediaTable)
      .values({
        id,
        userId: request.auth!.user.id,
        kind: 'photo',
        mimeType: file.mimetype,
        sizeBytes: buf.length,
        storageKey: key,
      })
      .returning();
    return reply.status(201).send({ media: toMedia(row!) });
  });

  // Stream a stored image (owner-scoped).
  app.get('/media/:id', async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const rows = await getDb()
      .select()
      .from(mediaTable)
      .where(and(eq(mediaTable.id, id), eq(mediaTable.userId, request.auth!.user.id)))
      .limit(1);
    const m = rows[0];
    if (!m || !(await storage.exists(m.storageKey))) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
    }
    void reply.header('content-type', m.mimeType);
    void reply.header('cache-control', 'private, max-age=86400');
    return reply.send(storage.getStream(m.storageKey));
  });
}
