#!/usr/bin/env node
/**
 * Web admin export for hosting under a sub-path of a domain (default `/admin`, e.g. https://mrantidot.com/admin).
 *
 *   npm run export:web-admin                     → dist/admin/{index.html,_expo,assets,favicon.ico,robots.txt}
 *   EXPO_WEB_BASE_URL=/panel npm run export:web-admin
 *   npm run export:web-admin -- --clear          (extra arguments go to `expo export`)
 *
 * `EXPO_WEB_BASE_URL` turns on `experiments.baseUrl` in app.config.js, so the export prefixes every script,
 * stylesheet, favicon and asset URL with the base path and expo-router adds / strips it from page URLs.
 * The files themselves stay at the export root, so we export straight into dist/<base> and the whole of
 * dist/ is served as-is (mobile/vercel.json). Only dist/ is written or removed.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');

function fail(message) {
  console.error(`\n[export:web-admin] ${message}`);
  process.exit(1);
}

const segment = (process.env.EXPO_WEB_BASE_URL ?? '/admin').trim().replace(/^\/+|\/+$/g, '');
if (!segment || !/^[A-Za-z0-9._~/-]+$/.test(segment) || segment.split('/').includes('..')) {
  fail(`EXPO_WEB_BASE_URL must be a sub-path such as /admin (got "${process.env.EXPO_WEB_BASE_URL}").`);
}
const baseUrl = `/${segment}`;
const outDir = path.join(distDir, ...segment.split('/'));

fs.rmSync(distDir, { recursive: true, force: true });

console.log(`[export:web-admin] Exporting the web admin under ${baseUrl} → ${path.relative(projectRoot, outDir)}/`);
const result = spawnSync(
  'npx',
  ['expo', 'export', '--platform', 'web', '--output-dir', path.relative(projectRoot, outDir), ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, EXPO_WEB_BASE_URL: baseUrl },
    shell: process.platform === 'win32',
  },
);
if (result.error) fail(`Could not run expo export: ${result.error.message}`);
if (result.status !== 0) process.exit(result.status ?? 1);

const indexFile = path.join(outDir, 'index.html');
if (!fs.existsSync(indexFile)) fail(`${path.relative(projectRoot, indexFile)} was not written.`);
const html = fs.readFileSync(indexFile, 'utf8');
if (!html.includes(`${baseUrl}/_expo/static/`)) {
  fail(`index.html does not load its scripts from ${baseUrl}/_expo/static/ — is experiments.baseUrl applied (app.config.js)?`);
}

// The admin deployment's own domain answers /robots.txt too (the copy under the base path stays).
const robots = path.join(outDir, 'robots.txt');
if (fs.existsSync(robots)) fs.copyFileSync(robots, path.join(distDir, 'robots.txt'));

console.log(`[export:web-admin] Done: serve dist/ as-is; the admin opens at ${baseUrl}.`);
