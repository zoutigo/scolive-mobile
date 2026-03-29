"use strict";

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 300000,
    },
  },

  apps: {
    "android.debug": {
      type: "android.apk",
      // APK produit par le build debug standard
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      // Compile l'APK app + l'APK d'instrumentation Detox sans New Architecture.
      // Detox plante encore avec Fabric/React 0.83 sur notre stack Android CI.
      build:
        "cd android && sh ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug -PnewArchEnabled=false -PreactNativeArchitectures=x86_64 --no-daemon",
    },
  },

  devices: {
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Scolive_Dev_AOSP_API33",
      },
    },
  },

  configurations: {
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
  },
};
