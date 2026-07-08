#!/usr/bin/env bash
# Remove macOS AppleDouble sidecars (._*) that break Metro/expo-router on exFAT volumes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PRUNE=(
  -path '*/node_modules/*'
  -o -path '*/.git/*'
  -o -path '*/dist/*'
  -o -path '*/build/*'
)

if command -v dot_clean >/dev/null 2>&1; then
  for dir in \
    "$ROOT/mobile" \
    "$ROOT/mobile/app" \
    "$ROOT/mobile/.expo" \
    "$ROOT/mobile/components" \
    "$ROOT/mobile/lib" \
    "$ROOT/mobile/context" \
    "$ROOT/mobile/constants" \
    "$ROOT/server/src" \
    "$ROOT/server/test" \
    "$ROOT/scripts"
  do
    if [[ -d "$dir" ]]; then
      dot_clean -m "$dir" 2>/dev/null || true
    fi
  done
fi

count=0
while IFS= read -r -d '' file; do
  rm -f "$file"
  count=$((count + 1))
done < <(
  find "$ROOT" \( "${PRUNE[@]}" \) -prune -o -name '._*' -type f -print0 2>/dev/null
)

# Remove macOS folder metadata files that sometimes appear beside routes.
ds_count=0
while IFS= read -r -d '' file; do
  rm -f "$file"
  ds_count=$((ds_count + 1))
done < <(
  find "$ROOT/mobile" \( "${PRUNE[@]}" \) -prune -o -name '.DS_Store' -type f -print0 2>/dev/null
)

total=$((count + ds_count))
if [[ "$total" -gt 0 ]]; then
  echo "Removed ${count} AppleDouble sidecar(s) and ${ds_count} .DS_Store file(s)."
fi
