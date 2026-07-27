import React from "react";
import { StyleSheet } from "react-native";
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
import { colors } from "../../src/theme";
import type { AuthUser } from "../../src/types/auth.types";
import type { RoomCalendarEntry, RoomRow } from "../../src/types/room.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/rooms.api");

const mockBack = jest.fn();
const mockNavigate = jest.fn();
const mockPush = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    navigate: mockNavigate,
    push: mockPush,
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

  mockRoomsApi.listRooms.mockImplementation(async () => ({
    items: roomsState,
    page: 1,
    limit: 20,
    total: roomsState.length,
  }));
  mockRoomsApi.getRoom.mockImplementation(
    async (_slug, roomId) => roomsState.find((entry) => entry.id === roomId)!,
  );
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
    expect(
      await screen.findByTestId("rooms-admin-room-row-room-1"),
    ).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-room-row-room-2")).toBeTruthy();
    expect(screen.getByTestId("rooms-admin-filter-count-badge")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
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

async function openRoomMenu(roomId: string) {
  fireEvent.press(await screen.findByTestId(`rooms-admin-room-menu-${roomId}`));
}

describe("RoomsAdminScreen — menu contextuel (trois points) d'une salle", () => {
  it("ouvre un menu avec Modifier et Supprimer au clic sur les trois points", async () => {
    render(<RoomsAdminScreen />);

    await openRoomMenu("room-1");

    expect(
      await screen.findByTestId("rooms-admin-room-menu-edit-room-1"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("rooms-admin-room-menu-delete-room-1"),
    ).toBeTruthy();
  });
});

describe("RoomsAdminScreen — édition d'une salle", () => {
  it("menu → Modifier → tab forms pré-rempli avec le nom existant", async () => {
    render(<RoomsAdminScreen />);

    await openRoomMenu("room-1");
    fireEvent.press(
      await screen.findByTestId("rooms-admin-room-menu-edit-room-1"),
    );

    expect(await screen.findByTestId("rooms-admin-forms-tab")).toBeTruthy();
    expect(screen.getByText("Modifier la salle")).toBeTruthy();
    expect(screen.getByDisplayValue("Salle 12")).toBeTruthy();
  });

  it("modifie une salle et affiche un toast succès", async () => {
    render(<RoomsAdminScreen />);

    await openRoomMenu("room-1");
    fireEvent.press(
      await screen.findByTestId("rooms-admin-room-menu-edit-room-1"),
    );
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

    await openRoomMenu("room-1");
    fireEvent.press(
      await screen.findByTestId("rooms-admin-room-menu-edit-room-1"),
    );
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

    await openRoomMenu("room-1");
    fireEvent.press(
      await screen.findByTestId("rooms-admin-room-menu-delete-room-1"),
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

// ---------------------------------------------------------------------------
// Recherche, filtres, pagination, navigation (pattern improve-mobile-search)
// ---------------------------------------------------------------------------

describe("RoomsAdminScreen — recherche live", () => {
  it("recherche live : relance listRooms avec le terme après le debounce", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");
    mockRoomsApi.listRooms.mockClear();

    fireEvent.changeText(screen.getByTestId("rooms-admin-search"), "gym");
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(mockRoomsApi.listRooms).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ search: "gym" }),
      );
    });
  });

  it("bouton clear vide la recherche et relance sans terme", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");

    fireEvent.changeText(screen.getByTestId("rooms-admin-search"), "gym");
    await new Promise((resolve) => setTimeout(resolve, 650));
    await waitFor(() =>
      expect(mockRoomsApi.listRooms).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ search: "gym" }),
      ),
    );

    mockRoomsApi.listRooms.mockClear();
    fireEvent.press(screen.getByTestId("rooms-admin-search-clear"));
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(mockRoomsApi.listRooms).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ search: undefined }),
      );
    });
  });
});

