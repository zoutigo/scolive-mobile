import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import {
  OnboardingScrollView,
  useOnboardingScrollHandle,
  type OnboardingScrollHandle,
} from "../../src/components/onboarding/OnboardingScrollView";

function ScrollHandleProbe() {
  const handle = useOnboardingScrollHandle();
  return (
    <Text testID="probe">
      {handle ? "has-handle" : "no-handle"}
      {":"}
      {handle?.offsetRef.current ?? "n/a"}
    </Text>
  );
}

describe("OnboardingScrollView", () => {
  it("renders its children inside a scrollable container", () => {
    const { getByText } = render(
      <OnboardingScrollView testID="scroll">
        <Text>content</Text>
      </OnboardingScrollView>,
    );

    expect(getByText("content")).toBeTruthy();
  });

  it("exposes a scroll handle to descendants via context", () => {
    const { getByTestId } = render(
      <OnboardingScrollView testID="scroll">
        <ScrollHandleProbe />
      </OnboardingScrollView>,
    );

    expect(getByTestId("probe").props.children.join("")).toBe("has-handle:0");
  });

  it("does not expose a scroll handle outside of any OnboardingScrollView", () => {
    const { getByTestId } = render(<ScrollHandleProbe />);

    expect(getByTestId("probe").props.children.join("")).toBe("no-handle:n/a");
  });

  it("tracks the latest scroll offset and forwards onScroll to the caller", () => {
    const onScroll = jest.fn();
    const captured: { handle: OnboardingScrollHandle | null } = {
      handle: null,
    };

    function Capture() {
      captured.handle = useOnboardingScrollHandle();
      return null;
    }

    const { getByTestId } = render(
      <OnboardingScrollView testID="scroll" onScroll={onScroll}>
        <Capture />
      </OnboardingScrollView>,
    );

    fireEvent.scroll(getByTestId("scroll"), {
      nativeEvent: { contentOffset: { y: 240 } },
    });

    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(captured.handle?.offsetRef.current).toBe(240);
  });
});
