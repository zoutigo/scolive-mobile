// Manual mock, used automatically by Jest for all test files (no jest.mock()
// call needed) — see https://jestjs.io/docs/manual-mocks#mocking-node-modules.
//
// The real `expo-notifications` module registers a native push-token
// listener as a *module-level side effect* the moment it is `require`d (see
// `warnOfExpoGoPushUsage.ts` / `TokenEmitter.ts`). `src/notifications/push-registration.ts#getNotifications`
// calls `require("expo-notifications")` on every invocation (not cached
// across test files, since Jest gives each test file its own module
// registry), and `badges.store.ts` calls it in `clear()`/`loadSummary()` —
// both exercised by most test files via `useBadgesStore`. Left unmocked,
// this re-registers a listener on the real (unmocked) native module for
// every one of the ~260 test files in a full `--runInBand` run, and the
// accumulated listeners measurably slow down later test files (observed:
// a specific async assertion deep in the suite going from <1s in isolation
// to a timeout in a full run). This mock avoids executing that real,
// side-effect-laden module at all in tests.
module.exports = {
  setNotificationHandler: () => {},
  getPermissionsAsync: () => Promise.resolve({ status: "granted" }),
  requestPermissionsAsync: () => Promise.resolve({ status: "granted" }),
  setNotificationChannelAsync: () => Promise.resolve(undefined),
  getExpoPushTokenAsync: () => Promise.resolve({ data: "mock-token" }),
  setBadgeCountAsync: () => Promise.resolve(true),
  AndroidImportance: { MAX: 5 },
};
