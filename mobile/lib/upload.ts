import { Platform } from 'react-native';
import { api, getApiErrorMessage } from './api';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|tiff?)$/i;
const UPLOAD_TIMEOUT_MS = 120_000;

/** Infer image MIME from local URI (gallery/camera); never use non-image types. */
export function mimeFromUri(uri: string): string {
  const path = uri.split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.heic')) return 'image/heic';
  if (path.endsWith('.heif')) return 'image/heif';
  if (path.endsWith('.bmp')) return 'image/bmp';
  if (path.endsWith('.avif')) return 'image/avif';
  if (path.endsWith('.tiff') || path.endsWith('.tif')) return 'image/tiff';
  return 'image/jpeg';
}

export function filenameFromUri(uri: string, fallback = 'photo.jpg'): string {
  const match = uri.split('?')[0].match(IMAGE_EXT);
  if (match) return `photo${match[0].toLowerCase()}`;
  return fallback;
}

export type PickedImage = { uri: string; mimeType?: string | null };

function resolveMime(uri: string, mimeType?: string | null): string {
  const mime = mimeType?.toLowerCase();
  // Server rejects SVG; never send it as an upload type.
  if (mime?.startsWith('image/') && mime !== 'image/svg+xml') return mime;
  return mimeFromUri(uri);
}

/** Normalize local picker URIs so XHR multipart can read the file on Android. */
function normalizeUploadUri(uri: string): string {
  if (!uri) return uri;
  // Android content:// / ph:// stay as-is; file paths without a scheme need file://
  if (Platform.OS === 'android' && uri.startsWith('/') && !uri.startsWith('file://')) {
    return `file://${uri}`;
  }
  return uri;
}

export async function uploadImage(
  uri: string,
  name?: string,
  mimeType?: string | null,
): Promise<string> {
  const form = new FormData();
  const type = resolveMime(uri, mimeType);
  const fileName = name ?? filenameFromUri(uri);
  const fileUri = normalizeUploadUri(uri);

  form.append('photo', {
    uri: fileUri,
    name: fileName,
    type,
  } as unknown as Blob);

  try {
    const { data } = await api.post<{ urls: string[] }>('/upload', form, {
      skipErrorToast: true,
      timeout: UPLOAD_TIMEOUT_MS,
      adapter: 'xhr',
      // Prevent axios from JSON-encoding FormData.
      transformRequest: [(body) => body],
    });

    const url = data.urls[0];
    if (!url) throw new Error('Upload returned no URL');
    return url;
  } catch (err) {
    const msg = getApiErrorMessage(err, 'Upload failed');
    if (/file too large|LIMIT_FILE_SIZE|File too large/i.test(msg)) {
      throw new Error('Photo is too large. Try a smaller image (under 12 MB).');
    }
    if (/Only image files/i.test(msg)) {
      throw new Error('Only image files can be uploaded.');
    }
    if (/No images uploaded/i.test(msg)) {
      throw new Error('Photo did not reach the server. Try again or pick another image.');
    }
    throw new Error(msg);
  }
}

export async function uploadImages(items: string[] | PickedImage[]): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const uri = typeof item === 'string' ? item : item.uri;
    const mimeType = typeof item === 'string' ? undefined : item.mimeType;
    urls.push(
      await uploadImage(uri, filenameFromUri(uri, `photo-${i}.jpg`), mimeType),
    );
  }
  return urls;
}
