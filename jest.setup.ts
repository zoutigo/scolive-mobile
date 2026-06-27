import { act } from "@testing-library/react-native";
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
