#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLOW_NAME="${1:?usage: maestro-run-flow.sh <flow-name> [maestro args...]}"
shift || true

FLOW_PATH="$ROOT_DIR/.maestro/flows/${FLOW_NAME}.yaml"
MAESTRO_BIN="${MAESTRO_BIN:-$HOME/.maestro/bin/maestro}"
MAESTRO_DEVICE_ARGS=()
ADB_BIN="${ADB_BIN:-$HOME/Android/Sdk/platform-tools/adb}"
ADB_ARGS=()
MOCK_SERVER_MODULE="$ROOT_DIR/.maestro/mock-server/server.js"
APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/release/app-release.apk"
GOOGLE_E2E_APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/release/app-release-google-e2e.apk"
DEBUG_APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
SELECTED_APK_PATH=""
MOCK_PID=""
APP_ID="com.zoutigo.scoliveapp"
REMOTE_APK="/data/local/tmp/scolive-e2e.apk"
GOOGLE_SSO_PROVIDER_ACCOUNT_ID="${GOOGLE_SSO_PROVIDER_ACCOUNT_ID:-114665872120651017460}"
GOOGLE_SSO_EMAIL="${GOOGLE_SSO_EMAIL:-plizaweb@gmail.com}"
GOOGLE_SSO_FIRST_NAME="${GOOGLE_SSO_FIRST_NAME:-Valery}"
GOOGLE_SSO_LAST_NAME="${GOOGLE_SSO_LAST_NAME:-MBELE}"
IS_MOCK_SERVER=0

if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  ADB_ARGS=(-s "$ANDROID_SERIAL")
fi

adb_cmd() {
  "$ADB_BIN" "${ADB_ARGS[@]}" "$@"
}

adb_shell_timeout() {
  local seconds="$1"
  shift
  timeout "${seconds}s" "$ADB_BIN" "${ADB_ARGS[@]}" shell "$@" >/dev/null 2>&1 || true
}

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

seed_messaging_fixtures() {
  local tmp_dir=""
  tmp_dir="$(mktemp -d)"

  base64 -d >"$tmp_dir/e2e-inline-image.png" <<'EOF'
iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAb0lEQVR4nO3PQQ0AIBDAMMC/5yFjRxMFfXpn5g5A7zWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfY5GAOQO2vByAAAAAElFTkSuQmCC
EOF

  cat >"$tmp_dir/e2e-message-attachment.pdf" <<'EOF'
%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 18 Tf 40 80 Td (E2E attachment) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000061 00000 n 
0000000118 00000 n 
0000000207 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF
EOF

  adb_cmd shell rm -f /sdcard/Pictures/e2e-inline-image.png >/dev/null 2>&1 || true
  adb_cmd shell rm -f /sdcard/Download/e2e-message-attachment.pdf >/dev/null 2>&1 || true
  adb_cmd push "$tmp_dir/e2e-inline-image.png" /sdcard/Pictures/e2e-inline-image.png >/dev/null
  adb_cmd push "$tmp_dir/e2e-message-attachment.pdf" /sdcard/Download/e2e-message-attachment.pdf >/dev/null
  adb_cmd shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/e2e-inline-image.png >/dev/null 2>&1 || true
  rm -rf "$tmp_dir"
}

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

detect_mock_server() {
  local status=""
  status="$(curl -fsS "http://localhost:3001/api/health" 2>/dev/null | grep -o '"status":"[^"]*"' | head -n1 | cut -d: -f2 | tr -d '"')"
  if [[ "$status" == "mock-ok" ]]; then
    IS_MOCK_SERVER=1
  else
    IS_MOCK_SERVER=0
  fi
}

wait_for_android_device() {
  adb_cmd wait-for-device >/dev/null 2>&1

  local retries="${1:-90}"
  local boot_completed=""
  local package_state=""

  for _ in $(seq 1 "$retries"); do
    boot_completed="$(
      timeout 10s "$ADB_BIN" "${ADB_ARGS[@]}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r'
    )"
    package_state="$(
      timeout 10s "$ADB_BIN" "${ADB_ARGS[@]}" shell pm path android 2>/dev/null || true
    )"

    if [[ "$boot_completed" == "1" && "$package_state" == package:* ]]; then
      return 0
    fi

    sleep 2
  done

  echo "[maestro] appareil Android non prêt" >&2
  return 1
}

