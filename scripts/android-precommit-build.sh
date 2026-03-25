#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
PRECOMMIT_GRADLE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}/scolive-mobile/gradle-precommit"

export NODE_ENV=development
export GRADLE_USER_HOME="$PRECOMMIT_GRADLE_HOME"

mkdir -p "$PRECOMMIT_GRADLE_HOME"

cd "$ANDROID_DIR"

./gradlew \
  --no-daemon \
  assembleDebug \
  -PreactNativeArchitectures=x86_64
