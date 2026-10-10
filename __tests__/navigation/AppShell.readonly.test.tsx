/**
 * AppShell — bannière « accès en lecture seule » (élève exclu, ou parent dont
 * tous les enfants sont exclus). Le flag vient de `/auth/me` (`schoolReadOnly`).
 */
import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { AppShell } from "../../src/components/navigation/AppShell";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
}));
jest.mock("../../src/components/navigation/AppHeader", () => ({
  AppHeader: () => null,
}));
jest.mock("../../src/components/navigation/AppDrawer", () => ({
  AppDrawer: () => null,
}));
jest.mock("../../src/components/navigation/BottomTabBar", () => ({
  BottomTabBar: () => null,
  BOTTOM_TAB_BAR_HEIGHT: 0,
  BOTTOM_TAB_ACCOUNT_TOUR_TARGET: "account",
}));
jest.mock("../../src/api/messaging-client", () => ({
  PLATFORM_SCOPE: "platform",
}));

const mockLoadChildren = jest.fn();
jest.mock("../../src/store/family.store", () => ({
  useFamilyStore: () => ({
    children: [],
    loadChildren: mockLoadChildren,
    clearChildren: jest.fn(),
  }),
}));
jest.mock("../../src/store/teacher-class-nav.store", () => ({
  useTeacherClassNavStore: () => ({
    classOptions: null,
    isLoadingClassOptions: false,
    errorMessage: null,
    loadClassOptions: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
  }),
}));
jest.mock("../../src/store/badges.store", () => ({
  useBadgesStore: () => ({
    summary: null,
    loadSummary: jest.fn(),
    clear: jest.fn(),
  }),
}));
jest.mock("../../src/store/onboarding-tour.store", () => ({
  useOnboardingTourStore: (selector: (s: unknown) => unknown) =>
    selector({ steps: [], stepIndex: 0 }),
}));

let mockUser: Record<string, unknown> | null = null;
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({ user: mockUser, schoolSlug: "college-vogt" }),
}));

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "u-1",
    firstName: "Robert",
    lastName: "Ntamack",
    role: "PARENT",
    activeRole: "PARENT",
    platformRoles: [],
    memberships: [{ schoolId: "s-1", role: "PARENT" }],
    ...overrides,
  };
}

function renderShell() {
  return render(
    <AppShell>
      <Text>contenu</Text>
    </AppShell>,
  );
}

describe("AppShell — bannière lecture seule", () => {
  it("affiche la bannière quand schoolReadOnly est vrai, sans masquer le contenu", () => {
    mockUser = baseUser({ schoolReadOnly: true });
    renderShell();
    expect(screen.getByTestId("read-only-banner")).toBeOnTheScreen();
    expect(screen.getByText("Accès en lecture seule")).toBeOnTheScreen();
    expect(screen.getByText("contenu")).toBeOnTheScreen();
  });

  it("n'affiche rien quand schoolReadOnly est faux ou absent", () => {
    mockUser = baseUser({ schoolReadOnly: false });
    const { unmount } = renderShell();
    expect(screen.queryByTestId("read-only-banner")).toBeNull();
    unmount();

    mockUser = baseUser();
    renderShell();
    expect(screen.queryByTestId("read-only-banner")).toBeNull();
  });

  it("n'affiche rien sans utilisateur connecté", () => {
    mockUser = null;
    renderShell();
    expect(screen.queryByTestId("read-only-banner")).toBeNull();
    expect(screen.getByText("contenu")).toBeOnTheScreen();
  });
});
