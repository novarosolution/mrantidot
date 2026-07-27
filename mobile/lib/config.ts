import Constants from 'expo-constants';

/**
 * Live AWS API — never fall back to localhost / 10.0.2.2 / 127.0.0.1.
 * Expo Go, emulators, and release APKs all use this public host.
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

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (isUsableApiUrl(fromEnv)) return stripSlash(fromEnv);

  const fromExtra = fromExpoExtra();
  if (fromExtra) return fromExtra;

  return LIVE_API_URL;
}

const apiUrl = resolveApiUrl();

console.log('[config] API resolved', {
  apiUrl,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL ?? null,
  EXPO_PUBLIC_API_URL_FORCE: process.env.EXPO_PUBLIC_API_URL_FORCE ?? null,
  expoConfigExtra: Constants.expoConfig?.extra?.apiUrl ?? null,
  manifestExtra: (Constants as { manifest?: { extra?: { apiUrl?: string } } }).manifest?.extra?.apiUrl ?? null,
  __DEV__,
});

export const config = {
  apiUrl,
};
