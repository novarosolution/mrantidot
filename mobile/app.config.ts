import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveDeployApiUrl } = require('../scripts/resolve-deploy-api-url.cjs') as {
  resolveDeployApiUrl: () => string | undefined;
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = resolveDeployApiUrl();

  if (apiUrl) {
    process.env.EXPO_PUBLIC_API_URL = apiUrl;
  }

  const base = appJson.expo as ExpoConfig;

  return {
    ...config,
    ...base,
    extra: {
      ...(base.extra ?? {}),
      ...(config.extra ?? {}),
      apiUrl: apiUrl ?? null,
    },
  };
};
