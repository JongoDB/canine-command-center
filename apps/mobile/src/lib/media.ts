import * as ImagePicker from 'expo-image-picker';
import type { Media } from '@ccc/shared';
import { authClient } from './auth-client';
import { API_BASE_URL } from './config';

/** Auth header for the cookie-less mobile session (mirrors `api.ts`). */
function cookieHeader(): Record<string, string> {
  const cookie = authClient.getCookie?.() ?? '';
  return cookie ? { Cookie: cookie } : {};
}

/**
 * An `<Image source={…}>` value for a stored Media id. `GET /media/:id` is
 * owner-scoped, so we have to forward the session cookie — RN's `Image`
 * accepts a `headers` map on the source for exactly this.
 */
export function mediaSource(id: string): { uri: string; headers: Record<string, string> } {
  return { uri: `${API_BASE_URL}/media/${id}`, headers: cookieHeader() };
}

export interface PickedPhoto {
  media: Media;
  /** Local `file://` uri of the picked asset — use it for an instant preview. */
  localUri: string;
}

/**
 * Let the user pick (or, with `{ camera: true }`, capture) an image, upload it
 * to `POST /media`, and return the stored Media plus the local uri for an
 * immediate preview. Resolves `null` if the user cancels. Throws on permission
 * denial / upload error.
 */
export async function pickAndUploadPhoto(
  opts: { camera?: boolean } = {},
): Promise<PickedPhoto | null> {
  const editOpts = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.85 };
  let result: ImagePicker.ImagePickerResult;
  if (opts.camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Camera access was denied.');
    result = await ImagePicker.launchCameraAsync(editOpts);
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error('Photo library access was denied.');
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], ...editOpts });
  }
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0]!;

  const form = new FormData();
  form.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? 'photo.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/media`, {
    method: 'POST',
    headers: cookieHeader(),
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
  const media = ((await res.json()) as { media: Media }).media;
  return { media, localUri: asset.uri };
}
