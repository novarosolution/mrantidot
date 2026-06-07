#!/usr/bin/env bash
# Render Start Command: npm start  (or bash render-start.sh)
# Tuned for Render free tier — 512MB Node heap leaves headroom on 2GB instances.
set -euo pipefail
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"
if [ ! -f dist/index.js ]; then
  echo "[render-start] ERROR: dist/index.js missing — run bash render-build.sh first"
  exit 1
fi
echo "[render-start] NODE_OPTIONS=${NODE_OPTIONS}"
exec node dist/index.js
