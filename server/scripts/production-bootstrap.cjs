#!/usr/bin/env node
/**
 * When Render runs `npm run dev` → `tsx watch src/index.ts` with NODE_ENV=production,
 * redirect to the compiled server so deploy works without dashboard changes.
 */
const { spawnSync, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

if (process.env.NODE_ENV !== 'production') {
  return;
}

const viaTsx = process.argv.some((a) => /tsx/.test(a));
if (!viaTsx) {
  return;
}

const serverRoot = path.join(__dirname, '..');
const distEntry = path.join(serverRoot, 'dist', 'index.js');

function ensureDist() {
  if (fs.existsSync(distEntry)) return;
  console.log('[bootstrap] Building dist for production...');
  execSync('npm install --include=dev --no-audit --no-fund', {
    cwd: serverRoot,
    stdio: 'inherit',
    env: process.env,
  });
  execSync('npm run build', { cwd: serverRoot, stdio: 'inherit', env: process.env });
}

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

try {
  ensureJwt();
  ensureDist();
  if (!fs.existsSync(distEntry)) {
    console.error('[bootstrap] dist/index.js still missing after build.');
    process.exit(1);
  }
  console.log('[bootstrap] Production mode: starting node dist/index.js (not tsx)');
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
