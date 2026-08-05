/**
 * Vérifie la route self /homework/me (rôle STUDENT) : résout la classe
 * courante de l'élève via useSelfStudentContext puis redirige vers l'écran
 * Devoirs générique de cette classe, sans écran dupliqué.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import HomeworkMeRoute from "../../app/(home)/homework/me";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api");

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/(home)/homework/me",
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
  useDrawer: jest.fn(() => ({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  })),
}));

const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ schoolSlug: "college-vogt" } as never);
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

describe("HomeworkMeRoute", () => {
  it("résout sa propre classe puis redirige vers l'écran Devoirs de cette classe", async () => {
    render(<HomeworkMeRoute />);

    expect(screen.getByTestId("homework-me-loading")).toBeOnTheScreen();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/(home)/classes/[classId]/homework",
        params: { classId: "class-1" },
      });
    });
  });
});
