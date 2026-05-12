import type { Media } from '@ccc/shared';
import { API_BASE_URL } from './config';

/** URL the browser fetches the stored image from (owner-scoped on the server). */
export function mediaUrl(id: string): string {
  return `${API_BASE_URL}/media/${id}`;
}

/** Upload an image file → returns the stored Media. Throws on failure. */
export async function uploadPhoto(file: File): Promise<Media> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/media`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body.error?.message) msg = body.error.message;
    } catch {
      /* keep the generic message */
    }
    throw new Error(msg);
  }
  return (await res.json()).media as Media;
}
