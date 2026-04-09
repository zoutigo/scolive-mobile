#!/usr/bin/env bash

set -euo pipefail

ADB_BIN="${ADB_BIN:-$HOME/Android/Sdk/platform-tools/adb}"
EMULATOR_FLAG="${EMULATOR_FLAG:-/tmp/scolive-emulator-started.flag}"
EXPO_GO_APK="${EXPO_GO_APK:-$HOME/.expo/android-apk-cache/Expo-Go-55.0.5.apk}"
APP_ID="${APP_ID:-com.zoutigo.scoliveapp}"

stop_existing_expo_server() {
  local port_pid=""
  local port_cmd=""

  port_pid="$(lsof -tiTCP:8081 -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$port_pid" ]]; then
    return 0
  fi

  port_cmd="$(ps -p "$port_pid" -o args= 2>/dev/null || true)"
  if printf "%s" "$port_cmd" | grep -q "expo start"; then
    echo "Stopping existing Expo server on 8081..."
    kill "$port_pid" >/dev/null 2>&1 || true
    sleep 2
  fi
}

wait_for_android_device() {
  local serial=""

  if [[ -f "$EMULATOR_FLAG" ]]; then
    echo "Emulator launch detected, waiting for Android package manager..."
  fi

  for _ in $(seq 1 120); do
    serial="$("$ADB_BIN" devices 2>/dev/null | awk '/^emulator-/{print $1; exit}')"
    if [[ -n "$serial" ]] && timeout 5s "$ADB_BIN" -s "$serial" shell pm list packages >/dev/null 2>&1; then
      rm -f "$EMULATOR_FLAG"
      printf "%s\n" "$serial"
      return 0
    fi
    sleep 2
  done

  rm -f "$EMULATOR_FLAG"
  return 1
}

get_ready_android_serial() {
  wait_for_android_device || true
}

ensure_expo_go_if_needed() {
  local serial="$1"

  if timeout 10s "$ADB_BIN" -s "$serial" shell pm path "$APP_ID" >/dev/null 2>&1; then
    return 0
  fi

  if timeout 10s "$ADB_BIN" -s "$serial" shell pm path host.exp.exponent >/dev/null 2>&1; then
    return 0
  fi

  if [[ -f "$EXPO_GO_APK" ]]; then
    echo "Installing Expo Go on $serial..."
    timeout 90s "$ADB_BIN" -s "$serial" install -r -d --user 0 "$EXPO_GO_APK"
    return 0
  fi

  echo "Expo Go cache not found: $EXPO_GO_APK"
}

open_preferred_android_app() {
  local serial="$1"
  local attempt

  "$ADB_BIN" -s "$serial" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
  # Ports web : localhost:3000 (web) et localhost:3001 (mock) joignables depuis l'émulateur
  "$ADB_BIN" -s "$serial" reverse tcp:3000 tcp:3000 >/dev/null 2>&1 || true
  "$ADB_BIN" -s "$serial" reverse tcp:3001 tcp:3001 >/dev/null 2>&1 || true
  # Réveiller l'écran si verrouillé (snapshot chargé écran éteint)
  "$ADB_BIN" -s "$serial" shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
  "$ADB_BIN" -s "$serial" shell input keyevent KEYCODE_MENU >/dev/null 2>&1 || true

  if timeout 10s "$ADB_BIN" -s "$serial" shell pm path "$APP_ID" >/dev/null 2>&1; then
    # App native présente : fermer Expo Go pour l'empêcher de se connecter à Metro
    "$ADB_BIN" -s "$serial" shell am force-stop host.exp.exponent >/dev/null 2>&1 || true
    # Retry jusqu'à ce que le process soit bien créé (le système peut être occupé après snapshot)
    for attempt in $(seq 1 10); do
      "$ADB_BIN" -s "$serial" shell am start -W -n "$APP_ID/.MainActivity" >/dev/null 2>&1 || \
        "$ADB_BIN" -s "$serial" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
      sleep 2
      if "$ADB_BIN" -s "$serial" shell "ps -A 2>/dev/null | grep -q '$APP_ID'"; then
        return 0
      fi
    done
    return 0
  fi

  "$ADB_BIN" -s "$serial" shell am start \
    -a android.intent.action.VIEW \
    -d "exp://127.0.0.1:8081" \
    host.exp.exponent >/dev/null 2>&1 || true
}

wait_for_metro() {
  local retries="${1:-90}"
  for _ in $(seq 1 "$retries"); do
    if curl -fsS "http://localhost:8081/status" 2>/dev/null | grep -q "packager-status:running"; then
      return 0
    fi
    sleep 1
  done
  return 1
}

app_js_loaded() {
  local serial="$1"
  "$ADB_BIN" -s "$serial" shell "logcat -d 2>/dev/null" \
    | grep -q "ReactNativeJS: Running" 2>/dev/null
}

bootstrap_android_app() {
  local serial=""
  local attempt

  for _ in $(seq 1 120); do
    serial="$(get_ready_android_serial)"
    if [[ -z "$serial" ]]; then
      sleep 2
      continue
    fi

    if ! "$ADB_BIN" -s "$serial" get-state >/dev/null 2>&1; then
      sleep 2
      continue
    fi

    "$ADB_BIN" -s "$serial" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
    ensure_expo_go_if_needed "$serial" || true

    # Attendre que Metro soit disponible, puis ouvrir l'app.
    # Si le JS ne charge pas (race condition), forcer-stop et relancer.
    wait_for_metro 90 || true

    for attempt in $(seq 1 5); do
      open_preferred_android_app "$serial"
      # Laisser 12s à l'app pour charger le bundle
      sleep 12
      if app_js_loaded "$serial"; then
        return 0
      fi
      # JS pas chargé : Metro peut ne pas être encore prêt, on relance
      "$ADB_BIN" -s "$serial" shell am force-stop "$APP_ID" >/dev/null 2>&1 || true
      sleep 2
    done

    return 0
  done

  echo "No Android emulator ready."
}

stop_existing_expo_server
(bootstrap_android_app) &
bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/expo-start-raw.sh"
