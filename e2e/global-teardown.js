"use strict";

/**
 * Global teardown E2E :
 *  1. Arrête Detox
 *  2. Arrête le mock server
 */

const { stopMockServer } = require("./mock-server/server");
const detoxGlobalTeardown = require("detox/runners/jest/globalTeardown");

module.exports = async (globalConfig) => {
  await detoxGlobalTeardown(globalConfig);
  await stopMockServer();
};
