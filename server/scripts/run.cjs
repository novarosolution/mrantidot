#!/usr/bin/env node
/**
 * Local: tsx watch. Render: compiled production server (works when dashboard uses `npm run dev`).
 */
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const onRender = Boolean(
  process.env.RENDER ||
    process.env.RENDER_SERVICE_ID ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RENDER_EXTERNAL_HOSTNAME,
);
const distEntry = path.join(process.cwd(), 'dist', 'index.js');

if (onRender) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  if (!fs.existsSync(distEntry)) {
    console.log('[render] dist/index.js missing — building...');
    execSync('bash render-build.sh', {
      cwd: serverRoot,
      stdio: 'inherit',
      env: { ...process.env, NPM_CONFIG_WORKSPACES: 'false' },
    });
  }

  console.log('[render] Starting API (production)...');
  const child = spawn('node', [distEntry], { stdio: 'inherit', env: process.env });
  child.on('exit', (code) => process.exit(code ?? 1));
  return;
}

const child = spawn(
  'npx',
  ['tsx', 'watch', 'src/index.ts'],
  { stdio: 'inherit', env: process.env, shell: true },
);
child.on('exit', (code) => process.exit(code ?? 1));
