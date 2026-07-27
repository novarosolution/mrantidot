import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Must match server/.env PORT (default 4001 — port 4000 is often taken on macOS). */
const DEFAULT_PORT = 4001;

/**
 * In Expo dev, the device reaches Metro at a specific host/IP. Re-using that same
 * host for the API guarantees reachability and means we never have to hand-edit an
 * IP in .env when the network (and the Mac's LAN IP) changes.
 */
/** Only return a port when the URL explicitly includes one (never assume 443/80). */
function parseExplicitPort(url: string | undefined): number | undefined {
  if (!url) return undefined;
  try {
    const port = new URL(url).port;
    if (port) return parseInt(port, 10);
    return undefined;
  } catch {
    return undefined;
  }
}

function isRemoteProductionUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return true;
    const host = parsed.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2') return false;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function devHostApiUrl(port: number): string | undefined {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;

  if (!hostUri) return undefined;
  let host = String(hostUri).split(':')[0]?.trim();
  if (!host) return undefined;

  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    host = '10.0.2.2';
  }

  return `http://${host}:${port}`;
}

const fromExtra =
  typeof Constants.expoConfig?.extra?.apiUrl === 'string'
    ? Constants.expoConfig.extra.apiUrl.trim()
    : typeof (Constants as { manifest?: { extra?: { apiUrl?: string } } }).manifest?.extra?.apiUrl ===
        'string'
      ? (Constants as { manifest: { extra: { apiUrl: string } } }).manifest.extra.apiUrl.trim()
      : undefined;

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || undefined;

/**
 * Production https URLs (from deploy.config) must NOT supply the port for Metro
 * auto-detect — that caused http://<lan-ip>:443 unreachable errors.
 */
const localPinnedUrl =
  envApiUrl && !isRemoteProductionUrl(envApiUrl) ? envApiUrl : undefined;

const apiPort = parseExplicitPort(localPinnedUrl) ?? DEFAULT_PORT;
const auto = __DEV__ ? devHostApiUrl(apiPort) : undefined;

const forceExplicit =
  process.env.EXPO_PUBLIC_API_URL_FORCE === '1' ||
  process.env.EXPO_PUBLIC_API_URL_FORCE === 'true';

const resolvedApiUrl = (() => {
  if (__DEV__) {
    if (forceExplicit && envApiUrl) return envApiUrl.replace(/\/$/, '');
    if (auto) return auto;
    if (localPinnedUrl) return localPinnedUrl.replace(/\/$/, '');
    // Prefer baked deploy URL over localhost when present (useful for device testing).
    if (fromExtra && isRemoteProductionUrl(fromExtra)) return fromExtra.replace(/\/$/, '');
    return `http://127.0.0.1:${DEFAULT_PORT}`;
  }
  // Release APK/IPA: prefer Expo extra (app.config.js) then EXPO_PUBLIC_* from EAS env.
  const prod = (fromExtra || envApiUrl)?.replace(/\/$/, '');
  return prod ?? `http://127.0.0.1:${DEFAULT_PORT}`;
})();

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

if (!__DEV__ && !envApiUrl && !fromExtra) {
  console.warn(
    '[config] Set deploy.config.json / mobile/deploy.api.json / eas.json EXPO_PUBLIC_API_URL. ' +
      'Falling back to localhost (APK will not reach production API).',
  );
}

export const config = {
  apiUrl: __DEV__ ? forAndroidEmulator(resolvedApiUrl) : resolvedApiUrl,
};
