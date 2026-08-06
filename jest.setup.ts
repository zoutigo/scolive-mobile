import { act } from "@testing-library/react-native";

// React Native provides `requestIdleCallback`/`cancelIdleCallback` as a
// global polyfill at runtime (see setUpTimers.js) but the jest-expo preset
// doesn't set it up — code that migrated off the deprecated
// `InteractionManager.runAfterInteractions` needs it defined here too.
if (typeof globalThis.requestIdleCallback === "undefined") {
  globalThis.requestIdleCallback = ((callback: IdleRequestCallback) =>
    setTimeout(
      () => callback({ didTimeout: false, timeRemaining: () => 0 }),
      0,
    ) as unknown as number) as typeof requestIdleCallback;
  globalThis.cancelIdleCallback = ((handle: number) =>
    clearTimeout(handle)) as typeof cancelIdleCallback;
}

const originalConsoleError = console.error.bind(console);

function isReactActWarning(message: unknown) {
  return (
    typeof message === "string" && message.includes("not wrapped in act(...)")
  );
}

console.error = (...args: Parameters<typeof console.error>) => {
  if (isReactActWarning(args[0])) return;
  originalConsoleError(...args);
};

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});
