import { renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOnboardingTourTrigger } from "../../src/hooks/useOnboardingTourTrigger";
import { useAuthStore } from "../../src/store/auth.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import type { AuthUser } from "../../src/types/auth.types";
import type { OnboardingTourStep } from "../../src/store/onboarding-tour.store";

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => {
      return callback();
    }, [callback]);
  },
}));

const STEPS: OnboardingTourStep[] = [
  { targetKey: "a", titleKey: "t1", bodyKey: "b1" },
];

function makeParentUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    firstName: "Remi",
    lastName: "Ntamack",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    profileCompleted: true,
    role: "PARENT",
    activeRole: "PARENT",
    ...overrides,
  };
}

describe("useOnboardingTourTrigger", () => {
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
    useAuthStore.setState({ user: null });
  });

  it("starts the tour when the role matches and it has not been completed", async () => {
    useAuthStore.setState({ user: makeParentUser() });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
      }),
    );

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe("agenda"),
    );
  });

  it("does not start when there is no user", () => {
    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
      }),
    );

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("does not start when onboardingHelpEnabled is explicitly false", () => {
    useAuthStore.setState({
      user: makeParentUser({ onboardingHelpEnabled: false }),
    });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
      }),
    );

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("starts when onboardingHelpEnabled is undefined (defaults to enabled)", async () => {
    useAuthStore.setState({
      user: makeParentUser({ onboardingHelpEnabled: undefined }),
    });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
      }),
    );

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe("agenda"),
    );
  });

  it("does not start when the user's active role does not match the tour's role", () => {
    useAuthStore.setState({
      user: makeParentUser({ role: "TEACHER", activeRole: "TEACHER" }),
    });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
      }),
    );

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("does not start when the tour has already been completed for this role", () => {
    useOnboardingTourStore.setState({
      completedTours: { "parent:agenda": true },
    });
    useAuthStore.setState({ user: makeParentUser() });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
      }),
    );

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("does not start when enabled=false, even if all other conditions are met", () => {
    useAuthStore.setState({ user: makeParentUser() });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
        enabled: false,
      }),
    );

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("starts when enabled is omitted (defaults to true)", async () => {
    useAuthStore.setState({ user: makeParentUser() });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
        enabled: true,
      }),
    );

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe("agenda"),
    );
  });

  it("does not restart a different tour while one is already active", () => {
    useOnboardingTourStore.getState().startTour("other-tour", "parent", STEPS);
    useAuthStore.setState({ user: makeParentUser() });

    renderHook(() =>
      useOnboardingTourTrigger({
        tourId: "agenda",
        role: "parent",
        steps: STEPS,
      }),
    );

    expect(useOnboardingTourStore.getState().activeTourId).toBe("other-tour");
  });
});
