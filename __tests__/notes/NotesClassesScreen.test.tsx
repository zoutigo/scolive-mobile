import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { NotesClassesScreen } from "../../src/components/notes/NotesClassesScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useNotesStore } from "../../src/store/notes.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }),
}));

describe("NotesClassesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Valery",
        lastName: "Mbele",
        platformRoles: [],
        memberships: [{ schoolId: "s1", role: "TEACHER" }],
        profileCompleted: true,
        role: "TEACHER",
        activeRole: "TEACHER",
      },
    } as never);

    useNotesStore.setState({
      classOptions: {
        selectedSchoolYearId: "y1",
        schoolYears: [
          { id: "y1", label: "2025-2026" },
          { id: "y2", label: "2024-2025" },
        ],
        classes: [
          {
            classId: "class-1",
            className: "6e A",
            schoolYearId: "y1",
            schoolYearLabel: "2025-2026",
            studentCount: 42,
            subjects: [
              { id: "sub-1", name: "Mathématiques" },
              { id: "sub-2", name: "Français" },
            ],
          },
          {
            classId: "class-2",
            className: "5e B",
            schoolYearId: "y2",
            schoolYearLabel: "2024-2025",
            studentCount: 38,
            subjects: [{ id: "sub-3", name: "SVT" }],
          },
        ],
      },
      isLoadingClassOptions: false,
      errorMessage: null,
      loadClassOptions: jest.fn().mockResolvedValue({
        selectedSchoolYearId: "y1",
        schoolYears: [
          { id: "y1", label: "2025-2026" },
          { id: "y2", label: "2024-2025" },
        ],
        classes: [
          {
            classId: "class-1",
            className: "6e A",
            schoolYearId: "y1",
            schoolYearLabel: "2025-2026",
            studentCount: 42,
            subjects: [
              { id: "sub-1", name: "Mathématiques" },
              { id: "sub-2", name: "Français" },
            ],
          },
          {
            classId: "class-2",
            className: "5e B",
            schoolYearId: "y2",
            schoolYearLabel: "2024-2025",
            studentCount: 38,
            subjects: [{ id: "sub-3", name: "SVT" }],
          },
        ],
      }),
      clearError: jest.fn(),
    } as never);
  });

  it("affiche le ModuleHeader avec back, menu et titre", async () => {
    render(<NotesClassesScreen />);
    await waitFor(() => expect(screen.getByText("6e A")).toBeTruthy());

    expect(screen.getByTestId("notes-classes-header")).toBeTruthy();
    expect(screen.getByTestId("notes-classes-back")).toBeTruthy();
    expect(screen.getByTestId("notes-classes-menu-btn")).toBeTruthy();
    expect(screen.getByTestId("module-header-title")).toBeTruthy();
    expect(screen.getByText("6e A")).toBeTruthy();
    expect(screen.getByText("Mathématiques")).toBeTruthy();
  });

  it("n'affiche pas de sous-titre quand l'utilisateur n'a pas de schoolName", async () => {
    render(<NotesClassesScreen />);
    await waitFor(() => expect(screen.getByText("6e A")).toBeTruthy());

    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });

  it("affiche le sous-titre école · classe quand l'utilisateur a les données", async () => {
    useAuthStore.setState((s) => ({
      ...s,
      user: s.user
        ? {
            ...s.user,
            schoolName: "Collège Vogt",
            referentClass: { name: "6eC" },
          }
        : null,
    }));
    render(<NotesClassesScreen />);
    await waitFor(() => expect(screen.getByText("6e A")).toBeTruthy());

    expect(screen.getByTestId("module-header-subtitle").props.children).toBe(
      "Collège Vogt · 6eC",
    );
  });

  it("le bouton retour appelle router.back()", async () => {
    render(<NotesClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("notes-classes-back")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("notes-classes-back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("navigue vers le gestionnaire de classe", async () => {
    render(<NotesClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("notes-class-card-class-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("notes-class-card-class-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/class/[classId]",
      params: {
        classId: "class-1",
        schoolYearId: "y1",
      },
    });
  });

  it("filtre les classes par année scolaire", async () => {
    render(<NotesClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("notes-class-year-y2")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("notes-class-year-y2"));

    expect(screen.getByText("5e B")).toBeTruthy();
    expect(screen.queryByText("6e A")).toBeNull();
  });
});
