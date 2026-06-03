import Constants from 'expo-constants';

const DEFAULT_PORT = 4000;

/**
 * In Expo dev, the device reaches Metro at a specific host/IP. Re-using that same
 * host for the API guarantees reachability and means we never have to hand-edit an
 * IP in .env when the network (and the Mac's LAN IP) changes.
 */
function devHostApiUrl(): string | undefined {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Fallbacks for older manifests / Expo Go
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!hostUri) return undefined;
  const host = String(hostUri).split(':')[0]?.trim();
  if (!host) return undefined;
  return `http://${host}:${DEFAULT_PORT}`;
}

/** A private/loopback LAN address that can go stale when the network changes. */
function isLanIp(url: string): boolean {
  return /\/\/(10\.|127\.|192\.0\.0\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url);
}

const explicit = process.env.EXPO_PUBLIC_API_URL?.trim() || undefined;
const auto = __DEV__ ? devHostApiUrl() : undefined;

/**
 * Precedence:
 * - In dev, prefer the live Expo host whenever the explicit value is missing or is
 *   itself a LAN IP (the kind that goes stale). A real deployed URL still wins.
 * - In production builds (no Metro host), use the explicit EXPO_PUBLIC_API_URL.
 */
const resolvedApiUrl =
  auto && (!explicit || isLanIp(explicit))
    ? auto
    : explicit ?? auto ?? `http://127.0.0.1:${DEFAULT_PORT}`;

if (!explicit && !auto) {
  console.warn(
    '[config] EXPO_PUBLIC_API_URL is not set and no Expo dev host was found. ' +
      'Copy mobile/.env.example to mobile/.env or run via Expo. Falling back to localhost.',
  );
}

export const config = {
  apiUrl: resolvedApiUrl,
};
