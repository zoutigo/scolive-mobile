import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { roomsApi } from "../../src/api/rooms.api";
import {
  roomFormSchema,
  RoomsAdminScreen,
} from "../../src/components/rooms/RoomsAdminScreen";
import type { AuthUser } from "../../src/types/auth.types";
import type { RoomCalendarEntry, RoomRow } from "../../src/types/room.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/rooms.api");

const mockBack = jest.fn();
const mockNavigate = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    navigate: mockNavigate,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockOpenDrawer = jest.fn();
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: mockOpenDrawer }),
}));

let mockAuthState: { schoolSlug: string | null; user: AuthUser | null };
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => mockAuthState,
}));

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: (selector: (state: unknown) => unknown) =>
    selector({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    }),
}));

const mockRoomsApi = roomsApi as jest.Mocked<typeof roomsApi>;

let roomsState: RoomRow[];
let calendarState: RoomCalendarEntry[];

function makeSchoolAdminUser(): AuthUser {
  return {
    id: "school-admin-1",
    firstName: "Sarah",
    lastName: "Moukouri",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    profileCompleted: true,
    role: "SCHOOL_ADMIN",
    activeRole: "SCHOOL_ADMIN",
    schoolName: "Collège Vogt",
  };
}

function seedApiState() {
  roomsState = [
    {
      id: "room-1",
      schoolId: "school-1",
      name: "Salle 12",
      description: "Bâtiment A",
      capacity: 30,
      maxConcurrentSlots: 1,
      status: "AVAILABLE",
      createdAt: "2026-01-10T08:00:00.000Z",
      updatedAt: "2026-01-10T08:00:00.000Z",
    },
    {
      id: "room-2",
      schoolId: "school-1",
      name: "Gymnase",
      description: null,
      capacity: null,
      maxConcurrentSlots: 2,
      status: "MAINTENANCE",
      createdAt: "2026-01-11T08:00:00.000Z",
      updatedAt: "2026-01-11T08:00:00.000Z",
    },
  ];
  calendarState = [];
}

beforeEach(() => {
  jest.clearAllMocks();
  seedApiState();
  mockAuthState = {
    schoolSlug: "college-vogt",
    user: makeSchoolAdminUser(),
  };

  mockRoomsApi.listRooms.mockImplementation(async () => roomsState);
  mockRoomsApi.getRoomCalendar.mockImplementation(async () => calendarState);
  mockRoomsApi.createRoom.mockImplementation(async (_slug, payload) => {
    const created: RoomRow = {
      id: "room-created",
      schoolId: "school-1",
      name: payload.name ?? "",
      description: payload.description ?? null,
      capacity: payload.capacity ?? null,
      maxConcurrentSlots: payload.maxConcurrentSlots ?? 1,
      status: payload.status ?? "AVAILABLE",
      createdAt: "2026-05-14T10:00:00.000Z",
      updatedAt: "2026-05-14T10:00:00.000Z",
    };
    roomsState = [...roomsState, created];
    return created;
  });
  mockRoomsApi.updateRoom.mockImplementation(async (_slug, roomId, payload) => {
    roomsState = roomsState.map((entry) =>
      entry.id === roomId
        ? {
            ...entry,
            name: payload.name ?? entry.name,
            description: payload.description ?? entry.description,
            capacity: payload.capacity ?? entry.capacity,
            maxConcurrentSlots:
              payload.maxConcurrentSlots ?? entry.maxConcurrentSlots,
            status: payload.status ?? entry.status,
          }
        : entry,
    );
    return roomsState.find((entry) => entry.id === roomId)!;
  });
  mockRoomsApi.deleteRoom.mockImplementation(async (_slug, roomId) => {
    roomsState = roomsState.filter((entry) => entry.id !== roomId);
    return { success: true };
  });
});

// ---------------------------------------------------------------------------
// Schema unit tests
// ---------------------------------------------------------------------------

