"use strict";

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  // Racine = répertoire parent (scolive-mobile/)
  rootDir: "..",

  // Uniquement les fichiers E2E — jamais les tests unitaires
  testMatch: ["<rootDir>/e2e/tests/**/*.e2e.ts"],

  // Detox impose l'exécution séquentielle
  maxWorkers: 1,
  bail: 1,
  testTimeout: 120000,

  // Infrastructure Detox
  globalSetup: "<rootDir>/e2e/global-setup.js",
  globalTeardown: "<rootDir>/e2e/global-teardown.js",
  testEnvironment: "detox/runners/jest/testEnvironment",
  reporters: ["detox/runners/jest/reporter"],

  // Transformation TypeScript pour les fichiers de test E2E
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/e2e/tsconfig.json",
      },
    ],
  },

  verbose: true,
};
