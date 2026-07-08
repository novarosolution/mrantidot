#!/usr/bin/env bash
# Run typechecks and API integration tests against a running server on :4001.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:4001}"

echo "=== Mr Antidot test suite ==="
echo "BASE_URL=${BASE_URL}"
echo

bash "$ROOT/scripts/clean-appledouble.sh"

echo "--- Server TypeScript ---"
(cd "$ROOT/server" && npx tsc --noEmit)
echo "OK"

echo "--- Mobile TypeScript ---"
(cd "$ROOT/mobile" && npx tsc --noEmit)
echo "OK"

echo "--- API health ---"
if ! curl -sf "${BASE_URL}/api/health" >/dev/null; then
  echo "ERROR: Server not reachable at ${BASE_URL}"
  echo "Start it with: npm run dev:server"
  exit 1
fi
echo "OK"

echo "--- Auth integration ---"
bash "$ROOT/server/test/auth.sh"
echo

echo "--- Booking flow integration ---"
bash "$ROOT/server/test/flow.sh"
echo

echo "--- Extended API features ---"
bash "$ROOT/server/test/features.sh"
echo

echo "=== All tests passed ==="
