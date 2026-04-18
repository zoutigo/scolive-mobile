/**
 * Tests du composant ParentHome.
 * - Rendu des enfants (nom seul, pas de boutons rapides)
 * - Clic sur un enfant → setActiveChild + navigation vers Accueil enfant
 * - Compteur d'enfants intact
 * - États : chargement, vide, avec enfants
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ParentHome } from "../../src/components/home/ParentHome";
import { useFamilyStore } from "../../src/store/family.store";
import { useMessagingStore } from "../../src/store/messaging.store";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const parentUser: AuthUser = {
  id: "u1",
  firstName: "Robert",
  lastName: "Ntamack",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "PARENT" }],
  profileCompleted: true,
  role: "PARENT",
  activeRole: "PARENT",
};

const child1 = {
  id: "c1",
  firstName: "Lisa",
  lastName: "Ntamack",
  className: "6e A",
};
const child2 = {
  id: "c2",
  firstName: "Paul",
  lastName: "Ntamack",
  className: "5e B",
};

beforeEach(() => {
  jest.clearAllMocks();
  useFamilyStore.setState({
    children: [],
    isLoading: false,
    activeChildId: null,
  });
  useMessagingStore.setState({
    folder: "inbox",
    messages: [],
    meta: null,
    isLoading: false,
    isRefreshing: false,
    search: "",
    unreadCount: 0,
    loadUnreadCount: jest.fn().mockResolvedValue(undefined),
  });
});

// ── Rendu — état vide ─────────────────────────────────────────────────────────

describe("État vide", () => {
  it("affiche le message quand aucun enfant n'est associé", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Aucun enfant associé")).toBeTruthy();
  });

  it("n'affiche pas le compteur quand il n'y a pas d'enfants", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.queryByTestId("children-count-badge")).toBeNull();
  });
});

// ── Rendu — avec enfants ──────────────────────────────────────────────────────

describe("Avec enfants", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
  });

  it("affiche le nom complet de chaque enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Ntamack Lisa")).toBeTruthy();
    expect(screen.getByText("Ntamack Paul")).toBeTruthy();
  });

  it("n'affiche pas de boutons d'accès rapide sur la carte enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.queryByText("Notes")).toBeNull();
    expect(screen.queryByText("Emploi du temps")).toBeNull();
  });

  it("affiche le compteur avec le bon nombre", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("children-count-badge")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("affiche une carte par enfant avec le bon testID", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("child-card-c1")).toBeTruthy();
    expect(screen.getByTestId("child-card-c2")).toBeTruthy();
  });
});

// ── Clic sur un enfant ────────────────────────────────────────────────────────

describe("Clic sur un enfant", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
  });

  it("appelle setActiveChild avec l'id de l'enfant cliqué", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(useFamilyStore.getState().activeChildId).toBe("c1");
  });

  it("navigue vers l'accueil enfant du premier enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "c1" },
    });
  });

  it("setActiveChild est appelé avec le bon id pour le deuxième enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c2"));
    expect(useFamilyStore.getState().activeChildId).toBe("c2");
  });

  it("navigue vers l'accueil enfant du deuxième enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "c2" },
    });
  });
});

// ── Synchronisation avec le store ─────────────────────────────────────────────

describe("Synchronisation activeChildId", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
  });

  it("après clic, activeChildId est mis à jour dans le store", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(useFamilyStore.getState().activeChildId).toBeNull();
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(useFamilyStore.getState().activeChildId).toBe("c1");
  });

  it("changer d'enfant met à jour activeChildId", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(useFamilyStore.getState().activeChildId).toBe("c1");
    fireEvent.press(screen.getByTestId("child-card-c2"));
    expect(useFamilyStore.getState().activeChildId).toBe("c2");
  });
});

// ── Compteur d'enfants ────────────────────────────────────────────────────────

describe("Compteur d'enfants", () => {
  it("affiche '1' avec un seul enfant", () => {
    useFamilyStore.setState({ children: [child1], isLoading: false });
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("affiche '2' avec deux enfants", () => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("2")).toBeTruthy();
  });
});

describe("Accès rapides", () => {
  it("navigue vers le fil d'actualité depuis le raccourci d'accueil", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByTestId("quick-link-fil-d-actualit"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/feed");
  });

  it("navigue vers la messagerie depuis le raccourci d'accueil", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByTestId("quick-link-messagerie"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("charge le compteur de messages non lus à l'ouverture", () => {
    const loadUnreadCountSpy = jest.fn().mockResolvedValue(undefined);
    useMessagingStore.setState({ loadUnreadCount: loadUnreadCountSpy });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(loadUnreadCountSpy).toHaveBeenCalledWith("college-vogt");
  });

  it("affiche le badge de non lus sur le raccourci messagerie", () => {
    useMessagingStore.setState({ unreadCount: 7 });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.getByTestId("quick-link-messagerie-badge")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("masque le badge si aucun message n'est non lu", () => {
    useMessagingStore.setState({ unreadCount: 0 });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.queryByTestId("quick-link-messagerie-badge")).toBeNull();
  });

  it("borne l'affichage du badge à 99+", () => {
    useMessagingStore.setState({ unreadCount: 124 });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.getByText("99+")).toBeTruthy();
  });
});
