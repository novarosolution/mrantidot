// Custom expo-router context — excludes macOS AppleDouble sidecars (._*) on exFAT volumes.
export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  /^(?:\.\/)(?!\._)(?!.*\/\._)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*\.[tj]sx?$/,
);
