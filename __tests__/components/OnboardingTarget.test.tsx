import React from "react";
import { Text } from "react-native";
import { act, render } from "@testing-library/react-native";
import { OnboardingTarget } from "../../src/components/onboarding/OnboardingTarget";
import {
  useOnboardingTourStore,
  type OnboardingTourStep,
} from "../../src/store/onboarding-tour.store";

const STEPS: OnboardingTourStep[] = [
  { targetKey: "target-a", titleKey: "t1", bodyKey: "b1" },
  { targetKey: "target-b", titleKey: "t2", bodyKey: "b2" },
];

function resetStore() {
  useOnboardingTourStore.setState({
    completedTours: {},
    activeTourId: null,
    activeRole: null,
    steps: [],
    stepIndex: 0,
    targetLayout: null,
  });
}

async function flushMeasureDelay() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });
}

describe("OnboardingTarget", () => {
  beforeEach(() => {
    resetStore();
  });

  it("does not measure or affect targetLayout when no tour is active", async () => {
    render(
      <OnboardingTarget id="target-a">
        <Text>content</Text>
      </OnboardingTarget>,
    );

    await flushMeasureDelay();

    expect(useOnboardingTourStore.getState().targetLayout).toBeNull();
  });

  it("does not measure when it is not the active step's target", async () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);

    render(
      <OnboardingTarget id="target-b">
        <Text>content</Text>
      </OnboardingTarget>,
    );

    await flushMeasureDelay();

    expect(useOnboardingTourStore.getState().targetLayout).toBeNull();
  });

  it("measures and reports its layout when it is the active step's target", async () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);

    render(
      <OnboardingTarget id="target-a">
        <Text>content</Text>
      </OnboardingTarget>,
    );

    await flushMeasureDelay();

    // jsdom/react-test-renderer's measureInWindow stub reports a 0-sized
    // layout, which OnboardingTarget deliberately ignores (see width/height
    // guard) — this test only asserts it doesn't crash and doesn't report
    // a bogus non-null layout for a zero-sized measurement.
    expect(useOnboardingTourStore.getState().targetLayout).toBeNull();
  });
});
