import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ONBOARDING_TOUR_STORAGE_KEY,
  buildTourCompletionKey,
  useOnboardingTourStore,
  type OnboardingTourStep,
} from "../../src/store/onboarding-tour.store";

const STEPS: OnboardingTourStep[] = [
  { targetKey: "a", titleKey: "t1", bodyKey: "b1" },
  { targetKey: "b", titleKey: "t2", bodyKey: "b2" },
  { targetKey: "c", titleKey: "t3", bodyKey: "b3" },
];

describe("onboarding-tour.store", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useOnboardingTourStore.setState({
      completedTours: {},
      activeTourId: null,
      activeRole: null,
      steps: [],
      stepIndex: 0,
      targetLayout: null,
    });
  });

  it("has no completed tours by default", () => {
    expect(
      useOnboardingTourStore.getState().isCompleted("parent", "agenda"),
    ).toBe(false);
  });

  it("starts a tour with the given steps and resets step index/layout", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    const state = useOnboardingTourStore.getState();
    expect(state.activeTourId).toBe("agenda");
    expect(state.activeRole).toBe("parent");
    expect(state.stepIndex).toBe(0);
    expect(state.steps).toHaveLength(3);
    expect(state.targetLayout).toBeNull();
  });

  it("does not start a tour with an empty step list", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", []);
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("caps steps at ONBOARDING_TOUR_MAX_STEPS (5)", () => {
    const sixSteps: OnboardingTourStep[] = Array.from(
      { length: 6 },
      (_, i) => ({
        targetKey: `t${i}`,
        titleKey: `title${i}`,
        bodyKey: `body${i}`,
      }),
    );
    useOnboardingTourStore.getState().startTour("agenda", "parent", sixSteps);
    expect(useOnboardingTourStore.getState().steps).toHaveLength(5);
  });

  it("advances to the next step and clears the previous target layout", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore
      .getState()
      .setTargetLayout({ x: 1, y: 2, width: 3, height: 4 });
    useOnboardingTourStore.getState().next();
    const state = useOnboardingTourStore.getState();
    expect(state.stepIndex).toBe(1);
    expect(state.targetLayout).toBeNull();
  });

  it("finishes (marks completed) when calling next on the last step", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore.getState().next();
    useOnboardingTourStore.getState().next();
    useOnboardingTourStore.getState().next();
    const state = useOnboardingTourStore.getState();
    expect(state.activeTourId).toBeNull();
    expect(state.isCompleted("parent", "agenda")).toBe(true);
  });

  it("skip marks the tour completed immediately", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore.getState().skip();
    const state = useOnboardingTourStore.getState();
    expect(state.activeTourId).toBeNull();
    expect(state.isCompleted("parent", "agenda")).toBe(true);
  });

  it("keys completion by role+tourId so other roles/tours are unaffected", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore.getState().skip();
    expect(
      useOnboardingTourStore.getState().isCompleted("teacher", "agenda"),
    ).toBe(false);
    expect(
      useOnboardingTourStore.getState().isCompleted("parent", "discipline"),
    ).toBe(false);
  });

  it("buildTourCompletionKey formats role:tourId", () => {
    expect(buildTourCompletionKey("parent", "agenda")).toBe("parent:agenda");
  });

  it("persists only completedTours (not ephemeral session state) to AsyncStorage", async () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);
    useOnboardingTourStore.getState().skip();

    await new Promise((resolve) => setTimeout(resolve, 0));

    const stored = await AsyncStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.state).toEqual({
      completedTours: { "parent:agenda": true },
    });
  });

  it("advanceIfTarget advances the step when it matches the active target-press step", () => {
    const stepsWithPress: OnboardingTourStep[] = [
      {
        targetKey: "a",
        titleKey: "t1",
        bodyKey: "b1",
        advanceOnTargetPress: true,
      },
      { targetKey: "b", titleKey: "t2", bodyKey: "b2" },
    ];
    useOnboardingTourStore
      .getState()
      .startTour("agenda", "parent", stepsWithPress);

    useOnboardingTourStore.getState().advanceIfTarget("a");

    expect(useOnboardingTourStore.getState().stepIndex).toBe(1);
  });

  it("advanceIfTarget does nothing when the step does not opt into advanceOnTargetPress", () => {
    useOnboardingTourStore.getState().startTour("agenda", "parent", STEPS);

    useOnboardingTourStore.getState().advanceIfTarget("a");

    expect(useOnboardingTourStore.getState().stepIndex).toBe(0);
  });

  it("advanceIfTarget does nothing when the pressed target is not the active step's target", () => {
    const stepsWithPress: OnboardingTourStep[] = [
      {
        targetKey: "a",
        titleKey: "t1",
        bodyKey: "b1",
        advanceOnTargetPress: true,
      },
      { targetKey: "b", titleKey: "t2", bodyKey: "b2" },
    ];
    useOnboardingTourStore
      .getState()
      .startTour("agenda", "parent", stepsWithPress);

    useOnboardingTourStore.getState().advanceIfTarget("b");

    expect(useOnboardingTourStore.getState().stepIndex).toBe(0);
  });

  it("advanceIfTarget does nothing when no tour is active", () => {
    useOnboardingTourStore.getState().advanceIfTarget("a");
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("restores persisted completedTours on rehydration", async () => {
    await AsyncStorage.setItem(
      ONBOARDING_TOUR_STORAGE_KEY,
      JSON.stringify({
        state: { completedTours: { "parent:agenda": true } },
        version: 0,
      }),
    );

    await useOnboardingTourStore.persist.rehydrate();

    expect(
      useOnboardingTourStore.getState().isCompleted("parent", "agenda"),
    ).toBe(true);
  });
});
