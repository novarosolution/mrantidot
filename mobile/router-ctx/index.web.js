export const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  /^(?:\.\/)(?!\._)(?!.*\/\._)(?!(?:(?:(?:.*\+api)|(?:\+middleware)|(?:\+(html|native-intent))))\.[tj]sx?$).*(?:\.android|\.ios|\.native)?\.[tj]sx?$/,
  process.env.EXPO_ROUTER_IMPORT_MODE,
);
