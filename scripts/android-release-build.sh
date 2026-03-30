#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHS="${E2E_ANDROID_ABIS:-}"

cd "$ROOT_DIR/android"
if [[ -n "$ARCHS" ]]; then
  ./gradlew --no-daemon assembleRelease -PreactNativeArchitectures="$ARCHS"
else
  ./gradlew --no-daemon assembleRelease
fi
