const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getDefaultConfig } = require('expo/metro-config');

function cleanAppleDouble() {
  try {
    execSync('bash scripts/clean-appledouble.sh', {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore',
    });
  } catch {
    // non-fatal
  }
}

cleanAppleDouble();

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const isAppleDouble = (filePath) => {
  const base = path.basename(filePath);
  return base.startsWith('._') || base === '.DS_Store';
};

const appleDoubleBlock = /[/\\]\._[^/\\]+$/;
const dsStoreBlock = /[/\\]\.DS_Store$/;

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  appleDoubleBlock,
  dsStoreBlock,
];

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      if (req.url && (/\/\._[^/?#]+/.test(req.url) || req.url.includes('.DS_Store'))) {
        res.statusCode = 404;
        res.end('');
        return;
      }
      return metroMiddleware(req, res, next);
    };
  },
};

function resolveRouterCtx(platform) {
  const suffix =
    platform === 'android' ? '.android' : platform === 'ios' ? '.ios' : platform === 'web' ? '.web' : '';
  const candidates = [
    path.resolve(__dirname, `router-ctx/index${suffix}.js`),
    path.resolve(__dirname, 'router-ctx/index.js'),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return { type: 'sourceFile', filePath };
    }
  }
  return null;
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-router/_ctx') {
    const shim = resolveRouterCtx(platform);
    if (shim) return shim;
  }

  if (isAppleDouble(moduleName) || moduleName.includes('/._') || moduleName.includes('\\._')) {
    return { type: 'empty' };
  }

  const resolve =
    defaultResolveRequest ??
    ((ctx, name, plt) => ctx.resolveRequest(ctx, name, plt));

  const result = resolve(context, moduleName, platform);
  if (result?.filePath && isAppleDouble(result.filePath)) {
    return { type: 'empty' };
  }
  return result;
};

module.exports = config;
