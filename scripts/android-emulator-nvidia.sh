#!/usr/bin/env bash

set -euo pipefail

AVD_NAME="${1:-Scolive_Dev_AOSP_API33}"
EMULATOR_BIN="${EMULATOR_BIN:-$HOME/Android/Sdk/emulator/emulator}"
GPU_MODE="host"

if [[ "$AVD_NAME" == Scolive_Dev_AOSP_API33* ]]; then
  GPU_MODE="swiftshader_indirect"
fi

exec env \
  __NV_PRIME_RENDER_OFFLOAD=1 \
  __GLX_VENDOR_LIBRARY_NAME=nvidia \
  __VK_LAYER_NV_optimus=NVIDIA_only \
  "$EMULATOR_BIN" \
  -avd "$AVD_NAME" \
  -gpu "$GPU_MODE" \
  -no-snapshot-load
