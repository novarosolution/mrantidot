import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Live AWS API used by release builds and when EXPO_PUBLIC_API_URL_FORCE=true.
 * Dev builds otherwise talk to the local server (loopback on simulators, Metro host on phones).
 */
export const LIVE_API_URL = 'http://13.60.23.65:4001';

const BLOCKED_HOST = /localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0/i;

function stripSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function isUsableApiUrl(url: string | undefined | null): url is string {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (BLOCKED_HOST.test(trimmed)) return false;
  if (/REPLACE|YOUR-SERVICE|your-public-api|example\.com/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function fromExpoExtra(): string | undefined {
  const extra = Constants.expoConfig?.extra ?? (Constants as { manifest?: { extra?: Record<string, unknown> } }).manifest?.extra;
  const raw = extra && typeof extra.apiUrl === 'string' ? extra.apiUrl : undefined;
  return isUsableApiUrl(raw) ? stripSlash(raw.trim()) : undefined;
}

function fromMetroHost(): string | undefined {
  const port = process.env.EXPO_PUBLIC_API_PORT || '4001';
  // Simulators share the Mac's network, so loopback survives Wi‑Fi/hotspot IP changes.
  if (!Device.isDevice) {
    return Platform.OS === 'android' ? `http://10.0.2.2:${port}` : `http://localhost:${port}`;
  }
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (!host || BLOCKED_HOST.test(host)) return undefined;
  return `http://${host}:${port}`;
}

function httpUrlOrUndefined(url: string | undefined | null): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? stripSlash(trimmed) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Sub-path the web export is served from (`experiments.baseUrl`, e.g. `/admin` — see
 * `npm run export:web-admin`); '' for a root export. Inlined at build time.
 */
const WEB_BASE_PATH = stripSlash(process.env.EXPO_BASE_URL ?? '');

/**
 * Web admin panel (Expo web export):
 * - dev (`expo start --web`): the local server on EXPO_PUBLIC_API_PORT (4001), or EXPO_PUBLIC_API_URL
 *   when EXPO_PUBLIC_API_URL_FORCE=true — same rule as native dev builds;
 * - production: EXPO_PUBLIC_API_URL when it was set to something other than the plain-HTTP live API
 *   (app.config.js always injects that one for native builds, and an HTTPS page cannot call it), else
 *   the page's own origin plus the base path, so `/admin/api/…` and `/admin/uploads/…` go through the
 *   hosting rewrite (mobile/vercel.json, or the website's proxy when served at mrantidot.com/admin).
 */
function resolveWebApiUrl(): string {
  const fromEnv = httpUrlOrUndefined(process.env.EXPO_PUBLIC_API_URL);
  if (__DEV__) {
    if (process.env.EXPO_PUBLIC_API_URL_FORCE === 'true' && fromEnv) return fromEnv;
    return `http://localhost:${process.env.EXPO_PUBLIC_API_PORT || '4001'}`;
  }
  if (fromEnv && fromEnv !== LIVE_API_URL) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return stripSlash(`${window.location.origin}${WEB_BASE_PATH}`);
  }
  return LIVE_API_URL;
}

function resolveApiUrl(): string {
  if (Platform.OS === 'web') return resolveWebApiUrl();

  if (__DEV__ && process.env.EXPO_PUBLIC_API_URL_FORCE !== 'true') {
    const fromMetro = fromMetroHost();
    if (fromMetro) return fromMetro;
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (isUsableApiUrl(fromEnv)) return stripSlash(fromEnv);

  const fromExtra = fromExpoExtra();
  if (fromExtra) return fromExtra;

  return LIVE_API_URL;
}

const apiUrl = resolveApiUrl();

/**
 * Public website origin (e.g. https://mrantidot.com) — optional. Used only to preview photos that
 * ship with the website itself (`/frontend/…`, `/pests/…`). Unset → admin screens show a placeholder.
 */
function resolveWebsiteUrl(): string | undefined {
  const usable = (url: unknown): url is string => {
    if (typeof url !== 'string' || !url.trim()) return false;
    if (/REPLACE|YOUR-SERVICE|example\.com/i.test(url)) return false;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const fromEnv = process.env.EXPO_PUBLIC_WEBSITE_URL?.trim();
  if (usable(fromEnv)) return stripSlash(fromEnv);
  const extra = Constants.expoConfig?.extra ?? (Constants as { manifest?: { extra?: Record<string, unknown> } }).manifest?.extra;
  const raw = extra?.websiteUrl;
  if (usable(raw)) return stripSlash(raw.trim());
  return undefined;
}

const websiteUrl = resolveWebsiteUrl();

if (__DEV__) {
  console.log('[config] API resolved', {
    apiUrl,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? null,
    EXPO_PUBLIC_API_URL_FORCE: process.env.EXPO_PUBLIC_API_URL_FORCE ?? null,
    expoConfigExtra: Constants.expoConfig?.extra?.apiUrl ?? null,
    manifestExtra: (Constants as { manifest?: { extra?: { apiUrl?: string } } }).manifest?.extra?.apiUrl ?? null,
    __DEV__,
  });
}

export const config = {
  apiUrl,
  /** Optional public website origin (EXPO_PUBLIC_WEBSITE_URL); undefined when not configured. */
  websiteUrl,
};