apply_e2e_device_tuning() {
  adb_cmd reverse tcp:3001 tcp:3001 >/dev/null 2>&1 || true
  adb_cmd shell settings put global verifier_verify_adb_installs 0 >/dev/null 2>&1 || true
  adb_cmd shell settings put global package_verifier_enable 0 >/dev/null 2>&1 || true
  adb_cmd shell settings put global upload_apk_enable 0 >/dev/null 2>&1 || true
}

install_selected_apk() {
  if timeout 180s "$ADB_BIN" "${ADB_ARGS[@]}" install -r "$SELECTED_APK_PATH" \
    >/tmp/scolive-maestro-install.log 2>&1; then
    return 0
  fi

  echo "[maestro] installation Android incomplète" >&2
  if [[ -f /tmp/scolive-maestro-install.log ]]; then
    tail -n 50 /tmp/scolive-maestro-install.log >&2 || true
  fi
  return 1
}

start_mock_server() {
  if curl -fsS "http://localhost:3001/api/health" >/dev/null 2>&1; then
    detect_mock_server
    return 0
  fi

  node -e "const { startMockServer } = require('$MOCK_SERVER_MODULE'); startMockServer(3001).catch((error) => { console.error(error); process.exit(1); });" \
    >/tmp/scolive-maestro-mock.log 2>&1 &
  MOCK_PID=$!
  wait_for_health
  detect_mock_server
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

reset_mock_state() {
  if [[ "$IS_MOCK_SERVER" != "1" ]]; then
    return 0
  fi
  curl -fsS -X POST "http://localhost:3001/__reset" >/dev/null
}

cleanup_stale_maestro_port() {
  local pid=""
  pid="$(lsof -tiTCP:7001 -sTCP:LISTEN 2>/dev/null || true)"

  if [[ -z "$pid" ]]; then
    return 0
  fi

  if ps -p "$pid" -o cmd= 2>/dev/null | grep -q "maestro.cli.AppKt"; then
    echo "[maestro] fermeture d'une ancienne session bloquée sur le port 7001 (pid=$pid)" >&2
    kill "$pid" >/dev/null 2>&1 || true
    sleep 1
  fi
}

select_apk_path() {
  # auth-google-full utilise exclusivement son APK dédié (URL mockée baked-in)
  if [[ "$FLOW_NAME" == "auth-google-full" ]]; then
    if [[ -f "$GOOGLE_E2E_APK_PATH" ]]; then
      SELECTED_APK_PATH="$GOOGLE_E2E_APK_PATH"
    else
      echo "[maestro] APK Google e2e introuvable. Lance d'abord: npm run e2e:build:google" >&2
      exit 1
    fi
    return 0
  fi

  local release_exists=0
  local debug_exists=0

  [[ -f "$APK_PATH" ]] && release_exists=1
  [[ -f "$DEBUG_APK_PATH" ]] && debug_exists=1

  if [[ "$release_exists" == "1" && "$debug_exists" == "1" ]]; then
    # Les flows Maestro doivent privilégier un APK autonome.
    # Le debug dépend de Metro et casse les E2E s'il n'est pas lancé.
    SELECTED_APK_PATH="$APK_PATH"
    return 0
  fi

  if [[ "$release_exists" == "1" ]]; then
    SELECTED_APK_PATH="$APK_PATH"
    return 0
  fi

  if [[ "$debug_exists" == "1" ]]; then
    SELECTED_APK_PATH="$DEBUG_APK_PATH"
    return 0
  fi
}

assert_feed_interactions_state() {
  local payload=""

  payload="$(curl -fsS "http://localhost:3001/__state/feed")"

  node -e '
    const fs = require("fs");
    const payload = JSON.parse(fs.readFileSync(0, "utf8"));
    const feed1 = payload.items.find((item) => item.id === "feed-1");
    const feed2 = payload.items.find((item) => item.id === "feed-2");

    if (!feed1) {
      console.error("[maestro] feed-1 introuvable dans l état mock");
      process.exit(1);
    }

    if (!feed2 || !feed2.poll) {
      console.error("[maestro] feed-2 / poll introuvable dans l état mock");
      process.exit(1);
    }

    const likedOk = feed1.likedByViewer === true && feed1.likesCount === 3;
    const commentOk = Array.isArray(feed1.comments)
      && feed1.comments.some((comment) => comment.text === "Merci pour ce rappel");
    if (!likedOk) {
      console.error("[maestro] like feed invalide", {
        likedByViewer: feed1.likedByViewer,
        likesCount: feed1.likesCount,
      });
      process.exit(1);
    }

    if (!commentOk) {
      console.error("[maestro] commentaire feed introuvable");
      process.exit(1);
    }
  ' <<<"$payload"
}

open_google_auth_callback() {
  open_android_deep_link \
    "scolive:///auth/callback?providerAccountId=${GOOGLE_SSO_PROVIDER_ACCOUNT_ID}&email=${GOOGLE_SSO_EMAIL//@/%40}&firstName=${GOOGLE_SSO_FIRST_NAME}&lastName=${GOOGLE_SSO_LAST_NAME}"
}

assert_discipline_crud_state() {
  local expected_type=""
  local expected_reason=""
  local expected_comment=""
  local expected_justified=""
  local expected_duration=""
  local payload=""

  case "$FLOW_NAME" in
    discipline-crud-absence)
      expected_type="ABSENCE"
      expected_reason="E2E absence"
      expected_comment=""
      expected_justified="false"
      expected_duration="55"
      ;;
    discipline-crud-retard)
      expected_type="RETARD"
      expected_reason="E2E retard"
      expected_comment=""
      expected_justified="true"
      expected_duration="20"
      ;;
    discipline-crud-sanction)
      expected_type="SANCTION"
      expected_reason="E2E sanction"
      expected_comment=""
      expected_justified="null"
      expected_duration="10"
      ;;
    *)
      return 0
      ;;
  esac

  payload="$(curl -fsS "http://localhost:3001/__state/discipline")"

  node -e '
    const fs = require("fs");
    const payload = JSON.parse(fs.readFileSync(0, "utf8"));
    const expectedType = process.argv[1];
    const expectedReason = process.argv[2];
    const expectedComment = process.argv[3];
    const expectedJustified = process.argv[4];
    const expectedDuration = process.argv[5];
    const items = payload.items?.["student-1"];

    if (!Array.isArray(items)) {
      console.error("[maestro] etat discipline mock introuvable pour student-1");
      process.exit(1);
    }

    const match = items.find((item) =>
      item.type === expectedType &&
      item.reason === expectedReason &&
      ((expectedComment === "" && item.comment == null) || item.comment === expectedComment),
    );

    if (!match) {
      console.error("[maestro] evenement discipline attendu introuvable", {
        expectedType,
        expectedReason,
        expectedComment,
      });
      process.exit(1);
    }

    const actualJustified =
      match.justified === null ? "null" : String(match.justified);
    if (actualJustified !== expectedJustified) {
      console.error("[maestro] valeur justified inattendue", {
        expectedJustified,
        actualJustified,
        id: match.id,
      });
      process.exit(1);
    }

    const actualDuration =
      match.durationMinutes === null ? "" : String(match.durationMinutes);
    if (expectedDuration !== "" && actualDuration !== expectedDuration) {
      console.error("[maestro] valeur durationMinutes inattendue", {
        expectedDuration,
        actualDuration,
        id: match.id,
      });
      process.exit(1);
    }
  ' "$expected_type" "$expected_reason" "$expected_comment" "$expected_justified" "$expected_duration" <<<"$payload"
}

