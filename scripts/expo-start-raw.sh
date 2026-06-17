#!/usr/bin/env bash

set -euo pipefail

ADB_BIN="${ADB_BIN:-$HOME/Android/Sdk/platform-tools/adb}"

_apply_adb_reverses() {
  local serial
  serial="$("$ADB_BIN" devices 2>/dev/null | awk '/^emulator-/{print $1; exit}')"
  if [[ -n "$serial" ]]; then
    "$ADB_BIN" -s "$serial" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
    "$ADB_BIN" -s "$serial" reverse tcp:3000 tcp:3000 >/dev/null 2>&1 || true
    "$ADB_BIN" -s "$serial" reverse tcp:3001 tcp:3001 >/dev/null 2>&1 || true
  fi
}

_watch_adb_reverses() {
  while true; do
    sleep 30
    _apply_adb_reverses 2>/dev/null || true
  done
}

# Apply immediately for any already-connected emulator
_apply_adb_reverses

# Re-apply every 30s in background so tunnels survive adb reconnects
_WATCHER_PID=""
_watch_adb_reverses &
_WATCHER_PID=$!
trap '[[ -n "$_WATCHER_PID" ]] && kill "$_WATCHER_PID" 2>/dev/null || true' EXIT

env \
  NODE_ENV=development \
  EXPO_NO_DEVTOOLS=1 \
  EXPO_USE_FAST_RESOLVER=1 \
  EXPO_NO_METRO_WORKSPACE_ROOT=1 \
  REACT_NATIVE_DEVTOOLS=0 \
  npx expo start --scheme scolive --localhost --max-workers 4 "$@"
