#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export NODE_ENV=development

cd "$ROOT_DIR/android"
./gradlew assembleDebug -PreactNativeArchitectures=x86_64

bash "$ROOT_DIR/scripts/android-dev-install.sh"
