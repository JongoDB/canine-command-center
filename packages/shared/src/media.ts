// Uploaded media (photos for now; video / chat-image attachments later).
// The bytes live behind `GET /media/:id` (owner-scoped); clients reference a
// `Media` by id (e.g. `dog.photoMediaId`).

export type MediaKind = 'photo' | 'video';

export interface Media {
  id: string;
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  /** Pixel dimensions if known (null until we add image processing). */
  width: number | null;
  height: number | null;
  createdAt: string;
}
