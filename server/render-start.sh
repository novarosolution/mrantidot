#!/usr/bin/env bash
# Render Start Command: bash render-start.sh
set -euo pipefail
if [ ! -f dist/index.js ]; then
  echo "[render-start] ERROR: dist/index.js missing."
  echo "Set Build Command to: bash render-build.sh"
  echo "  (or: npm install --include=dev && npm run build)"
  exit 1
fi
echo "[render-start] Starting production server..."
exec node dist/index.js
