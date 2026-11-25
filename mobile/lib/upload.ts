import { Platform } from 'react-native';
import { config } from './config';
import { getToken } from './storage';
import { getApiErrorMessage } from './api';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|tiff?)$/i;
const UPLOAD_TIMEOUT_MS = 120_000;

export type PickedImage = { uri: string; mimeType?: string | null };

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

function resolveMime(uri: string, mimeType?: string | null): string {
  const mime = mimeType?.toLowerCase();
  if (mime?.startsWith('image/') && mime !== 'image/svg+xml') return mime;
  return mimeFromUri(uri);
}

function normalizeUploadUri(uri: string): string {
  if (!uri) return uri;
  if (Platform.OS === 'android' && uri.startsWith('/') && !uri.startsWith('file://')) {
    return `file://${uri}`;
  }
  return uri;
}

/**
 * Optionally compress via expo-image-manipulator if present.
 * Dynamic require — never crash if the package is missing from the APK.
 */
async function prepareImageForUpload(
  uri: string,
  mimeType?: string | null,
): Promise<{ uri: string; name: string; type: string }> {
  const source = normalizeUploadUri(uri);
  const mime = resolveMime(uri, mimeType);
  const fallback = {
    uri: source,
    name: filenameFromUri(uri, `photo-${Date.now()}.jpg`),
    type: mime.startsWith('image/') ? mime : 'image/jpeg',
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImageManipulator = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
    if (!ImageManipulator?.manipulateAsync) return fallback;

    const result = await ImageManipulator.manipulateAsync(
      source,
      [{ resize: { width: 1600 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    return {
      uri: normalizeUploadUri(result.uri),
      name: `photo-${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  } catch {
    return fallback;
  }
}

/**
 * Strict variant for endpoints that only take browser-safe formats (the website): always re-encodes
 * to JPEG with expo-image-manipulator, only shrinks (never upscales) and fails instead of ever
 * sending the original file — so an iPhone HEIC can never reach the server.
 */
async function prepareJpegForUpload(uri: string, maxWidth: number): Promise<{ uri: string; name: string; type: string }> {
  const source = normalizeUploadUri(uri);
  let ImageManipulator: typeof import('expo-image-manipulator');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ImageManipulator = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
  } catch {
    throw new Error('This app version cannot convert photos. Update the app and try again.');
  }
  const done = (resultUri: string) => ({
    uri: normalizeUploadUri(resultUri),
    name: `photo-${Date.now()}.jpg`,
    type: 'image/jpeg',
  });
  try {
    const original = await ImageManipulator.ImageManipulator.manipulate(source).renderAsync();
    const image =
      original.width > maxWidth
        ? await ImageManipulator.ImageManipulator.manipulate(original).resize({ width: maxWidth }).renderAsync()
        : original;
    const saved = await image.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.82 });
    return done(saved.uri);
  } catch {
    // Older native module: the legacy one-shot API still re-encodes to JPEG.
    try {
      const result = await ImageManipulator.manipulateAsync(source, [{ resize: { width: maxWidth } }], {
        compress: 0.82,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return done(result.uri);
    } catch {
      throw new Error('Could not read this photo. Try another one (JPG or PNG works best).');
    }
  }
}

function parseUploadResponse(raw: string): string {
  let data: { urls?: string[]; url?: string; error?: string };
  try {
    data = JSON.parse(raw) as { urls?: string[]; url?: string; error?: string };
  } catch {
    throw new Error('Server returned an invalid upload response');
  }
  if (data.error) throw new Error(data.error);
  // `/upload` answers `{ urls: [...] }`; single-photo endpoints (website media) answer `{ url }`.
  const url = data.url ?? data.urls?.[0];
  if (!url) throw new Error('Upload returned no URL');
  return url;
}

/** Where a photo goes: endpoint is relative to `/api` (default `/upload`), field is the multipart name. */
export type UploadImageOptions = {
  endpoint?: string;
  field?: string;
  /** Force a JPEG re-encode and never send the original file. Default: on for any non-default endpoint. */
  jpegOnly?: boolean;
  /** Longest width sent when `jpegOnly` (default 1600). */
  maxWidth?: number;
  /** 0–1 while the bytes are sent (XHR only). */
  onProgress?: (fraction: number) => void;
};

const DEFAULT_ENDPOINT = '/upload';
const DEFAULT_FIELD = 'photo';

type UploadTarget = { url: string; field: string; onProgress?: (fraction: number) => void };

function uploadTarget(options?: UploadImageOptions): UploadTarget {
  const endpoint = options?.endpoint?.trim() || DEFAULT_ENDPOINT;
  return {
    url: `${config.apiUrl}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
    field: options?.field?.trim() || DEFAULT_FIELD,
    onProgress: options?.onProgress,
  };
}

type UploadFile = { uri: string; name: string; type: string };

/**
 * Multipart body with the photo under `field`. Native: the React Native `{ uri, name, type }` part.
 * Web: browsers need real bytes, so the picked / re-encoded `blob:` / `data:` URI is fetched into a
 * Blob and appended as a `File` (no manual Content-Type — the browser writes the multipart boundary).
 */
async function buildUploadForm(field: string, file: UploadFile): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    let blob: Blob;
    try {
      blob = await (await fetch(file.uri)).blob();
    } catch {
      throw new Error('Could not read this photo. Try another one (JPG or PNG works best).');
    }
    const type = file.type || blob.type || 'image/jpeg';
    const part =
      typeof File === 'function' ? new File([blob], file.name, { type }) : blob.slice(0, blob.size, type);
    form.append(field, part, file.name);
    return form;
  }
  form.append(field, {
    uri: file.uri,
    name: file.name,
    type: file.type || 'image/jpeg',
  } as unknown as Blob);
  return form;
}

/** Native XHR multipart — reliable for React Native { uri, name, type } file parts. */
async function uploadWithXhr(file: UploadFile, token: string | null, target: UploadTarget): Promise<string> {
  const form = await buildUploadForm(target.field, file);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', target.url);
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.responseType = 'text';
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (target.onProgress && xhr.upload) {
      const report = target.onProgress;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) report(Math.min(1, e.loaded / e.total));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(parseUploadResponse(String(xhr.responseText ?? '')));
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Upload failed'));
        }
        return;
      }
      try {
        const body = JSON.parse(String(xhr.responseText ?? '')) as { error?: string };
        if (body.error) {
          reject(new Error(body.error));
          return;
        }
      } catch {
        // fall through
      }
      if (xhr.status === 0) {
        reject(new Error(`Network error while uploading. Check connection to ${config.apiUrl}`));
        return;
      }
      if (xhr.status === 413) {
        reject(new Error('Photo is too large for the server.'));
        return;
      }
      if (xhr.status === 401) {
        reject(new Error('Please sign in again, then retry the upload.'));
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => {
      reject(new Error(`Network error while uploading. Check connection to ${config.apiUrl}`));
    };
    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Try a smaller photo or better network.'));
    };
    xhr.onabort = () => {
      reject(new Error('Upload was cancelled.'));
    };

    try {
      xhr.send(form);
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Could not start upload'));
    }
  });
}

