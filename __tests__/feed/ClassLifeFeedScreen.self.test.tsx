/**
 * Vérifie le mode "self" de ClassLifeFeedScreen (route /vie-de-classe/me,
 * utilisée par le rôle STUDENT) : résolution de sa propre classe sans
 * childId, retour vers l'accueil plutôt que vers l'accueil d'un enfant.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { ClassLifeFeedScreen } from "../../src/components/feed/ClassLifeFeedScreen";
import { feedApi } from "../../src/api/feed.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/feed.api");
jest.mock("../../src/api/timetable.api");

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
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

const api = feedApi as jest.Mocked<typeof feedApi>;
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
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Lisa",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "STUDENT" }],
      profileCompleted: true,
      role: "STUDENT",
      activeRole: "STUDENT",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });
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
  api.list.mockResolvedValue({
    items: [],
    meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
  } as never);
});

describe("ClassLifeFeedScreen — mode self (élève)", () => {
  it("résout sa propre classe (sans childId) et charge le fil de classe", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(mockTimetableApi.getMyTimetable).toHaveBeenCalledWith(
        "college-vogt",
        { childId: undefined },
      );
    });

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ viewScope: "CLASS", classId: "class-1" }),
      );
    });

    expect(screen.getByText(/Lisa Mbele/)).toBeOnTheScreen();
  });

  it("revient à l'accueil (pas à l'accueil d'un enfant) via le bouton retour", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-class-feed-back")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("reste pleinement interactif pour l'élève (FAB de publication visible)", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("child-class-feed-compose-fab"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-compose-fab"));
    expect(screen.getByTestId("feed-composer-card")).toBeOnTheScreen();
  });
});
