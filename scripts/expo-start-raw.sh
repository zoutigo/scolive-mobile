#!/usr/bin/env bash

set -euo pipefail

exec env \
  NODE_ENV=development \
  EXPO_NO_DEVTOOLS=1 \
  EXPO_USE_FAST_RESOLVER=1 \
  EXPO_NO_METRO_WORKSPACE_ROOT=1 \
  REACT_NATIVE_DEVTOOLS=0 \
  npx expo start --scheme scolive --localhost --max-workers 4
