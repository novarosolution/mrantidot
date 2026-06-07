#!/usr/bin/env node
/**
 * Production handoff for misconfigured Render (Start = npm run dev / tsx).
 * Exits the process after spawning node dist/index.js — tsx must not continue.
 */
const { spawnSync, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const isProd = process.env.NODE_ENV === 'production';
const onRender = Boolean(
  process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RENDER_EXTERNAL_HOSTNAME,
);
const viaTsx = process.argv.some((a) => /tsx/.test(a));
const viaNpmDev = process.env.npm_lifecycle_event === 'dev';

if (!isProd || (!viaTsx && !viaNpmDev && !onRender)) {
  module.exports = {};
  return;
}

const serverRoot = path.join(__dirname, '..');
const distEntry = path.join(serverRoot, 'dist', 'index.js');

function ensureJwt() {
  const jwt = process.env.JWT_SECRET?.trim();
  if (jwt && jwt !== 'supersecret_change_me') return;
  const seed = [
    process.env.RENDER_SERVICE_ID,
    process.env.RENDER_GIT_COMMIT,
    process.env.RENDER_EXTERNAL_HOSTNAME,
    process.env.HOSTNAME,
  ]
    .filter(Boolean)
    .join('_');
  process.env.JWT_SECRET = `jwt_${seed || 'mrantidot_prod'}`;
  console.warn(
    '[bootstrap] JWT_SECRET was unset — using auto-generated value. Set JWT_SECRET in Render → Environment.',
  );
}

function ensureDist() {
  if (fs.existsSync(distEntry)) return;
  console.log('[bootstrap] Building dist for production...');
  execSync('bash render-build.sh', {
    cwd: serverRoot,
    stdio: 'inherit',
    env: { ...process.env, NPM_CONFIG_WORKSPACES: 'false' },
  });
}

try {
  ensureJwt();
  ensureDist();
  if (!fs.existsSync(distEntry)) {
    console.error('[bootstrap] dist/index.js still missing after build.');
    process.exit(1);
  }
  console.log('[bootstrap] Production: starting node dist/index.js');
  const result = spawnSync('node', [distEntry], {
    cwd: serverRoot,
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(result.status ?? 1);
} catch (err) {
  console.error('[bootstrap] Failed:', err);
  process.exit(1);
}
