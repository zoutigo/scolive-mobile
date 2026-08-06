/**
 * Vérifie le mode "self" de StudentNotesScreen (route /notes/me, utilisée
 * par le rôle STUDENT) : pas de childId dans l'URL, résolution de sa propre
 * identité via useSelfStudentContext (timetableApi.getMyTimetable), état de
 * chargement le temps de la résolution, retour vers l'accueil.
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StudentNotesScreen } from "../../src/components/notes/StudentNotesScreen";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useNotesStore } from "../../src/store/notes.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api");

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  });
  useAuthStore.setState({ schoolSlug: "college-vogt" } as never);
  useNotesStore.setState({ studentNotes: {} });
  mockTimetableApi.getMyTimetable.mockResolvedValue({
    student: { id: "self-1", firstName: "Lisa", lastName: "Mbele" },
    class: { id: "class-1", name: "6e A" },
    slots: [],
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: [],
    calendarEvents: [],
    subjectStyles: [],
  } as never);
});

describe("StudentNotesScreen — mode self (élève)", () => {
  it("affiche un chargement puis résout sa propre identité", async () => {
    render(<StudentNotesScreen />);

    expect(screen.getByTestId("student-notes-self-loading")).toBeOnTheScreen();

    await waitFor(() => {
      expect(mockTimetableApi.getMyTimetable).toHaveBeenCalledWith(
        "college-vogt",
        {},
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Lisa Mbele")).toBeOnTheScreen();
    });
  });

  it("revient à l'accueil (pas à l'accueil d'un enfant) via le bouton retour", async () => {
    render(<StudentNotesScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-back")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("child-notes-back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("n'affiche pas l'entrée d'aide « vue enfant » en mode self", async () => {
    render(<StudentNotesScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-header")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("module-header-menu"));
    expect(screen.queryByTestId("child-notes-help-menu-item")).toBeNull();
  });
});
