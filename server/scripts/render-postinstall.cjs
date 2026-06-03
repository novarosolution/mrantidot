#!/usr/bin/env node
/**
 * Runs after `npm install` on Render so a dashboard build of only `npm install`
 * still compiles TypeScript (devDependencies are skipped when NODE_ENV=production).
 */
const { execSync } = require('node:child_process');

const onRender = Boolean(
  process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RENDER_EXTERNAL_HOSTNAME,
);
if (!onRender) {
  process.exit(0);
}

console.log('[render-postinstall] Render detected — installing devDependencies and building...');
try {
  execSync('npm install --include=dev --no-audit --no-fund', {
    stdio: 'inherit',
    env: process.env,
  });
  execSync('npm run build', { stdio: 'inherit', env: process.env });
  console.log('[render-postinstall] Build complete.');
} catch (err) {
  console.error('[render-postinstall] Build failed:', err);
  process.exit(1);
}
