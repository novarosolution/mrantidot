#!/usr/bin/env node
/** Local dev: tsx watch. Render fallback: node dist/index.js (if Start = npm run dev). */
require('./production-bootstrap.cjs');

const net = require('node:net');
const { spawn } = require('node:child_process');

const port = Number(process.env.PORT) || 4001;

/** A second dev server would fight the first over the local database lock — say so plainly instead. */
const probe = net.connect({ port, host: '127.0.0.1' });
probe.once('connect', () => {
  probe.destroy();
  console.log(
    `\n[server] An API server is already running on port ${port} — nothing to do.\n` +
      `         To restart it, press Ctrl+C in the terminal where it runs, then run this again.\n`,
  );
  process.exit(0);
});
probe.once('error', () => {
  const child = spawn(
    process.execPath,
    [require.resolve('tsx/cli'), 'watch', 'src/index.ts'],
    { stdio: 'inherit', env: process.env, shell: false },
  );
  child.on('exit', (code) => process.exit(code ?? 1));
});
