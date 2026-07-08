#!/usr/bin/env bash
# Remove AppleDouble (._*) from node_modules Gradle plugin trees — required for Android builds on exFAT.
# Only removes sidecar files; does NOT delete compiled package output (e.g. expo-modules-autolinking/build).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GRADLE_PATHS=(
  "$ROOT/node_modules/@react-native/gradle-plugin"
  "$ROOT/node_modules/expo-modules-autolinking/android"
  "$ROOT/node_modules/expo-modules-core/android"
  "$ROOT/mobile/android"
)

count=0
for base in "${GRADLE_PATHS[@]}"; do
  [[ -d "$base" ]] || continue
  while IFS= read -r -d '' file; do
    rm -f "$file"
    count=$((count + 1))
  done < <(find "$base" -name '._*' -type f -print0 2>/dev/null)
done

if [[ "$count" -gt 0 ]]; then
  echo "Removed $count AppleDouble sidecar(s) from Gradle paths."
fi
