// Uploaded media (photos for now; video / chat-image attachments later).
// The bytes live behind `GET /media/:id` (owner-scoped); clients reference a
// `Media` by id (e.g. `dog.photoMediaId`).

export type MediaKind = 'photo' | 'video';

export interface Media {
  id: string;
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  /** Pixel dimensions (null for media uploaded before image processing existed). */
  width: number | null;
  height: number | null;
  /** Whether a thumbnail variant is available (request it with `?variant=thumb`). */
  hasThumbnail: boolean;
  createdAt: string;
}
