#!/usr/bin/env bash
# Render Build Command: bash render-build.sh
# Slim build for Render free tier (~70MB server deps, not multi-GB mobile monorepo).
set -euo pipefail

cd "$(dirname "$0")"

export NODE_ENV=development

echo "[render-build] Server-only install (no mobile workspace)..."
rm -rf node_modules

if [ -f package-lock.json ]; then
  npm ci --workspaces=false --include=dev
else
  npm install --workspaces=false --include=dev
fi

echo "[render-build] Compiling TypeScript..."
npm run build
test -f dist/index.js

echo "[render-build] Removing devDependencies to save disk..."
npm prune --workspaces=false --omit=dev

echo "[render-build] OK — dist/index.js ready"
du -sh node_modules dist 2>/dev/null || true