start_mock_server

cleanup_stale_maestro_port
wait_for_android_device
reset_mock_state
if [[ "$IS_MOCK_SERVER" == "1" ]]; then
  set_scenario "/__scenario" "${PHONE_LOGIN_SCENARIO:-happy_path}"
  set_scenario "/__scenario/email-login" "${EMAIL_LOGIN_SCENARIO:-happy_path}"
  set_scenario "/__scenario/onboarding" "${ONBOARDING_SCENARIO:-email_parent_happy}"
  set_scenario "/__scenario/pin" "${PIN_SCENARIO:-happy_path}"
  set_scenario "/__scenario/password" "${PASSWORD_SCENARIO:-happy_path}"
  set_scenario "/__scenario/discipline" "${DISCIPLINE_SCENARIO:-happy_path}"
fi

if [[ "$FLOW_NAME" == "messaging-compose" ]]; then
  seed_messaging_fixtures
fi

if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  MAESTRO_DEVICE_ARGS+=(--device "$ANDROID_SERIAL")
fi

select_apk_path

if [[ -n "$SELECTED_APK_PATH" && "${SKIP_APK_INSTALL:-0}" != "1" ]]; then
  wait_for_android_device
  apply_e2e_device_tuning
  install_selected_apk
fi

dismiss_system_anr() {
  local dumpsys_output=""

  for _ in $(seq 1 10); do
    dumpsys_output="$(adb_cmd shell dumpsys window displays 2>/dev/null || true)"
    if [[ "$dumpsys_output" != *"Application Not Responding: system"* ]]; then
      if [[ "$dumpsys_output" != *"Application Not Responding:"* ]]; then
        return 0
      fi
    fi

    adb_shell_timeout 5 input tap 840 1140
    adb_shell_timeout 5 input tap 560 1140
    adb_shell_timeout 5 input tap 360 860
    adb_shell_timeout 5 input keyevent 66
    adb_shell_timeout 5 input keyevent 4
    sleep 1
  done

  return 0
}

