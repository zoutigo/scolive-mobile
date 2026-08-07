/**
 * Vérifie la route self /vie-scolaire/me (rôle STUDENT) : résolution de
 * l'identité via useSelfStudentContext, rendu du StudentLifeScreen partagé
 * avec le parent, retour vers l'accueil (pas vers un accueil d'enfant).
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import VieScolaireMeScreen from "../../app/(home)/vie-scolaire/me";
import { disciplineApi } from "../../src/api/discipline.api";
import { badgesApi } from "../../src/api/badges.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useBadgesStore } from "../../src/store/badges.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

const mockPush = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/api/badges.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/store/auth.store", () => ({
  // Applies the selector itself when one is passed — otherwise
  // selector-based callers (e.g. useOnboardingTourTrigger's
  // `(state) => state.user`) get the whole mocked object back instead of
  // just `.user`.
  useAuthStore: jest.fn((selector?: (s: unknown) => unknown) => {
    const state = { schoolSlug: "college-vogt" };
    return selector ? selector(state) : state;
  }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/(home)/vie-scolaire/me",
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
  DrawerContext: require("react").createContext({
    openDrawer: () => {},
    closeDrawer: () => {},
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  }),
  useDrawer: jest.fn(),
}));

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;
const mockBadgesApi = badgesApi as jest.Mocked<typeof badgesApi>;
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
  useDisciplineStore.getState().reset();
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
  api.list.mockResolvedValue([]);
  mockBadgesApi.markRead.mockResolvedValue(undefined);
  mockBadgesApi.getUnreadSummary.mockResolvedValue({
    messagesUnread: 0,
    feedUnread: 0,
    ticketsNeedingResponse: 0,
    ticketsUnreadReplies: 0,
    children: [],
    teacherClasses: [],
    total: 0,
  });
  useBadgesStore.getState().clear();
});

describe("VieScolaireMeScreen (self, rôle élève)", () => {
  it("résout sa propre identité puis charge ses propres événements", async () => {
    api.list.mockResolvedValueOnce([makeLifeEvent({ studentId: "self-1" })]);

    render(<VieScolaireMeScreen />);

    expect(screen.getByTestId("vie-scolaire-me-loading")).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByText("Lisa Mbele")).toBeOnTheScreen();
    });

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith("college-vogt", "self-1", {
        scope: "current",
        limit: 200,
      });
    });
  });

  it("revient à l'accueil (pas à l'accueil d'un enfant) via le bouton retour", async () => {
    render(<VieScolaireMeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("btn-back")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("btn-back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("ouvre et ferme la modale d'aide depuis le menu du header (vue élève)", async () => {
    render(<VieScolaireMeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("vie-scolaire-header")).toBeOnTheScreen();
    });

    // La modale n'est pas visible par défaut.
    expect(screen.queryByTestId("vie-scolaire-help-modal-title")).toBeNull();

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("vie-scolaire-help-menu-item"));

    expect(
      screen.getByTestId("vie-scolaire-help-modal-title"),
    ).toHaveTextContent("Vie scolaire — Synthèse");
    expect(screen.getByText("Les compteurs de l'année")).toBeOnTheScreen();
    expect(
      screen.getByText("Filtrer les événements récents"),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("vie-scolaire-help-modal-close"));
    expect(screen.queryByTestId("vie-scolaire-help-modal-title")).toBeNull();
  });
});
