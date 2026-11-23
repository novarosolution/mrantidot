const fs = require('node:fs');
const path = require('node:path');

const LIVE_API_URL = 'http://13.60.23.65:4001';
const BLOCKED = /localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0|REPLACE|YOUR-SERVICE|example\.com/i;

function readApiUrlFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return undefined;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const url = (data.API_URL || data.apiUrl || '').trim();
    if (url && !BLOCKED.test(url)) return url.replace(/\/$/, '');
  } catch {
    // ignore
  }
  return undefined;
}

function resolveDeployApiUrl(fallbackFromAppJson) {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv && !BLOCKED.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '');
  }

  const fromMobile = readApiUrlFromFile(path.join(__dirname, 'deploy.api.json'));
  if (fromMobile) return fromMobile;

  if (fallbackFromAppJson && !BLOCKED.test(fallbackFromAppJson)) {
    return fallbackFromAppJson.replace(/\/$/, '');
  }

  return LIVE_API_URL;
}

/**
 * Sub-path for the web admin export (`EXPO_WEB_BASE_URL=/admin`, set by `npm run export:web-admin`) →
 * `experiments.baseUrl`. Unset → no baseUrl at all: this config is shared by every platform, so iOS /
 * Android builds and `expo start` stay exactly as before.
 */
function resolveWebBaseUrl() {
  const raw = (process.env.EXPO_WEB_BASE_URL || '').trim().replace(/^\/+|\/+$/g, '');
  return raw ? `/${raw}` : undefined;
}

const appJson = require('./app.json');

// Production EAS builds restrict cleartext HTTP to the live API host (see plugins/withCleartextTraffic.js).
const IS_PRODUCTION_BUILD = process.env.EAS_BUILD_PROFILE === 'production';
const LIVE_API_HOST = new URL(LIVE_API_URL).hostname;

/** @param {{ config: import('expo/config').ExpoConfig }} ctx */
module.exports = ({ config }) => {
  const base = appJson.expo;
  const fallbackExtra =
    typeof base.extra?.apiUrl === 'string' ? base.extra.apiUrl.trim() : undefined;
  const apiUrl = resolveDeployApiUrl(fallbackExtra);
  const webBaseUrl = resolveWebBaseUrl();

  process.env.EXPO_PUBLIC_API_URL = apiUrl;

  return {
    ...config,
    ...base,
    // Web admin export only (see resolveWebBaseUrl): every script/asset URL gets the sub-path prefix.
    ...(webBaseUrl
      ? { experiments: { ...(config.experiments ?? {}), ...(base.experiments ?? {}), baseUrl: webBaseUrl } }
      : {}),
    android: {
      ...(base.android ?? {}),
      ...(config.android ?? {}),
      usesCleartextTraffic: !IS_PRODUCTION_BUILD,
    },
    ios: {
      ...(base.ios ?? {}),
      ...(config.ios ?? {}),
      infoPlist: {
        ...(base.ios?.infoPlist ?? {}),
        ...(config.ios?.infoPlist ?? {}),
        NSAppTransportSecurity: IS_PRODUCTION_BUILD
          ? {
              NSExceptionDomains: {
                [LIVE_API_HOST]: { NSExceptionAllowsInsecureHTTPLoads: true },
              },
            }
          : { NSAllowsArbitraryLoads: true },
      },
    },
    plugins: (() => {
      const list = Array.isArray(base.plugins) ? [...base.plugins] : [];
      const hasCleartext = list.some(
        (p) =>
          p === './plugins/withCleartextTraffic' ||
          (typeof p === 'string' && p.includes('withCleartextTraffic')),
      );
      if (!hasCleartext) list.push('./plugins/withCleartextTraffic');
      return list;
    })(),
    extra: {
      ...(base.extra ?? {}),
      ...(config.extra ?? {}),
      apiUrl,
    },
  };
};
