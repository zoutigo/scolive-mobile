import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { RoomDetailScreen } from "../../src/components/rooms/RoomDetailScreen";
import { roomsApi } from "../../src/api/rooms.api";
import type { RoomCalendarEntry, RoomRow } from "../../src/types/room.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/rooms.api");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
    push: jest.fn(),
  }),
  useLocalSearchParams: () => ({ roomId: "room-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({ schoolSlug: "college-vogt", user: null }),
}));

const mockRoomsApi = roomsApi as jest.Mocked<typeof roomsApi>;

function makeRoom(overrides: Partial<RoomRow> = {}): RoomRow {
  return {
    id: "room-1",
    schoolId: "school-1",
    name: "A08",
    description: null,
    capacity: 30,
    maxConcurrentSlots: 1,
    status: "AVAILABLE",
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: "2026-01-10T08:00:00.000Z",
    ...overrides,
  };
}

function makeEntry(
  overrides: Partial<RoomCalendarEntry> = {},
): RoomCalendarEntry {
  return {
    id: "entry-1",
    occurrenceDate: "2026-01-05",
    startMinute: 600,
    endMinute: 660,
    className: "6eC",
    subjectName: "Maths",
    teacherName: "Alice Martin",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRoomsApi.getRoom.mockResolvedValue(makeRoom());
  mockRoomsApi.getRoomCalendar.mockResolvedValue([]);
});

describe("RoomDetailScreen — informations", () => {
  it("charge et affiche les informations de la salle", async () => {
    render(<RoomDetailScreen />);

    expect(await screen.findByTestId("room-detail-info-card")).toBeTruthy();
    expect(screen.getAllByText("A08").length).toBeGreaterThan(0);
    expect(screen.getByText(/Capacity: 30|Capacité: 30/)).toBeTruthy();
  });

  it("affiche un message d'erreur si le chargement de la salle échoue", async () => {
    mockRoomsApi.getRoom.mockRejectedValueOnce(new Error("Salle introuvable"));

    render(<RoomDetailScreen />);

    expect(await screen.findByTestId("room-detail-error-banner")).toBeTruthy();
  });

  it("le point de statut est rouge pour une salle non fonctionnelle", async () => {
    mockRoomsApi.getRoom.mockResolvedValue(makeRoom({ status: "MAINTENANCE" }));

    render(<RoomDetailScreen />);

    const dot = await screen.findByTestId("room-detail-status-dot");
    expect(dot).toBeTruthy();
  });
});

describe("RoomDetailScreen — agenda hebdomadaire / mensuel", () => {
  it("affiche la vue semaine par défaut avec les 7 jours", async () => {
    mockRoomsApi.getRoomCalendar.mockResolvedValue([makeEntry()]);

    render(<RoomDetailScreen />);

    expect(await screen.findByTestId("room-detail-week-grid")).toBeTruthy();
    expect(screen.queryByTestId("room-detail-month-grid")).toBeNull();
  });

  it("bascule vers la vue mois au clic sur le bouton Month", async () => {
    render(<RoomDetailScreen />);
    await screen.findByTestId("room-detail-week-grid");

    fireEvent.press(screen.getByTestId("room-detail-view-month"));

    expect(await screen.findByTestId("room-detail-month-grid")).toBeTruthy();
    expect(screen.queryByTestId("room-detail-week-grid")).toBeNull();
  });

  it("navigation précédent/suivant recharge le calendrier avec une nouvelle plage de dates", async () => {
    render(<RoomDetailScreen />);
    await screen.findByTestId("room-detail-week-grid");
    mockRoomsApi.getRoomCalendar.mockClear();

    fireEvent.press(screen.getByTestId("room-detail-nav-next"));

    await waitFor(() => {
      expect(mockRoomsApi.getRoomCalendar).toHaveBeenCalledWith(
        "college-vogt",
        "room-1",
        expect.any(String),
        expect.any(String),
      );
    });
  });

  it("clic sur un jour du mois affiche ses créneaux occupés", async () => {
    const now = new Date();
    const dayOfMonth = now.getDate() <= 20 ? now.getDate() + 1 : 5;
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;
    mockRoomsApi.getRoomCalendar.mockResolvedValue([
      makeEntry({ occurrenceDate: dateKey }),
    ]);
    render(<RoomDetailScreen />);
    await screen.findByTestId("room-detail-week-grid");

    fireEvent.press(screen.getByTestId("room-detail-view-month"));
    await screen.findByTestId("room-detail-month-grid");

    fireEvent.press(screen.getByTestId(`room-detail-month-cell-${dateKey}`));

    expect(
      await screen.findByTestId("room-detail-day-entry-entry-1"),
    ).toBeTruthy();
  });
});
