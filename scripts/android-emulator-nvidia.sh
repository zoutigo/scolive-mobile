#!/usr/bin/env bash

set -euo pipefail

AVD_NAME="${1:-Scolive_Dev_AOSP_API33}"
EMULATOR_BIN="${EMULATOR_BIN:-$HOME/Android/Sdk/emulator/emulator}"
GPU_MODE="host"
SNAPSHOT_FLAG="-no-snapshot-load"

if [[ "$AVD_NAME" == Scolive_Dev_AOSP_API33* ]] || [[ "$AVD_NAME" == Scolive_GooglePlay_API33* ]] || [[ "$AVD_NAME" == Scolive_E2E_GooglePlay_API33* ]]; then
  GPU_MODE="swiftshader_indirect"
fi

# Les AVD Google Play peuvent charger le snapshot "startup_ready" si disponible.
# Cela évite un cold boot très lent sur les flows E2E Google / Maestro.
# L'AOSP démarre toujours sans snapshot (état propre garanti).
if [[ "$AVD_NAME" == Scolive_GooglePlay_API33* ]] || [[ "$AVD_NAME" == Scolive_E2E_GooglePlay_API33* ]]; then
  SNAPSHOT_DIR="$HOME/.android/avd/${AVD_NAME}.avd/snapshots/startup_ready"
  if [[ -d "$SNAPSHOT_DIR" ]]; then
    SNAPSHOT_FLAG="-snapshot startup_ready"
  else
    SNAPSHOT_FLAG=""
  fi
fi

exec env \
  __NV_PRIME_RENDER_OFFLOAD=1 \
  __GLX_VENDOR_LIBRARY_NAME=nvidia \
  __VK_LAYER_NV_optimus=NVIDIA_only \
  "$EMULATOR_BIN" \
  -avd "$AVD_NAME" \
  -gpu "$GPU_MODE" \
  $SNAPSHOT_FLAG