async function uploadWithFetch(file: UploadFile, token: string | null, target: UploadTarget): Promise<string> {
  const form = await buildUploadForm(target.field, file);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer =
    controller &&
    setTimeout(() => {
      try {
        controller.abort();
      } catch {
        /* ignore */
      }
    }, UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(target.url, {
      method: 'POST',
      headers,
      body: form,
      signal: controller?.signal,
    });
    const raw = await res.text();
    if (!res.ok) {
      try {
        const body = JSON.parse(raw) as { error?: string };
        if (body.error) throw new Error(body.error);
      } catch (err) {
        if (err instanceof Error && err.message && !/JSON|Unexpected/.test(err.message)) throw err;
      }
      if (res.status === 413) throw new Error('Photo is too large for the server.');
      if (res.status === 401) throw new Error('Please sign in again, then retry the upload.');
      throw new Error(`Upload failed (${res.status})`);
    }
    return parseUploadResponse(raw);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Uploads one photo and returns its URL. Defaults to `POST /api/upload` (field `photo`); pass
 * `options.endpoint` / `options.field` for other endpoints (those are always sent as JPEG).
 */
export async function uploadImage(
  uri: string,
  _name?: string,
  mimeType?: string | null,
  options?: UploadImageOptions,
): Promise<string> {
  if (!uri?.trim()) throw new Error('No photo selected');

  const target = uploadTarget(options);
  const customEndpoint = Boolean(options?.endpoint?.trim()) && options?.endpoint?.trim() !== DEFAULT_ENDPOINT;
  const jpegOnly = options?.jpegOnly ?? customEndpoint;

  try {
    const prepared = jpegOnly
      ? await prepareJpegForUpload(uri, options?.maxWidth ?? 1600)
      : await prepareImageForUpload(uri, mimeType);
    const token = await getToken();
    try {
      return await uploadWithXhr(prepared, token, target);
    } catch (xhrErr) {
      const msg = xhrErr instanceof Error ? xhrErr.message : '';
      if (/Network error|Upload failed \(0\)|Could not start/i.test(msg)) {
        return await uploadWithFetch(prepared, token, target);
      }
      throw xhrErr;
    }
  } catch (err) {
    const msg = getApiErrorMessage(err, err instanceof Error ? err.message : 'Upload failed');
    if (/file too large|LIMIT_FILE_SIZE|too large/i.test(msg)) {
      throw new Error('Photo is too large. Try a smaller image.');
    }
    if (/Only image files/i.test(msg)) {
      throw new Error('Only image files can be uploaded.');
    }
    if (/No images uploaded/i.test(msg)) {
      throw new Error('Photo did not reach the server. Try again or pick another image.');
    }
    if (/CLEARTEXT|UnknownServiceException|cleartext/i.test(msg)) {
      throw new Error('Android blocked HTTP. Rebuild/reinstall the APK (cleartext fix).');
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
    urls.push(await uploadImage(uri, undefined, mimeType));
  }
  return urls;
}

/** Website photo (hero, gallery, blog cover…): `POST /api/website/admin/media`, JPEG only. Returns its URL. */
export function uploadWebsiteImage(
  uri: string,
  options?: Pick<UploadImageOptions, 'onProgress' | 'maxWidth'>,
): Promise<string> {
  return uploadImage(uri, undefined, 'image/jpeg', {
    endpoint: '/website/admin/media',
    field: 'photo',
    jpegOnly: true,
    maxWidth: options?.maxWidth ?? 1600,
    onProgress: options?.onProgress,
  });
}
