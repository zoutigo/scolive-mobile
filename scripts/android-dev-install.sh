#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADB_BIN="${ADB_BIN:-$HOME/Android/Sdk/platform-tools/adb}"
APP_ID="com.zoutigo.scoliveapp"
APK_PATH="${1:-$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk}"
REMOTE_APK="/data/local/tmp/scolive-debug.apk"

if [ ! -f "$APK_PATH" ]; then
  echo "APK introuvable: $APK_PATH" >&2
  exit 1
fi

find_emulator() {
  "$ADB_BIN" devices | awk '/^emulator-/{print $1; exit}'
}

wait_for_device_ready() {
  local serial="${1:-}"
  local i

  for i in $(seq 1 180); do
    if [ -n "$serial" ] \
      && "$ADB_BIN" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' | grep -qx '1' \
      && "$ADB_BIN" -s "$serial" shell service check package 2>/dev/null | grep -q 'found'; then
      return 0
    fi

    sleep 2
    serial="$(find_emulator)"
  done

  return 1
}

apply_dev_tuning() {
  local serial="$1"

  "$ADB_BIN" -s "$serial" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true

  "$ADB_BIN" -s "$serial" shell settings put global verifier_verify_adb_installs 0 >/dev/null 2>&1 || true
  "$ADB_BIN" -s "$serial" shell settings put global package_verifier_enable 0 >/dev/null 2>&1 || true
  "$ADB_BIN" -s "$serial" shell settings put global upload_apk_enable 0 >/dev/null 2>&1 || true

  "$ADB_BIN" -s "$serial" shell settings put global window_animation_scale 0 >/dev/null 2>&1 || true
  "$ADB_BIN" -s "$serial" shell settings put global transition_animation_scale 0 >/dev/null 2>&1 || true
  "$ADB_BIN" -s "$serial" shell settings put global animator_duration_scale 0 >/dev/null 2>&1 || true

  for pkg in \
    com.google.android.youtube \
    com.google.android.apps.messaging \
    com.google.android.apps.wellbeing \
    com.android.chrome \
    com.google.android.googlequicksearchbox
  do
    "$ADB_BIN" -s "$serial" shell pm disable-user --user 0 "$pkg" >/dev/null 2>&1 || true
    "$ADB_BIN" -s "$serial" shell am force-stop "$pkg" >/dev/null 2>&1 || true
  done
}

install_apk() {
  local serial="$1"
  local install_pid
  local i

  "$ADB_BIN" -s "$serial" push "$APK_PATH" "$REMOTE_APK" >/dev/null

  (
    "$ADB_BIN" -s "$serial" shell pm install -r "$REMOTE_APK" >/tmp/scolive-android-install.log 2>&1 || true
  ) &
  install_pid=$!

  for i in $(seq 1 90); do
    if "$ADB_BIN" -s "$serial" shell pm path "$APP_ID" >/dev/null 2>&1; then
      kill "$install_pid" >/dev/null 2>&1 || true
      wait "$install_pid" 2>/dev/null || true
      return 0
    fi

    sleep 2
  done

  wait "$install_pid" 2>/dev/null || true

  echo "Installation Android incomplète." >&2
  if [ -f /tmp/scolive-android-install.log ]; then
    tail -n 50 /tmp/scolive-android-install.log >&2 || true
  fi
  return 1
}

SERIAL="$(find_emulator)"

if [ -z "$SERIAL" ]; then
  echo "Aucun émulateur Android détecté." >&2
  exit 1
fi

echo "Emulateur détecté: $SERIAL"

if ! wait_for_device_ready "$SERIAL"; then
  echo "L'émulateur n'est pas prêt: boot Android ou service package indisponible." >&2
  exit 1
fi

apply_dev_tuning "$SERIAL"
install_apk "$SERIAL"

echo "APK installé sur $SERIAL"
