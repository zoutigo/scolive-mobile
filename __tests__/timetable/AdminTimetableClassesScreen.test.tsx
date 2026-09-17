import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AdminTimetableClassesScreen } from "../../src/components/timetable/AdminTimetableClassesScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockLoadClassOptions = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    canGoBack: jest.fn().mockReturnValue(true),
    navigate: jest.fn(),
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({
    openDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Paul",
      lastName: "Manga",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });

  useTimetableStore.setState({
    classOptions: {
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      classes: [
        {
          classId: "class-1",
          className: "6e A",
          schoolYearId: "sy1",
          schoolYearLabel: "2025-2026",
          subjects: [{ id: "math", name: "Maths" }],
          studentCount: 18,
        },
      ],
    },
    isLoadingClassOptions: false,
    errorMessage: null,
    loadClassOptions: mockLoadClassOptions,
    clearError: jest.fn(),
  } as never);
});

describe("AdminTimetableClassesScreen", () => {
  it("charge les classes au montage", async () => {
    render(<AdminTimetableClassesScreen />);

    await waitFor(() => {
      expect(mockLoadClassOptions).toHaveBeenCalledWith(
        "college-vogt",
        undefined,
      );
    });
  });

  it("ouvre la classe sélectionnée", () => {
    render(<AdminTimetableClassesScreen />);

    fireEvent.press(screen.getByTestId("admin-timetable-class-row-class-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/admin-timetable/class/[classId]",
      params: { classId: "class-1", schoolYearId: "sy1" },
    });
  });

  it("affiche le ModuleHeader avec back et titre (menu déplacé vers la bottom tab bar)", () => {
    render(<AdminTimetableClassesScreen />);

    expect(screen.getByTestId("admin-timetable-classes-header")).toBeTruthy();
    expect(screen.getByTestId("admin-timetable-classes-back")).toBeTruthy();
    expect(screen.getByTestId("module-header-title")).toBeTruthy();
  });

  it("n'affiche pas de sous-titre quand l'utilisateur n'a pas de schoolName", () => {
    render(<AdminTimetableClassesScreen />);

    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });

  it("affiche le sous-titre école quand l'utilisateur a un schoolName", () => {
    useAuthStore.setState((s) => ({
      ...s,
      user: s.user
        ? {
            ...s.user,
            schoolName: "Collège Vogt",
          }
        : null,
    }));
    render(<AdminTimetableClassesScreen />);

    expect(screen.getByTestId("module-header-subtitle").props.children).toBe(
      "Collège Vogt",
    );
  });

  it("le bouton retour appelle router.back()", () => {
    render(<AdminTimetableClassesScreen />);

    fireEvent.press(screen.getByTestId("admin-timetable-classes-back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
