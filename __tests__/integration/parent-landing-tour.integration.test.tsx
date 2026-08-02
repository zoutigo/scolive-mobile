/**
 * Tour d'aide guidée "parent-landing" — intégration AppShell + ParentHome.
 * Vérifie que le tour se déclenche pour un parent sur sa landing page, que
 * les 4 cibles (menu, messagerie, enfants, compte) sont bien montées à
 * travers le chrome global (BottomTabBar) et l'écran (ParentHome), et que
 * la progression complète du tour marque bien "parent-landing" comme
 * terminé pour le rôle parent.
 */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react-native";
import { AppShell } from "../../src/components/navigation/AppShell";
import { ParentHome } from "../../src/components/home/ParentHome";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import {
  PARENT_LANDING_TOUR_ID,
  PARENT_LANDING_TOUR_TARGETS,
} from "../../src/components/home/parent-landing-tour.config";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => {
      return callback();
    }, [callback]);
  },
}));

function parentUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "u1",
    firstName: "Robert",
    lastName: "Ntamack",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    profileCompleted: true,
    role: "PARENT",
    activeRole: "PARENT",
    ...overrides,
  };
}

function resetOnboardingTourStore() {
  useOnboardingTourStore.setState({
    completedTours: {},
    activeTourId: null,
    activeRole: null,
    steps: [],
    stepIndex: 0,
    targetLayout: null,
  });
}

describe("Tour parent-landing — intégration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOnboardingTourStore();
    useAuthStore.setState({
      user: parentUser(),
      schoolSlug: "college-vogt",
      isLoading: false,
      isAuthenticated: true,
      accessToken: "token",
    } as never);
    useFamilyStore.setState({
      children: [
        { id: "c1", firstName: "Lisa", lastName: "Ntamack", className: "6e A" },
      ],
      activeChildId: null,
      isLoading: false,
      loadChildren: jest.fn(),
      clearChildren: jest.fn(),
    } as never);
    useMessagingStore.setState({
      folder: "inbox",
      messages: [],
      meta: null,
      isLoading: false,
      isRefreshing: false,
      search: "",
      unreadCount: 3,
      loadUnreadCount: jest.fn().mockResolvedValue(undefined),
    } as never);
  });

  function renderParentLanding() {
    return render(
      <AppShell>
        <ParentHome user={parentUser()} schoolSlug="college-vogt" />
      </AppShell>,
    );
  }

  it("démarre le tour parent-landing au premier passage sur la landing page", async () => {
    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );
    expect(useOnboardingTourStore.getState().activeRole).toBe("parent");
    expect(useOnboardingTourStore.getState().steps).toHaveLength(4);
  });

  it("ne démarre pas le tour si onboardingHelpEnabled est explicitement désactivé", async () => {
    useAuthStore.setState({
      user: parentUser({ onboardingHelpEnabled: false }),
    } as never);

    renderParentLanding();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("ne redémarre pas le tour s'il a déjà été complété pour ce rôle", async () => {
    useOnboardingTourStore.setState({
      completedTours: { [`parent:${PARENT_LANDING_TOUR_ID}`]: true },
    });

    renderParentLanding();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("monte les 4 cibles du tour à travers le chrome global et l'écran d'accueil", () => {
    renderParentLanding();

    // Cibles portées par le chrome global (BottomTabBar).
    expect(screen.getByTestId("bottom-tab-menu")).toBeTruthy();
    expect(screen.getByTestId("bottom-tab-account")).toBeTruthy();
    // Cibles propres à ParentHome.
    expect(screen.getByTestId("quick-link-messagerie")).toBeTruthy();
    expect(screen.getByTestId("children-count-badge")).toBeTruthy();
  });

  it("progresse à travers les 4 étapes et marque le tour comme complété pour le rôle parent", async () => {
    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );

    const steps = useOnboardingTourStore.getState().steps;
    expect(steps.map((step) => step.targetKey)).toEqual([
      PARENT_LANDING_TOUR_TARGETS.menu,
      PARENT_LANDING_TOUR_TARGETS.messaging,
      PARENT_LANDING_TOUR_TARGETS.children,
      PARENT_LANDING_TOUR_TARGETS.account,
    ]);

    act(() => {
      useOnboardingTourStore.getState().next();
      useOnboardingTourStore.getState().next();
      useOnboardingTourStore.getState().next();
    });
    expect(useOnboardingTourStore.getState().stepIndex).toBe(3);

    act(() => {
      useOnboardingTourStore.getState().finish();
    });

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
    expect(
      useOnboardingTourStore
        .getState()
        .isCompleted("parent", PARENT_LANDING_TOUR_ID),
    ).toBe(true);
  });
});
