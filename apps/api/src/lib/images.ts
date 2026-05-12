import sharp from 'sharp';

/** What we hand back to the upload route after normalising an uploaded image. */
export interface ProcessedImage {
  buf: Buffer;
  mimeType: string;
  /** File extension including the dot, for the storage key. */
  ext: string;
  width: number | null;
  height: number | null;
}

/** Output encoding per input mime type. HEIC/HEIF get re-encoded to JPEG (not
 *  every client can render HEIC); everything else keeps its format. */
const OUTPUT: Record<
  string,
  { mimeType: string; ext: string; encode: (s: sharp.Sharp) => sharp.Sharp }
> = {
  'image/jpeg': { mimeType: 'image/jpeg', ext: '.jpg', encode: (s) => s.jpeg({ quality: 85 }) },
  'image/png': {
    mimeType: 'image/png',
    ext: '.png',
    encode: (s) => s.png({ compressionLevel: 9 }),
  },
  'image/webp': { mimeType: 'image/webp', ext: '.webp', encode: (s) => s.webp({ quality: 85 }) },
  'image/gif': { mimeType: 'image/gif', ext: '.gif', encode: (s) => s.gif() },
  'image/heic': { mimeType: 'image/jpeg', ext: '.jpg', encode: (s) => s.jpeg({ quality: 85 }) },
  'image/heif': { mimeType: 'image/jpeg', ext: '.jpg', encode: (s) => s.jpeg({ quality: 85 }) },
};

/**
 * Decode the upload, auto-orient it (consumes the EXIF orientation tag), strip
 * all metadata (sharp drops it by default on re-encode — that includes GPS),
 * and re-encode. Returns the processed bytes plus the pixel dimensions.
 * Throws if the bytes aren't a decodable image of a supported type.
 */
export async function processUploadedImage(buf: Buffer, mimeType: string): Promise<ProcessedImage> {
  const out = OUTPUT[mimeType];
  if (!out) throw new Error(`unsupported image type: ${mimeType}`);
  const animated = mimeType === 'image/gif';
  const pipeline = sharp(buf, { animated }).rotate(); // rotate() with no arg = auto-orient from EXIF
  const { data, info } = await out.encode(pipeline).toBuffer({ resolveWithObject: true });
  // For animated GIFs `info.height` is the full filmstrip height; divide by pages.
  const pages = animated ? (info.pages ?? 1) : 1;
  return {
    buf: data,
    mimeType: out.mimeType,
    ext: out.ext,
    width: info.width || null,
    height: info.height ? Math.round(info.height / pages) : null,
  };
}
