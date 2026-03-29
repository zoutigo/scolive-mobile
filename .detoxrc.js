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
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
      // Configuration locale historique pour le debug/Metro.
      build:
        "cd android && sh ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug -PreactNativeArchitectures=x86_64 --no-daemon",
    },
    "android.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk",
      // Build embarqué pour les campagnes E2E dédiées: pas de Metro ni de DevSupport.
      build:
        "cd android && sh ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release -PreactNativeArchitectures=x86_64 --no-daemon",
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
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
  },
};
