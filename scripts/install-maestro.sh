#!/usr/bin/env bash

set -euo pipefail

MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
VERSION="${1:-}"

if [[ -x "$MAESTRO_BIN" ]]; then
  "$MAESTRO_BIN" --version
  exit 0
fi

if [[ -n "$VERSION" ]]; then
  curl -fsSL "https://get.maestro.mobile.dev" | bash -s -- "$VERSION"
else
  curl -fsSL "https://get.maestro.mobile.dev" | bash
fi

"$MAESTRO_BIN" --version
