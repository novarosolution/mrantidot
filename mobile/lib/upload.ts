import { api, getApiErrorMessage } from './api';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|tiff?|svg)$/i;

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
  if (path.endsWith('.svg')) return 'image/svg+xml';
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
  if (mimeType?.toLowerCase().startsWith('image/')) return mimeType.toLowerCase();
  return mimeFromUri(uri);
}

export async function uploadImage(
  uri: string,
  name?: string,
  mimeType?: string | null,
): Promise<string> {
  const form = new FormData();
  const type = resolveMime(uri, mimeType);
  const fileName = name ?? filenameFromUri(uri);
  form.append('photo', {
    uri,
    name: fileName,
    type,
  } as unknown as Blob);

  const { data } = await api.post<{ urls: string[] }>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipErrorToast: true,
  });

  const url = data.urls[0];
  if (!url) throw new Error('Upload returned no URL');
  return url;
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
