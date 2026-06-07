#!/usr/bin/env node
/** Local dev: tsx watch. Render fallback: node dist/index.js (if Start = npm run dev). */
require('./production-bootstrap.cjs');

const { spawn } = require('node:child_process');

const child = spawn(
  'npx',
  ['tsx', 'watch', 'src/index.ts'],
  { stdio: 'inherit', env: process.env, shell: true },
);
child.on('exit', (code) => process.exit(code ?? 1));
