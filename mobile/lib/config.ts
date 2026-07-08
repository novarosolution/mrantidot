import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Must match server/.env PORT (default 4001 — port 4000 is often taken on macOS). */
const DEFAULT_PORT = 4001;

/**
 * In Expo dev, the device reaches Metro at a specific host/IP. Re-using that same
 * host for the API guarantees reachability and means we never have to hand-edit an
 * IP in .env when the network (and the Mac's LAN IP) changes.
 */
function parsePortFromUrl(url: string | undefined): number | undefined {
  if (!url) return undefined;
  try {
    const port = new URL(url).port;
    if (port) return parseInt(port, 10);
    return url.startsWith('https:') ? 443 : 80;
  } catch {
    return undefined;
  }
}

function devHostApiUrl(port: number): string | undefined {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Fallbacks for older manifests / Expo Go
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!hostUri) return undefined;
  let host = String(hostUri).split(':')[0]?.trim();
  if (!host) return undefined;

  // Android emulator: localhost is the emulator itself, not the dev machine.
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    host = '10.0.2.2';
  }

  return `http://${host}:${port}`;
}

const fromExtra =
  typeof Constants.expoConfig?.extra?.apiUrl === 'string'
    ? Constants.expoConfig.extra.apiUrl.trim()
    : undefined;

const explicit =
  process.env.EXPO_PUBLIC_API_URL?.trim() || fromExtra || undefined;

const apiPort = parsePortFromUrl(explicit) ?? DEFAULT_PORT;
const auto = __DEV__ ? devHostApiUrl(apiPort) : undefined;

/**
 * Precedence:
 * - In dev, use EXPO_PUBLIC_API_URL when set (correct port from .env).
 * - Otherwise auto-detect host from Metro with apiPort.
 * - In production builds, use deploy.config / EXPO_PUBLIC_API_URL.
 */
const resolvedApiUrl =
  __DEV__ && explicit
    ? explicit.replace(/\/$/, '')
    : __DEV__ && auto
      ? auto
      : explicit?.replace(/\/$/, '') ?? auto ?? `http://127.0.0.1:${DEFAULT_PORT}`;

/** Android emulator reaches the dev machine via 10.0.2.2, not LAN IP or localhost. */
function forAndroidEmulator(url: string): string {
  if (Platform.OS !== 'android' || Constants.isDevice) return url;
  try {
    const parsed = new URL(url);
    parsed.hostname = '10.0.2.2';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url;
  }
}

if (!explicit && !auto) {
  console.warn(
    '[config] Set deploy.config.json API_URL (repo root) or EXPO_PUBLIC_API_URL for production builds. ' +
      'Falling back to localhost.',
  );
}

export const config = {
  apiUrl: __DEV__ ? forAndroidEmulator(resolvedApiUrl) : resolvedApiUrl,
};
