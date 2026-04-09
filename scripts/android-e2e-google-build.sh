#!/usr/bin/env bash
# Build release APK pour le flow e2e Google Auth complet.
# Pointe EXPO_PUBLIC_WEB_URL vers le mock server (port 3001) au lieu du vrai
# web app, afin que le Chrome Custom Tab ouvre le mock qui redirige
# immédiatement vers scolive://auth/callback sans passer par Google.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export NODE_ENV=production
export EXPO_PUBLIC_WEB_URL="http://10.0.2.2:3001"

echo "[e2e-google] Build release avec EXPO_PUBLIC_WEB_URL=${EXPO_PUBLIC_WEB_URL}"

cd "$ROOT_DIR/android"
./gradlew --no-daemon assembleRelease -PreactNativeArchitectures=x86_64

# Renommer l'APK pour qu'il ne pollue pas l'APK release standard.
# maestro-run-flow.sh utilise ce nom pour le flow auth-google-full.
RELEASE_APK="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
GOOGLE_APK="$ROOT_DIR/android/app/build/outputs/apk/release/app-release-google-e2e.apk"
cp "$RELEASE_APK" "$GOOGLE_APK"
# Restaurer un APK release vierge pour ne pas polluer les autres flows e2e
rm -f "$RELEASE_APK"
echo "[e2e-google] APK sauvegardé : $GOOGLE_APK"
