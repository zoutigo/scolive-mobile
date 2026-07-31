import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { OnboardingTourOverlay } from "../../src/components/onboarding/OnboardingTourOverlay";
import {
  useOnboardingTourStore,
  type OnboardingTourStep,
} from "../../src/store/onboarding-tour.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const STEPS: OnboardingTourStep[] = [
  {
    targetKey: "a",
    titleKey: "onboardingTour.childTimetable.step1Title",
    bodyKey: "onboardingTour.childTimetable.step1Body",
  },
  {
    targetKey: "b",
    titleKey: "onboardingTour.childTimetable.step2Title",
    bodyKey: "onboardingTour.childTimetable.step2Body",
  },
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

describe("OnboardingTourOverlay", () => {
  beforeEach(() => {
    resetStore();
  });

  it("renders nothing when there is no active tour", () => {
    render(<OnboardingTourOverlay />);
    expect(screen.queryByTestId("onboarding-tour-overlay")).toBeNull();
  });

  it("renders nothing while the target has not been measured yet", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);

    render(<OnboardingTourOverlay />);

    expect(screen.queryByTestId("onboarding-tour-overlay")).toBeNull();
  });

  it("renders the tooltip with the current step's title/body once the target is measured", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 10, y: 10, width: 100, height: 40 });

    render(<OnboardingTourOverlay />);

    expect(screen.getByTestId("onboarding-tour-overlay")).toBeOnTheScreen();
    expect(screen.getByTestId("onboarding-tour-title")).toHaveTextContent(
      "Changez de vue",
    );
    expect(screen.getByTestId("onboarding-tour-body")).toBeOnTheScreen();
  });

  it("shows Suivant on non-final steps and advances on press", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 10, y: 10, width: 100, height: 40 });

    render(<OnboardingTourOverlay />);

    expect(screen.getByTestId("onboarding-tour-next")).toHaveTextContent(
      "Suivant",
    );

    act(() => {
      fireEvent.press(screen.getByTestId("onboarding-tour-next"));
    });

    expect(useOnboardingTourStore.getState().stepIndex).toBe(1);
    // Overlay hides again until the next step's target is re-measured.
    expect(screen.queryByTestId("onboarding-tour-overlay")).toBeNull();
  });

  it("shows Terminer on the final step and completes the tour on press", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore.getState().next();
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 10, y: 10, width: 100, height: 40 });

    render(<OnboardingTourOverlay />);

    expect(screen.getByTestId("onboarding-tour-next")).toHaveTextContent(
      "Terminer",
    );

    act(() => {
      fireEvent.press(screen.getByTestId("onboarding-tour-next"));
    });

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
    expect(
      useOnboardingTourStore.getState().isCompleted("parent", "agenda"),
    ).toBe(true);
  });

  it("hides the Suivant button and shows a tap hint when the step opts into advanceOnTargetPress", () => {
    const stepsWithPress: OnboardingTourStep[] = [
      {
        targetKey: "a",
        titleKey: "onboardingTour.childTimetable.step1Title",
        bodyKey: "onboardingTour.childTimetable.step1Body",
        advanceOnTargetPress: true,
      },
      STEPS[1],
    ];
    useOnboardingTourStore
      .getState()
      .startTour("agenda", "parent", stepsWithPress);
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 10, y: 10, width: 100, height: 40 });

    render(<OnboardingTourOverlay />);

    expect(screen.queryByTestId("onboarding-tour-next")).toBeNull();
    expect(screen.getByTestId("onboarding-tour-hint")).toBeOnTheScreen();
    expect(screen.getByTestId("onboarding-tour-skip")).toBeOnTheScreen();
  });

  it("advancing an advanceOnTargetPress step happens via the store, not the tooltip button", () => {
    const stepsWithPress: OnboardingTourStep[] = [
      {
        targetKey: "a",
        titleKey: "onboardingTour.childTimetable.step1Title",
        bodyKey: "onboardingTour.childTimetable.step1Body",
        advanceOnTargetPress: true,
      },
      STEPS[1],
    ];
    useOnboardingTourStore
      .getState()
      .startTour("agenda", "parent", stepsWithPress);
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 10, y: 10, width: 100, height: 40 });

    render(<OnboardingTourOverlay />);

    act(() => {
      useOnboardingTourStore.getState().advanceIfTarget("a");
    });

    expect(useOnboardingTourStore.getState().stepIndex).toBe(1);
  });

  it("uses the step's finishLabelKey on the last step when provided", () => {
    const stepsWithFinishLabel: OnboardingTourStep[] = [
      STEPS[0],
      {
        ...STEPS[1],
        finishLabelKey: "onboardingTour.common.gotIt",
      },
    ];
    useOnboardingTourStore
      .getState()
      .startTour("agenda", "parent", stepsWithFinishLabel);
    useOnboardingTourStore.getState().next();
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 10, y: 10, width: 100, height: 40 });

    render(<OnboardingTourOverlay />);

    expect(screen.getByTestId("onboarding-tour-next")).toHaveTextContent(
      "J'ai compris",
    );
  });

  it("skips (and completes) the tour when Passer is pressed", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 10, y: 10, width: 100, height: 40 });

    render(<OnboardingTourOverlay />);

    act(() => {
      fireEvent.press(screen.getByTestId("onboarding-tour-skip"));
    });

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
    expect(
      useOnboardingTourStore.getState().isCompleted("parent", "agenda"),
    ).toBe(true);
  });
});
