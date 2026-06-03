#!/usr/bin/env bash
# Render Build Command: bash render-build.sh
set -euo pipefail
echo "[render-build] Installing dependencies (including TypeScript)..."
npm install --include=dev
echo "[render-build] Compiling TypeScript..."
npm run build
test -f dist/index.js
echo "[render-build] OK — dist/index.js ready"
