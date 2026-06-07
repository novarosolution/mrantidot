#!/usr/bin/env node
/** Build dist on Render when dashboard Build Command is only `npm install`. */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const onRender = Boolean(
  process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RENDER_EXTERNAL_HOSTNAME,
);
if (!onRender) process.exit(0);

const dist = path.join(__dirname, '..', 'dist', 'index.js');
if (fs.existsSync(dist)) process.exit(0);

console.log('[render-postinstall] Building dist (standalone server)...');
execSync('npm run build', {
  stdio: 'inherit',
  env: { ...process.env, NPM_CONFIG_WORKSPACES: 'false' },
});