describe("roomFormSchema", () => {
  it("exige un nom et un nombre de créneaux simultanés valides", () => {
    const result = roomFormSchema.safeParse({
      name: "",
      description: "",
      capacity: "",
      maxConcurrentSlots: "",
      status: "AVAILABLE",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.name).toContain(
      "Le nom de la salle est obligatoire.",
    );
    expect(result.error?.flatten().fieldErrors.maxConcurrentSlots).toContain(
      "Ce champ est obligatoire.",
    );
  });

  it("rejette une capacité non numérique", () => {
    const result = roomFormSchema.safeParse({
      name: "Salle 1",
      description: "",
      capacity: "abc",
      maxConcurrentSlots: "1",
      status: "AVAILABLE",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.capacity).toContain(
      "La capacité doit être un nombre entier positif.",
    );
  });

  it("valide une salle complète", () => {
    const result = roomFormSchema.safeParse({
      name: "Salle 1",
      description: "RDC",
      capacity: "30",
      maxConcurrentSlots: "1",
      status: "AVAILABLE",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Chargement et liste
// ---------------------------------------------------------------------------

describe("RoomsAdminScreen — chargement et liste", () => {
  it("charge le module et affiche les salles", async () => {
    render(<RoomsAdminScreen />);

    expect(await screen.findByTestId("rooms-admin-header")).toBeTruthy();
    expect(screen.getByText("2 salles")).toBeTruthy();
    expect(
      await screen.findByTestId("rooms-admin-room-row-room-1"),
    ).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-room-row-room-2")).toBeTruthy();
  });

  it("affiche un banner d'erreur si le chargement initial échoue", async () => {
    mockRoomsApi.listRooms.mockRejectedValueOnce(new Error("Erreur réseau"));

    render(<RoomsAdminScreen />);

    expect(await screen.findByTestId("rooms-admin-error-banner")).toBeTruthy();
  });

  it("affiche le fallback verrouillé hors rôle admin", async () => {
    mockAuthState = {
      schoolSlug: "college-vogt",
      user: {
        ...makeSchoolAdminUser(),
        role: "TEACHER",
        activeRole: "TEACHER",
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
      },
    };

    render(<RoomsAdminScreen />);

    expect(
      await screen.findByText("Module réservé aux comptes admin"),
    ).toBeTruthy();
    expect(mockRoomsApi.listRooms).not.toHaveBeenCalled();
  });

  it("les tabs Salles, Calendrier et Aide sont affichés", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-header");

    expect(await screen.findByTestId("rooms-admin-tab-list")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-tab-calendar")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-tab-help")).toBeTruthy();
  });

  it("le FAB est visible sur le tab liste", async () => {
    render(<RoomsAdminScreen />);
    expect(await screen.findByTestId("rooms-admin-fab")).toBeTruthy();
  });

  it("le FAB est masqué sur le tab calendrier et le tab aide", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-fab");

    fireEvent.press(await screen.findByTestId("rooms-admin-tab-calendar"));
    expect(screen.queryByTestId("rooms-admin-fab")).toBeNull();

    fireEvent.press(await screen.findByTestId("rooms-admin-tab-help"));
    expect(screen.queryByTestId("rooms-admin-fab")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tab forms — création
// ---------------------------------------------------------------------------

describe("RoomsAdminScreen — tab forms / création salle", () => {
  it("FAB → tab forms actif avec hero et champs de formulaire", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));

    expect(await screen.findByTestId("rooms-admin-forms-tab")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-form-hero")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-form-content")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-form-name")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-form-submit")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-form-cancel")).toBeTruthy();
  });

  it("hero de création affiche le bon titre", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));

    await screen.findByTestId("rooms-admin-form-hero");
    expect(screen.getByText("Créer une salle")).toBeTruthy();
  });

  it("les tabs Salles/Calendrier/Aide sont masqués sur le tab forms", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-forms-tab");

    expect(screen.queryByTestId("rooms-admin-tab-list")).toBeNull();
    expect(screen.queryByTestId("rooms-admin-fab")).toBeNull();
  });

  it("flèche header depuis tab forms → retour au tab liste, pas de router.back", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-forms-tab");

    fireEvent.press(screen.getByTestId("rooms-admin-back-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("rooms-admin-forms-tab")).toBeNull();
    });
    expect(await screen.findByTestId("rooms-admin-tab-list")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockRoomsApi.createRoom).not.toHaveBeenCalled();
  });

  it("bouton Annuler → retour au tab liste sans appel API", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-form-content");

    fireEvent.press(screen.getByTestId("rooms-admin-form-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("rooms-admin-forms-tab")).toBeNull();
    });
    expect(await screen.findByTestId("rooms-admin-tab-list")).toBeTruthy();
    expect(mockRoomsApi.createRoom).not.toHaveBeenCalled();
  });

  it("submit sur formulaire vide → erreur nom sans appel API", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-form-content");

    fireEvent.press(screen.getByTestId("rooms-admin-form-submit"));

    expect(
      await screen.findByTestId("rooms-admin-form-name-error"),
    ).toBeTruthy();
    expect(mockRoomsApi.createRoom).not.toHaveBeenCalled();
  });

  it("bouton submit toujours actif même sur formulaire vide", async () => {
    render(<RoomsAdminScreen />);
    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-form-content");

    const submitBtn = screen.getByTestId("rooms-admin-form-submit");
    expect(submitBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("crée une salle et affiche un toast succès", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("rooms-admin-form-name"),
      "Salle 42",
    );
    fireEvent.press(screen.getByTestId("rooms-admin-form-submit"));

    await waitFor(() => {
      expect(mockRoomsApi.createRoom).toHaveBeenCalledWith("college-vogt", {
        name: "Salle 42",
        description: undefined,
        capacity: undefined,
        maxConcurrentSlots: 1,
        status: "AVAILABLE",
      });
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Salle créée" }),
    );
  });

  it("succès création → retour au tab liste après 2 secondes", async () => {
    jest.useFakeTimers();

    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("rooms-admin-form-name"),
      "Salle 42",
    );
    fireEvent.press(screen.getByTestId("rooms-admin-form-submit"));

    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());

    expect(screen.getByTestId("rooms-admin-forms-tab")).toBeTruthy();

    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => {
      expect(screen.queryByTestId("rooms-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("rooms-admin-room-row-room-created"),
    ).toBeTruthy();

    jest.useRealTimers();
  });

  it("erreur création → showError + formulaire toujours visible", async () => {
    mockRoomsApi.createRoom.mockRejectedValueOnce(
      new Error("Salle déjà existante"),
    );

    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-fab"));
    await screen.findByTestId("rooms-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("rooms-admin-form-name"),
      "Salle 42",
    );
    fireEvent.press(screen.getByTestId("rooms-admin-form-submit"));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Opération impossible",
          message: "Salle déjà existante",
        }),
      );
    });
    expect(screen.getByTestId("rooms-admin-forms-tab")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tab forms — édition
// ---------------------------------------------------------------------------

describe("RoomsAdminScreen — édition d'une salle", () => {
  it("bouton édition → tab forms pré-rempli avec le nom existant", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-room-edit-room-1"));

    expect(await screen.findByTestId("rooms-admin-forms-tab")).toBeTruthy();
    expect(screen.getByText("Modifier la salle")).toBeTruthy();
    expect(screen.getByDisplayValue("Salle 12")).toBeTruthy();
  });

  it("modifie une salle et affiche un toast succès", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-room-edit-room-1"));
    await screen.findByTestId("rooms-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("rooms-admin-form-name"),
      "Salle 12 rénovée",
    );
    fireEvent.press(screen.getByTestId("rooms-admin-form-submit"));

    await waitFor(() => {
      expect(mockRoomsApi.updateRoom).toHaveBeenCalledWith(
        "college-vogt",
        "room-1",
        expect.objectContaining({ name: "Salle 12 rénovée" }),
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Salle modifiée" }),
    );
  });

  it("annuler depuis édition → retour au tab liste sans appel API", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-room-edit-room-1"));
    await screen.findByTestId("rooms-admin-form-content");

    fireEvent.press(screen.getByTestId("rooms-admin-form-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("rooms-admin-forms-tab")).toBeNull();
    });
    expect(mockRoomsApi.updateRoom).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------

describe("RoomsAdminScreen — suppression d'une salle", () => {
  it("supprime une salle et affiche un toast succès", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("rooms-admin-room-delete-room-1"),
    );
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockRoomsApi.deleteRoom).toHaveBeenCalledWith(
        "college-vogt",
        "room-1",
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Salle supprimée" }),
    );
  });
});
