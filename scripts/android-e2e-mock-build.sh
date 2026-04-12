#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export NODE_ENV=development
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://10.0.2.2:3001/api}"

echo "[e2e-mock] Build debug avec EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}"

cd "$ROOT_DIR/android"
./gradlew assembleDebug -PreactNativeArchitectures=x86_64

bash "$ROOT_DIR/scripts/android-dev-install.sh"
