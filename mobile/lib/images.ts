import { config } from './config';

export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${config.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Photos that ship inside the website build (not uploaded through the app). */
const WEBSITE_BUNDLED = /^\/(frontend|pests|images)\//i;

export type WebsitePreview =
  | { kind: 'empty' }
  | { kind: 'remote'; uri: string }
  /** Website-bundled file and no EXPO_PUBLIC_WEBSITE_URL — show a neat placeholder with the file name. */
  | { kind: 'bundled'; fileName: string };

/**
 * How to preview a website photo URL in the app: https URLs as-is, `/uploads/…` from the API,
 * website-bundled paths from the website origin when it is configured.
 */
export function websitePreview(url?: string | null): WebsitePreview {
  const v = (url ?? '').trim();
  if (!v) return { kind: 'empty' };
  if (/^https?:\/\//i.test(v)) return { kind: 'remote', uri: v };
  if (v.startsWith('/uploads/')) return { kind: 'remote', uri: mediaUrl(v) };
  if (WEBSITE_BUNDLED.test(v)) {
    if (config.websiteUrl) return { kind: 'remote', uri: `${config.websiteUrl}${v}` };
    return { kind: 'bundled', fileName: v.split('/').pop() || v };
  }
  return { kind: 'remote', uri: mediaUrl(v) };
}
