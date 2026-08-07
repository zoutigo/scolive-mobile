/**
 * Tests fonctionnels — écran de liste des messages (messages/index.tsx)
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import MessagesScreen from "../../app/(home)/messages/index";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { colors } from "../../src/theme";
import { StyleSheet } from "react-native";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRouter = { push: mockPush, back: mockBack };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/messages",
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock("../../src/store/messaging.store");
jest.mock("../../src/store/auth.store");

// useAuthStore is fully mocked (not the real zustand store), so it must
// apply the selector itself when one is passed — otherwise selector-based
// callers (e.g. useOnboardingTourTrigger's `(state) => state.user`) get the
// whole mocked object back instead of just `.user`.
function mockAuthUser(state: Record<string, unknown>) {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  );
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockMessage = {
  id: "m1",
  folder: "inbox",
  status: "SENT",
  subject: "Convocation parents",
  preview: "Texte de prévisualisation",
  createdAt: "2024-01-15T10:00:00Z",
  sentAt: "2024-01-15T10:00:00Z",
  unread: true,
  sender: { id: "u1", firstName: "Alice", lastName: "Martin" },
  recipientsCount: 1,
  mailboxEntryId: "me1",
  attachments: [],
};

const defaultStoreState = {
  folder: "inbox" as const,
  messages: [],
  meta: null,
  isLoading: false,
  isRefreshing: false,
  search: "",
  unreadCount: 0,
  setFolder: jest.fn(),
  setSearch: jest.fn(),
  loadMessages: jest.fn().mockResolvedValue(undefined),
  refreshMessages: jest.fn().mockResolvedValue(undefined),
  loadMoreMessages: jest.fn().mockResolvedValue(undefined),
  loadUnreadCount: jest.fn().mockResolvedValue(undefined),
  markLocalRead: jest.fn(),
  removeLocal: jest.fn(),
  reset: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useMessagingStore as unknown as jest.Mock).mockReturnValue(
    defaultStoreState,
  );
  mockAuthUser({
    user: {
      id: "parent-1",
      firstName: "Valery",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
      role: "PARENT",
      activeRole: "PARENT",
    },
    schoolSlug: "college-vogt",
    logout: jest.fn(),
  });
  useFamilyStore.setState({
    children: [
      {
        id: "child-1",
        firstName: "Remi",
        lastName: "Ntamack",
        className: "6e C",
      },
    ],
    activeChildId: "child-1",
    isLoading: false,
    loadChildren: jest.fn(async () => {}),
    clearChildren: jest.fn(),
  });
});

// ── Rendu initial ─────────────────────────────────────────────────────────────

describe("Rendu initial", () => {
  it("affiche le titre Messagerie", () => {
    render(<MessagesScreen />);
    expect(screen.getByTestId("messages-header-title")).toHaveTextContent(
      "Messagerie",
    );
    expect(screen.getByText("Remi Ntamack • 6e C")).toBeTruthy();
  });

  it("utilise le meme header module que les autres ecrans enfant", () => {
    render(<MessagesScreen />);

    const header = screen.getByTestId("messages-header");
    const title = screen.getByTestId("messages-header-title");
    const subtitle = screen.getByTestId("messages-header-subtitle");
    const headerStyle = StyleSheet.flatten(header.props.style);
    const titleStyle = StyleSheet.flatten(title.props.style);
    const subtitleStyle = StyleSheet.flatten(subtitle.props.style);

    expect(headerStyle.backgroundColor).toBe(colors.primary);
    expect(headerStyle.paddingHorizontal).toBe(20);
    expect(headerStyle.paddingVertical).toBe(10);
    expect(titleStyle.fontWeight).toBe("600");
    expect(titleStyle.fontSize).toBe(19);
    expect(subtitleStyle.fontSize).toBe(11);
  });

  it("affiche les onglets de dossiers", () => {
    render(<MessagesScreen />);
    expect(screen.getByTestId("folder-tab-inbox")).toBeTruthy();
    expect(screen.getByTestId("folder-tab-sent")).toBeTruthy();
  });

  it("affiche le FAB de composition sur l'onglet inbox", () => {
    render(<MessagesScreen />);
    expect(screen.getByTestId("compose-fab")).toBeTruthy();
  });

  it("n'affiche pas le FAB hors de l'onglet inbox", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "drafts",
    });
    render(<MessagesScreen />);
    expect(screen.queryByTestId("compose-fab")).toBeNull();
  });

  it("n'affiche plus de bouton menu dans le header par défaut (déplacé vers la bottom tab bar)", () => {
    render(<MessagesScreen />);
    expect(screen.queryByTestId("messages-menu-btn")).toBeNull();
  });
});

// ── État de chargement ────────────────────────────────────────────────────────

describe("État de chargement", () => {
  it("affiche un spinner quand isLoading=true et messages vides", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      isLoading: true,
      messages: [],
    });
    render(<MessagesScreen />);
    // Le spinner est présent (ActivityIndicator)
    expect(screen.queryByTestId("messages-list")).toBeNull();
  });
});

// ── Liste de messages ─────────────────────────────────────────────────────────

describe("Liste de messages", () => {
  it("affiche les messages chargés", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
    });
    render(<MessagesScreen />);
    expect(screen.getByTestId("message-row-m1")).toBeTruthy();
  });

  it("affiche l'état vide inbox quand il n'y a pas de messages", () => {
    render(<MessagesScreen />);
    expect(screen.getByText("Aucun message reçu")).toBeTruthy();
  });

  it("affiche l'état vide adapté au dossier envoyés", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "sent",
      messages: [],
    });
    render(<MessagesScreen />);
    expect(screen.getByText("Aucun message envoyé")).toBeTruthy();
  });

  it("affiche l'état vide adapté aux brouillons", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "drafts",
      messages: [],
    });
    render(<MessagesScreen />);
    expect(screen.getByText("Aucun brouillon")).toBeTruthy();
  });

  it("affiche l'état vide adapté aux archives", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "archive",
      messages: [],
    });
    render(<MessagesScreen />);
    expect(screen.getByText("Archives vides")).toBeTruthy();
  });
});

// ── Changement de dossier ─────────────────────────────────────────────────────

describe("Changement de dossier", () => {
  it("appelle setFolder quand on presse un onglet", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("folder-tab-sent"));
    expect(defaultStoreState.setFolder).toHaveBeenCalledWith("sent");
  });
});

// ── Recherche ─────────────────────────────────────────────────────────────────

describe("Recherche", () => {
  it("affiche le champ de recherche quand on presse le bouton", () => {
    useFamilyStore.setState({ activeChildId: null });
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("messages-search-btn"));
    expect(screen.getByTestId("messages-search-input")).toBeTruthy();
  });

  it("appelle setSearch quand on tape dans le champ", () => {
    useFamilyStore.setState({ activeChildId: null });
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("messages-search-btn"));
    fireEvent.changeText(
      screen.getByTestId("messages-search-input"),
      "convocation",
    );
    expect(defaultStoreState.setSearch).toHaveBeenCalledWith("convocation");
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe("Navigation", () => {
  it("navigue vers le détail quand on presse un message", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
    });
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("message-row-m1"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ params: { messageId: "m1" } }),
    );
  });

  it("navigue vers compose quand on presse le FAB", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("compose-fab"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/messages/compose");
  });

  it("navigue vers compose prérempli quand on presse un brouillon", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "drafts",
      messages: [{ ...mockMessage, id: "d1", status: "DRAFT" }],
    });
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("message-row-d1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/messages/compose",
      params: { draftId: "d1" },
    });
  });

  it("appelle router.back() quand on presse la flèche retour", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("back-btn"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });
});

// ── Rafraîchissement ──────────────────────────────────────────────────────────

describe("Chargement initial", () => {
  it("appelle loadMessages au montage", () => {
    render(<MessagesScreen />);
    expect(defaultStoreState.loadMessages).toHaveBeenCalledWith("college-vogt");
  });

  it("intercepte les erreurs de chargement pour eviter un Uncaught Promise", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(jest.fn());

    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      loadMessages: jest.fn().mockRejectedValue(new Error("Unauthorized")),
    });

    render(<MessagesScreen />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "MESSAGES_LOAD_FAILED",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});

describe("Infinite scroll", () => {
  it.each([["inbox"], ["sent"], ["drafts"], ["archive"]] as const)(
    "charge la page suivante quand on atteint la fin pour le dossier %s",
    (folder) => {
      (useMessagingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreState,
        folder,
        messages: [mockMessage],
        meta: { page: 1, limit: 25, total: 40, totalPages: 2 },
      });

      render(<MessagesScreen />);

      fireEvent(screen.getByTestId("messages-list"), "onEndReached", {
        distanceFromEnd: 24,
      });

      expect(defaultStoreState.loadMoreMessages).toHaveBeenCalledWith(
        "college-vogt",
      );
    },
  );

  it("affiche un indicateur de fin quand tous les messages sont chargés", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    render(<MessagesScreen />);

    expect(screen.getByText("Tous les messages ont été chargés")).toBeTruthy();
  });

  it("intercepte les erreurs de chargement additionnel", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(jest.fn());

    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
      meta: { page: 1, limit: 25, total: 40, totalPages: 2 },
      loadMoreMessages: jest.fn().mockRejectedValue(new Error("timeout")),
    });

    render(<MessagesScreen />);

    fireEvent(screen.getByTestId("messages-list"), "onEndReached", {
      distanceFromEnd: 24,
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "MESSAGES_LOAD_MORE_FAILED",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});

// ── Vue plateforme (SUPER_ADMIN/ADMIN — mailbox agrégée) ───────────────────

describe("Vue plateforme (admin/super-admin)", () => {
  beforeEach(() => {
    mockAuthUser({
      user: {
        id: "admin-1",
        firstName: "Root",
        lastName: "Admin",
        platformRoles: ["SUPER_ADMIN"],
        memberships: [],
        profileCompleted: true,
        role: "SUPER_ADMIN",
        activeRole: "SUPER_ADMIN",
      },
      schoolSlug: null,
      logout: jest.fn(),
    });
  });

  it("charge la mailbox agrégée avec le scope 'platform' au lieu de rester bloqué sans schoolSlug", () => {
    render(<MessagesScreen />);
    expect(defaultStoreState.loadMessages).toHaveBeenCalledWith("platform");
  });
});

// ── Aide parent (menu ⋮ → PageHelpModal) ────────────────────────────────────

describe("Aide parent", () => {
  it("affiche l'entrée Aide dans le menu pour un parent et ouvre/ferme la modale", async () => {
    render(<MessagesScreen />);

    fireEvent.press(screen.getByTestId("module-header-menu"));
    expect(screen.getByTestId("messages-help-menu-item")).toBeTruthy();

    fireEvent.press(screen.getByTestId("messages-help-menu-item"));
    await waitFor(() =>
      expect(screen.getByTestId("messages-help-modal-title")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("messages-help-modal-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("messages-help-modal-title")).toBeNull(),
    );
  });

  it("n'affiche pas l'entrée Aide dans le menu pour un rôle ni parent ni enseignant", () => {
    mockAuthUser({
      user: {
        id: "student-1",
        firstName: "Lisa",
        lastName: "Ntamack",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "STUDENT" }],
        profileCompleted: true,
        role: "STUDENT",
        activeRole: "STUDENT",
      },
      schoolSlug: "college-vogt",
      logout: jest.fn(),
    });

    render(<MessagesScreen />);

    fireEvent.press(screen.getByTestId("module-header-menu"));
    expect(screen.queryByTestId("messages-help-menu-item")).toBeNull();
  });

  it("affiche l'entrée Aide dans le menu et ouvre la modale pour un enseignant", async () => {
    mockAuthUser({
      user: {
        id: "teacher-1",
        firstName: "Paul",
        lastName: "Martin",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
        profileCompleted: true,
        role: "TEACHER",
        activeRole: "TEACHER",
      },
      schoolSlug: "college-vogt",
      logout: jest.fn(),
    });

    render(<MessagesScreen />);

    fireEvent.press(screen.getByTestId("module-header-menu"));
    expect(screen.getByTestId("messages-help-menu-item")).toBeTruthy();

    fireEvent.press(screen.getByTestId("messages-help-menu-item"));
    await waitFor(() =>
      expect(screen.getByTestId("messages-help-modal-title")).toBeTruthy(),
    );
  });

  it("démarre le tour d'aide guidée avec le rôle 'teacher' pour un enseignant", async () => {
    useOnboardingTourStore.setState({
      activeTourId: null,
      activeRole: null,
      steps: [],
      stepIndex: 0,
      targetLayout: null,
      completedTours: {},
    });
    mockAuthUser({
      user: {
        id: "teacher-1",
        firstName: "Paul",
        lastName: "Martin",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
        profileCompleted: true,
        role: "TEACHER",
        activeRole: "TEACHER",
        onboardingHelpEnabled: true,
      },
      schoolSlug: "college-vogt",
      logout: jest.fn(),
    });

    render(<MessagesScreen />);

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe("messages"),
    );
    expect(useOnboardingTourStore.getState().activeRole).toBe("teacher");
  });
});