wait_for_app_activity() {
  local retries="${1:-20}"
  local output=""

  for _ in $(seq 1 "$retries"); do
    output="$(
      timeout 10s "$ADB_BIN" "${ADB_ARGS[@]}" shell dumpsys activity activities 2>/dev/null || true
    )"
    if [[ "$output" == *"com.zoutigo.scoliveapp/.MainActivity"* ]]; then
      return 0
    fi
    sleep 1
  done

  return 1
}

open_android_deep_link() {
  local deep_link="$1"
  local tmp_script=""

  tmp_script="$(mktemp)"
  printf '%s\n' \
    '#!/system/bin/sh' \
    "am start -a android.intent.action.VIEW -d \"$deep_link\"" \
    >"$tmp_script"

  adb_cmd push "$tmp_script" /data/local/tmp/scolive-open-link.sh >/dev/null
  adb_cmd shell chmod 755 /data/local/tmp/scolive-open-link.sh >/dev/null
  timeout 20s "$ADB_BIN" "${ADB_ARGS[@]}" shell sh /data/local/tmp/scolive-open-link.sh >/dev/null 2>&1 || true
  rm -f "$tmp_script"
}

open_flow_route() {
  case "$FLOW_NAME" in
    auth-google)
      open_google_auth_callback
      ;;
    onboarding-email)
      open_android_deep_link \
        'scolive://onboarding?email=parent%40ecole.cm&schoolSlug=ecole-demo'
      ;;
    onboarding-phone)
      open_android_deep_link \
        'scolive://onboarding?setupToken=setup-token-phone&schoolSlug=ecole-demo'
      ;;
    *)
      adb_shell_timeout 20 am start -n com.zoutigo.scoliveapp/.MainActivity
      ;;
  esac
}

adb_shell_timeout 15 am force-stop com.zoutigo.scoliveapp
adb_shell_timeout 20 pm clear com.zoutigo.scoliveapp
wait_for_android_device
open_flow_route
sleep 2
dismiss_system_anr
wait_for_app_activity 20 || true
sleep 2
wait_for_android_device

"$MAESTRO_BIN" test "${MAESTRO_DEVICE_ARGS[@]}" "$FLOW_PATH" "$@"

if [[ "$FLOW_NAME" == "feed-interactions" ]]; then
  assert_feed_interactions_state
fi

assert_discipline_crud_state
