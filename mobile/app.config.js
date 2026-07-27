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

const appJson = require('./app.json');

/** @param {{ config: import('expo/config').ExpoConfig }} ctx */
module.exports = ({ config }) => {
  const base = appJson.expo;
  const fallbackExtra =
    typeof base.extra?.apiUrl === 'string' ? base.extra.apiUrl.trim() : undefined;
  const apiUrl = resolveDeployApiUrl(fallbackExtra);

  process.env.EXPO_PUBLIC_API_URL = apiUrl;

  return {
    ...config,
    ...base,
    android: {
      ...(base.android ?? {}),
      ...(config.android ?? {}),
      usesCleartextTraffic: true,
    },
    ios: {
      ...(base.ios ?? {}),
      ...(config.ios ?? {}),
      infoPlist: {
        ...(base.ios?.infoPlist ?? {}),
        ...(config.ios?.infoPlist ?? {}),
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    extra: {
      ...(base.extra ?? {}),
      ...(config.extra ?? {}),
      apiUrl,
    },
  };
};
