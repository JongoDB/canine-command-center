import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { env } from '../config/env';

/**
 * Pluggable blob storage. Local filesystem in dev / self-host; an S3-compatible
 * provider (R2 / B2 / S3) slots in here for cloud. Keys are app-chosen
 * (e.g. `media/<uuid>.jpg`); the provider only knows bytes.
 */
export interface StorageProvider {
  put(key: string, data: Buffer): Promise<void>;
  /** A readable stream of the stored object — for streaming HTTP responses. */
  getStream(key: string): Readable;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

class LocalFsStorageProvider implements StorageProvider {
  constructor(private readonly root: string) {}

  private full(key: string): string {
    // Defend against `..` in keys (keys are app-generated, but cheap insurance).
    const safe = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.root, safe);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const f = this.full(key);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, data);
  }

  getStream(key: string): Readable {
    return createReadStream(this.full(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.full(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await unlink(this.full(key)).catch(() => {});
  }
}

export const storage: StorageProvider = new LocalFsStorageProvider(env.UPLOADS_DIR);
