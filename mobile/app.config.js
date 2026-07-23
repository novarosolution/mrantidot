const fs = require('node:fs');
const path = require('node:path');

const PLACEHOLDER = /REPLACE|YOUR-SERVICE|your-public-api|example\.com/i;

function resolveDeployApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv && !PLACEHOLDER.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '');
  }

  const configPath = path.join(__dirname, '..', 'deploy.config.json');
  try {
    if (fs.existsSync(configPath)) {
      const deploy = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const fromFile = deploy.API_URL?.trim();
      if (fromFile && !PLACEHOLDER.test(fromFile)) {
        return fromFile.replace(/\/$/, '');
      }
    }
  } catch {
    // ignore
  }

  return fromEnv?.replace(/\/$/, '');
}

const appJson = require('./app.json');

/** @param {{ config: import('expo/config').ExpoConfig }} ctx */
module.exports = ({ config }) => {
  const apiUrl = resolveDeployApiUrl();

  if (apiUrl && process.env.NODE_ENV === 'production') {
    process.env.EXPO_PUBLIC_API_URL = apiUrl;
  }

  const base = appJson.expo;

  return {
    ...config,
    ...base,
    extra: {
      ...(base.extra ?? {}),
      ...(config.extra ?? {}),
      apiUrl: apiUrl ?? base.extra?.apiUrl ?? null,
    },
  };
};
