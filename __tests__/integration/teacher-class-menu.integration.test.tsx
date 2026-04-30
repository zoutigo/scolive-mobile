import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AppShell, useDrawer } from "../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { useAuthStore } from "../../src/store/auth.store";
import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/classes/class-1/notes",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

function TeacherModuleHeaderHarness() {
  const { openDrawer } = useDrawer();

  return (
    <ModuleHeader
      title="Module enseignant"
      subtitle="6eC"
      onBack={jest.fn()}
      rightIcon="menu-outline"
      onRightPress={openDrawer}
      rightTestID="teacher-module-menu-btn"
    />
  );
}

describe("Teacher class menu integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: "u1",
        firstName: "Albert",
        lastName: "Ntamack",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
        profileCompleted: true,
        role: "TEACHER",
        activeRole: "TEACHER",
      },
      schoolSlug: "college-vogt",
      isLoading: false,
      isAuthenticated: true,
      accessToken: "token",
    } as never);
    useTeacherClassNavStore.setState({
      classOptions: {
        schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
        selectedSchoolYearId: "sy1",
        classes: [
          {
            classId: "class-1",
            className: "6eC",
            schoolYearId: "sy1",
            schoolYearLabel: "2025-2026",
            subjects: [{ id: "math", name: "Mathématiques" }],
            studentCount: 20,
          },
        ],
      },
      isLoadingClassOptions: false,
      errorMessage: null,
      loadClassOptions: jest.fn().mockResolvedValue({
        schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
        selectedSchoolYearId: "sy1",
        classes: [
          {
            classId: "class-1",
            className: "6eC",
            schoolYearId: "sy1",
            schoolYearLabel: "2025-2026",
            subjects: [{ id: "math", name: "Mathématiques" }],
            studentCount: 20,
          },
        ],
      }),
      clearError: jest.fn(),
      reset: jest.fn(),
    } as never);
  });

  it("ouvre le drawer enseignant et affiche la section de classe chargée", async () => {
    render(
      <AppShell>
        <TeacherModuleHeaderHarness />
      </AppShell>,
    );

    fireEvent.press(screen.getByTestId("teacher-module-menu-btn"));

    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("auto");
    await waitFor(() => {
      expect(
        screen.getByTestId("drawer-section-teacher-class-class-1"),
      ).toBeTruthy();
    });
  });
});
