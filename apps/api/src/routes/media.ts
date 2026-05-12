import { randomUUID } from 'node:crypto';
import { and, count, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { Media } from '@ccc/shared';
import { requireSession } from '../auth/requireSession';
import { env } from '../config/env';
import { getDb } from '../db/client';
import { media as mediaTable, type MediaRow } from '../db/schema';
import { processUploadedImage } from '../lib/images';
import { storage } from '../services/storage';

/** Images we accept for now (photos). On upload they're decoded, auto-oriented
 *  and re-encoded (which strips EXIF/GPS) by `processUploadedImage`. */
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);
const MAX_MIB = 10; // keep in sync with the @fastify/multipart limit in server.ts

function toMedia(row: MediaRow): Media {
  return {
    id: row.id,
    kind: row.kind,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width ?? null,
    height: row.height ?? null,
    hasThumbnail: !!row.thumbStorageKey,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Current per-user media usage (count + total bytes of the full-size objects). */
async function usageFor(userId: string): Promise<{ items: number; bytes: number }> {
  const [row] = await getDb()
    .select({
      items: count(),
      bytes: sql<number>`coalesce(sum(${mediaTable.sizeBytes}), 0)::bigint`,
    })
    .from(mediaTable)
    .where(eq(mediaTable.userId, userId));
  return { items: Number(row?.items ?? 0), bytes: Number(row?.bytes ?? 0) };
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
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return reply.status(415).send({
        error: { code: 'UNSUPPORTED_TYPE', message: `Unsupported image type: ${file.mimetype}` },
      });
    }
    let raw: Buffer;
    try {
      raw = await file.toBuffer();
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
    if (raw.length === 0) {
      return reply.status(400).send({ error: { code: 'EMPTY_FILE', message: 'Empty file.' } });
    }

    let img;
    try {
      img = await processUploadedImage(raw, file.mimetype);
    } catch {
      return reply
        .status(400)
        .send({ error: { code: 'BAD_IMAGE', message: "Couldn't read that image." } });
    }

    // Per-user upload quota (count + total bytes).
    const usage = await usageFor(request.auth!.user.id);
    if (
      usage.items >= env.MEDIA_MAX_PER_USER ||
      usage.bytes + img.buf.length > env.MEDIA_MAX_BYTES_PER_USER
    ) {
      return reply.status(413).send({
        error: {
          code: 'QUOTA_EXCEEDED',
          message: `Upload quota reached (max ${env.MEDIA_MAX_PER_USER} files / ${Math.round(env.MEDIA_MAX_BYTES_PER_USER / (1024 * 1024))} MiB). Remove some media first.`,
        },
      });
    }

    const id = randomUUID();
    const key = `media/${id}${img.ext}`;
    const thumbKey = `media/${id}-thumb.jpg`;
    await storage.put(key, img.buf);
    await storage.put(thumbKey, img.thumb);
    const [row] = await getDb()
      .insert(mediaTable)
      .values({
        id,
        userId: request.auth!.user.id,
        kind: 'photo',
        mimeType: img.mimeType,
        sizeBytes: img.buf.length,
        width: img.width,
        height: img.height,
        storageKey: key,
        thumbStorageKey: thumbKey,
      })
      .returning();
    return reply.status(201).send({ media: toMedia(row!) });
  });

  // Stream a stored image (owner-scoped). `?variant=thumb` serves the JPEG
  // thumbnail when one exists (falls back to the full-size object otherwise).
  app.get('/media/:id', async (request, reply) => {
    const id = (request.params as { id: string }).id;
    const wantThumb = (request.query as { variant?: string }).variant === 'thumb';
    const rows = await getDb()
      .select()
      .from(mediaTable)
      .where(and(eq(mediaTable.id, id), eq(mediaTable.userId, request.auth!.user.id)))
      .limit(1);
    const m = rows[0];
    if (!m) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
    }
    let key = m.storageKey;
    let mimeType = m.mimeType;
    if (wantThumb && m.thumbStorageKey && (await storage.exists(m.thumbStorageKey))) {
      key = m.thumbStorageKey;
      mimeType = 'image/jpeg';
    }
    if (!(await storage.exists(key))) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Media not found' } });
    }
    void reply.header('content-type', mimeType);
    void reply.header('cache-control', 'private, max-age=86400');
    return reply.send(storage.getStream(key));
  });
}