describe("RoomsAdminScreen — panneau de filtres", () => {
  it("le bouton filtre devient actif (teal plein) seulement après Apply", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");

    const toggle = screen.getByTestId("rooms-admin-filter-toggle");
    expect(StyleSheet.flatten(toggle.props.style).backgroundColor).not.toBe(
      colors.accentTeal,
    );

    fireEvent.press(toggle);
    fireEvent.press(
      await screen.findByTestId("rooms-admin-filter-status-MAINTENANCE"),
    );
    expect(StyleSheet.flatten(toggle.props.style).backgroundColor).not.toBe(
      colors.accentTeal,
    );

    fireEvent.press(screen.getByTestId("rooms-admin-filter-apply"));

    await waitFor(() => {
      expect(
        StyleSheet.flatten(
          screen.getByTestId("rooms-admin-filter-toggle").props.style,
        ).backgroundColor,
      ).toBe(colors.accentTeal);
    });
  });

  it("Apply ferme le panneau et relance la liste avec le filtre de statut appliqué, page 1", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");
    mockRoomsApi.listRooms.mockClear();

    fireEvent.press(screen.getByTestId("rooms-admin-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("rooms-admin-filter-status-MAINTENANCE"),
    );
    fireEvent.press(screen.getByTestId("rooms-admin-filter-apply"));

    expect(screen.queryByTestId("rooms-admin-filter-panel")).toBeNull();
    await waitFor(() => {
      expect(mockRoomsApi.listRooms).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ status: "MAINTENANCE", page: 1 }),
      );
    });
  });

  it("Reset vide le brouillon et le filtre appliqué, le panneau reste ouvert", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");

    fireEvent.press(screen.getByTestId("rooms-admin-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("rooms-admin-filter-status-MAINTENANCE"),
    );
    fireEvent.press(screen.getByTestId("rooms-admin-filter-apply"));
    await waitFor(() =>
      expect(
        StyleSheet.flatten(
          screen.getByTestId("rooms-admin-filter-toggle").props.style,
        ).backgroundColor,
      ).toBe(colors.accentTeal),
    );

    fireEvent.press(screen.getByTestId("rooms-admin-filter-toggle"));
    fireEvent.press(await screen.findByTestId("rooms-admin-filter-reset"));

    expect(screen.getByTestId("rooms-admin-filter-panel")).toBeTruthy();
    await waitFor(() => {
      expect(
        StyleSheet.flatten(
          screen.getByTestId("rooms-admin-filter-toggle").props.style,
        ).backgroundColor,
      ).not.toBe(colors.accentTeal);
    });
  });

  it("Close abandonne le brouillon sans appeler l'API avec le filtre en cours", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");
    mockRoomsApi.listRooms.mockClear();

    fireEvent.press(screen.getByTestId("rooms-admin-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("rooms-admin-filter-status-MAINTENANCE"),
    );
    fireEvent.press(screen.getByTestId("rooms-admin-filter-close"));

    expect(screen.queryByTestId("rooms-admin-filter-panel")).toBeNull();
    expect(mockRoomsApi.listRooms).not.toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ status: "MAINTENANCE" }),
    );
  });

  it("le FAB est masqué pendant que le panneau de filtres est ouvert", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-fab");

    fireEvent.press(screen.getByTestId("rooms-admin-filter-toggle"));
    expect(screen.queryByTestId("rooms-admin-fab")).toBeNull();

    fireEvent.press(screen.getByTestId("rooms-admin-filter-close"));
    expect(await screen.findByTestId("rooms-admin-fab")).toBeTruthy();
  });
});

describe("RoomsAdminScreen — pagination serveur", () => {
  it("charge la page 1 par défaut", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");

    expect(mockRoomsApi.listRooms).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ page: 1 }),
    );
  });

  it("onEndReached charge la page suivante quand hasMore est vrai", async () => {
    mockRoomsApi.listRooms.mockImplementation(async () => ({
      items: roomsState,
      page: 1,
      limit: 1,
      total: 5,
    }));

    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");
    mockRoomsApi.listRooms.mockClear();
    mockRoomsApi.listRooms.mockImplementation(async () => ({
      items: [
        {
          id: "room-3",
          schoolId: "school-1",
          name: "Salle 3",
          description: null,
          capacity: null,
          maxConcurrentSlots: 1,
          status: "AVAILABLE",
          createdAt: "2026-01-12T08:00:00.000Z",
          updatedAt: "2026-01-12T08:00:00.000Z",
        },
      ],
      page: 2,
      limit: 1,
      total: 5,
    }));

    fireEvent(screen.getByTestId("rooms-admin-list"), "onEndReached", {
      distanceFromEnd: 0,
    });

    await waitFor(() => {
      expect(mockRoomsApi.listRooms).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("ne relance pas onLoadMore si hasMore est faux", async () => {
    render(<RoomsAdminScreen />);
    await screen.findByTestId("rooms-admin-room-row-room-1");
    mockRoomsApi.listRooms.mockClear();

    fireEvent(screen.getByTestId("rooms-admin-list"), "onEndReached", {
      distanceFromEnd: 0,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockRoomsApi.listRooms).not.toHaveBeenCalled();
  });
});

describe("RoomsAdminScreen — carte salle : navigation et accent visuel", () => {
  it("clique sur la carte → navigation vers la page détail de la salle", async () => {
    render(<RoomsAdminScreen />);

    fireEvent.press(await screen.findByTestId("rooms-admin-room-row-room-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/salles/[roomId]",
      params: { roomId: "room-1" },
    });
  });

  it("la barre d'accent est rouge pour une salle non fonctionnelle (statut != AVAILABLE)", async () => {
    render(<RoomsAdminScreen />);

    const accentAvailable = await screen.findByTestId(
      "rooms-admin-room-accent-room-1",
    );
    const accentMaintenance = await screen.findByTestId(
      "rooms-admin-room-accent-room-2",
    );

    expect(
      StyleSheet.flatten(accentAvailable.props.style).backgroundColor,
    ).not.toBe(colors.notification);
    expect(
      StyleSheet.flatten(accentMaintenance.props.style).backgroundColor,
    ).toBe(colors.notification);
  });
});
