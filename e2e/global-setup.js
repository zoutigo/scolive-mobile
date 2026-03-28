"use strict";

/**
 * Global setup E2E :
 *  1. Démarre le mock server sur le port 3001 (remplace l'API réelle)
 *  2. Délègue à Detox pour préparer l'émulateur
 */

const { startMockServer } = require("./mock-server/server");
const detoxGlobalSetup = require("detox/runners/jest/globalSetup");

module.exports = async (globalConfig, projectConfig) => {
  await startMockServer(3001);
  await detoxGlobalSetup(globalConfig, projectConfig);
};
