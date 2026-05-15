import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AppShell, useDrawer } from "../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  usePathname: () => "/",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

function SchoolAdminTeachersHarness() {
  const { openDrawer } = useDrawer();

  return (
    <ModuleHeader
      title="Enseignants"
      subtitle="Collège Vogt"
      onBack={jest.fn()}
      rightIcon="menu-outline"
      onRightPress={openDrawer}
      rightTestID="school-admin-teachers-menu-btn"
    />
  );
}

describe("Teachers school admin integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    useAuthStore.setState({
      user: {
        id: "u-school-admin",
        firstName: "Sarah",
        lastName: "Moukouri",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
        profileCompleted: true,
        role: "SCHOOL_ADMIN",
        activeRole: "SCHOOL_ADMIN",
        schoolName: "Collège Vogt",
      },
      schoolSlug: "college-vogt",
      isLoading: false,
      isAuthenticated: true,
      accessToken: "token",
    } as never);
    useFamilyStore.setState({
      children: [],
      activeChildId: null,
      isLoading: false,
      loadChildren: jest.fn(),
      clearChildren: jest.fn(),
      setActiveChild: jest.fn(),
    } as never);
    useTeacherClassNavStore.setState({
      classOptions: null,
      isLoadingClassOptions: false,
      errorMessage: null,
      loadClassOptions: jest.fn(),
      clearError: jest.fn(),
      reset: jest.fn(),
    } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ouvre le drawer school admin puis déclenche la navigation vers l'écran enseignants", async () => {
    render(
      <AppShell>
        <SchoolAdminTeachersHarness />
      </AppShell>,
    );

    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("none");

    fireEvent.press(screen.getByTestId("school-admin-teachers-menu-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe(
        "auto",
      );
    });
    expect(screen.getByTestId("nav-item-teachers")).toBeTruthy();

    fireEvent.press(screen.getByTestId("nav-item-teachers"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledWith("/teachers");
  });
});
