#!/usr/bin/env bash
# Build Mr Antidot Android APK.
#
# Default: EAS cloud build (works on exFAT / external drives — local Gradle fails on KIOXIA).
# Local:   LOCAL=1 bash scripts/build-apk.sh  (requires project on APFS + Java 17)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE="$ROOT/mobile"
OUT="$ROOT/releases"
APK_NAME="mrantidot-preview.apk"

echo "==> Verify deploy API URL"
node "$ROOT/scripts/check-deploy-config.cjs"

if [[ "${LOCAL:-}" == "1" ]]; then
  echo "==> Local Gradle build (APFS recommended — exFAT breaks Gradle transforms)"
  bash "$ROOT/scripts/clean-appledouble.sh"
  bash "$ROOT/scripts/clean-gradle-appledouble.sh"

  if [[ -z "${JAVA_HOME:-}" ]] && [[ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]]; then
    export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  fi
  if [[ -z "${ANDROID_HOME:-}" ]] && [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  fi
  export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"

  if mount | grep -q "/Volumes/KIOXIA.*exfat"; then
    echo "WARNING: Project is on exFAT (KIOXIA). Local Gradle often fails here."
    echo "         Use cloud build instead: npm run build:apk"
  fi

  cd "$MOBILE"
  npx expo prebuild --platform android --no-install
  cd android
  ./gradlew assembleRelease --no-daemon

  SRC="$MOBILE/android/app/build/outputs/apk/release/app-release.apk"
  mkdir -p "$OUT"
  cp "$SRC" "$OUT/$APK_NAME"
  echo "APK ready: $OUT/$APK_NAME"
  exit 0
fi

echo "==> EAS cloud APK build (profile: preview)"
cd "$MOBILE"

if ! eas whoami >/dev/null 2>&1; then
  echo "ERROR: Run 'eas login' first."
  exit 1
fi

if ! node -e "const j=require('./app.json'); process.exit(j.expo?.extra?.eas?.projectId ? 0 : 1)" 2>/dev/null; then
  echo "==> Linking Expo project to your EAS account"
  eas init --non-interactive
fi

eas build -p android --profile preview --non-interactive

echo ""
echo "When the build finishes, download the APK from the URL above"
echo "or run: eas build:list --platform android --limit 1"
