import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
  let host = String(hostUri).split(':')[0]?.trim();
  if (!host) return undefined;

  // Android emulator: localhost is the emulator itself, not the dev machine.
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    host = '10.0.2.2';
  }

  return `http://${host}:${DEFAULT_PORT}`;
}

const fromExtra =
  typeof Constants.expoConfig?.extra?.apiUrl === 'string'
    ? Constants.expoConfig.extra.apiUrl.trim()
    : undefined;

const explicit =
  process.env.EXPO_PUBLIC_API_URL?.trim() || fromExtra || undefined;
const auto = __DEV__ ? devHostApiUrl() : undefined;

/**
 * Precedence:
 * - In dev, always prefer the live Expo/Metro host so the app talks to your local API.
 * - In production builds, use deploy.config / EXPO_PUBLIC_API_URL.
 */
const resolvedApiUrl =
  __DEV__ && auto
    ? auto
    : explicit ?? auto ?? `http://127.0.0.1:${DEFAULT_PORT}`;

if (!explicit && !auto) {
  console.warn(
    '[config] Set deploy.config.json API_URL (repo root) or EXPO_PUBLIC_API_URL for production builds. ' +
      'Falling back to localhost.',
  );
}

export const config = {
  apiUrl: resolvedApiUrl,
};
