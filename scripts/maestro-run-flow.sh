#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLOW_NAME="${1:?usage: maestro-run-flow.sh <flow-name> [maestro args...]}"
shift || true

FLOW_PATH="$ROOT_DIR/.maestro/flows/${FLOW_NAME}.yaml"
MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
MOCK_SERVER_MODULE="$ROOT_DIR/.maestro/mock-server/server.js"
MOCK_PID=""

if [[ ! -f "$FLOW_PATH" ]]; then
  echo "[maestro] flow introuvable: $FLOW_PATH" >&2
  exit 1
fi

if [[ ! -x "$MAESTRO_BIN" ]]; then
  echo "[maestro] CLI introuvable. Lance d'abord: npm run maestro:install" >&2
  exit 1
fi

cleanup() {
  if [[ -n "$MOCK_PID" ]]; then
    kill "$MOCK_PID" >/dev/null 2>&1 || true
    wait "$MOCK_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

wait_for_health() {
  local retries="${1:-40}"
  for _ in $(seq 1 "$retries"); do
    if curl -fsS "http://localhost:3001/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  echo "[maestro] mock server indisponible sur http://localhost:3001" >&2
  return 1
}

start_mock_server() {
  if curl -fsS "http://localhost:3001/api/health" >/dev/null 2>&1; then
    return 0
  fi

  node -e "const { startMockServer } = require('$MOCK_SERVER_MODULE'); startMockServer(3001).catch((error) => { console.error(error); process.exit(1); });" \
    >/tmp/scolive-maestro-mock.log 2>&1 &
  MOCK_PID=$!
  wait_for_health
}

set_scenario() {
  local path="$1"
  local scenario="$2"

  curl -fsS \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"scenario\":\"${scenario}\"}" \
    "http://localhost:3001${path}" \
    >/dev/null
}

start_mock_server

set_scenario "/__scenario" "${PHONE_LOGIN_SCENARIO:-happy_path}"
set_scenario "/__scenario/email-login" "${EMAIL_LOGIN_SCENARIO:-happy_path}"
set_scenario "/__scenario/onboarding" "${ONBOARDING_SCENARIO:-email_parent_happy}"
set_scenario "/__scenario/pin" "${PIN_SCENARIO:-happy_path}"
set_scenario "/__scenario/password" "${PASSWORD_SCENARIO:-happy_path}"

dismiss_system_anr() {
  local dumpsys_output=""

  for _ in $(seq 1 10); do
    dumpsys_output="$(adb shell dumpsys window displays 2>/dev/null || true)"
    if [[ "$dumpsys_output" != *"Application Not Responding: system"* ]]; then
      return 0
    fi

    adb shell input tap 360 860 >/dev/null 2>&1 || true
    sleep 1
  done

  return 0
}

adb shell am force-stop com.zoutigo.scoliveapp >/dev/null 2>&1 || true
adb shell pm clear com.zoutigo.scoliveapp >/dev/null 2>&1 || true
adb shell monkey -p com.zoutigo.scoliveapp -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
sleep 2
dismiss_system_anr

"$MAESTRO_BIN" test "$FLOW_PATH" "$@"
