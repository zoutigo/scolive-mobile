import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import {
  AppHeader,
  slugToDisplayName,
} from "../../src/components/navigation/AppHeader";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));

let mockPathname = "/feed";
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

const mockLogout = jest.fn();

// Utilisateur plateforme
const platformUser: AuthUser = {
  id: "u1",
  firstName: "Alice",
  lastName: "Admin",
  platformRoles: ["SUPER_ADMIN"],
  memberships: [],
  profileCompleted: true,
  role: "SUPER_ADMIN",
  activeRole: "SUPER_ADMIN",
};

// Utilisateur école (enseignant)
const teacherUser: AuthUser = {
  id: "u2",
  firstName: "Bob",
  lastName: "Enseignant",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "TEACHER" }],
  profileCompleted: true,
  role: "TEACHER",
  activeRole: "TEACHER",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/feed";
});

function renderHeader(user: AuthUser | null, schoolSlug: string | null = null) {
  mockUseAuthStore.mockReturnValue({
    user,
    schoolSlug,
    logout: mockLogout,
  } as ReturnType<typeof useAuthStore>);
  return render(<AppHeader />);
}

// ── slugToDisplayName ─────────────────────────────────────────────────────────

describe("slugToDisplayName", () => {
  it("convertit un slug simple", () => {
    expect(slugToDisplayName("college-vogt")).toBe("College Vogt");
  });

  it("met en majuscule chaque mot", () => {
    expect(slugToDisplayName("lycee-bilingue-de-yaounde")).toBe(
      "Lycee Bilingue De Yaounde",
    );
  });

  it("gère un mot unique", () => {
    expect(slugToDisplayName("scolive")).toBe("Scolive");
  });
});

// ── Variante par défaut (hors accueil) — titre uniquement ─────────────────────

describe("Variante par défaut (hors accueil)", () => {
  it("affiche le titre centré, sans logo ni bouton menu", () => {
    renderHeader(platformUser, null);
    expect(screen.getByTestId("app-header-title")).toBeTruthy();
    expect(screen.queryByTestId("header-logo")).toBeNull();
    expect(screen.queryByTestId("header-menu-btn")).toBeNull();
  });

  it('affiche "SCOLIVE" pour un rôle plateforme', () => {
    renderHeader(platformUser, null);
    expect(screen.getByTestId("app-header-title").props.children).toBe(
      "SCOLIVE",
    );
  });

  it('affiche "SCOLIVE" pour un rôle plateforme même si schoolSlug est encore présent (ancien membership école)', () => {
    renderHeader(platformUser, "college-vogt");
    expect(screen.getByTestId("app-header-title").props.children).toBe(
      "SCOLIVE",
    );
  });

  it("affiche le nom de l'école en majuscules pour un rôle école", () => {
    renderHeader(teacherUser, "college-vogt");
    expect(screen.getByTestId("app-header-title").props.children).toBe(
      "COLLEGE VOGT",
    );
  });

  it('affiche "SCOLIVE" quand schoolSlug est null', () => {
    renderHeader(teacherUser, null);
    expect(screen.getByTestId("app-header-title").props.children).toBe(
      "SCOLIVE",
    );
  });

  it("n'affiche pas le nom/rôle utilisateur ni le bouton auth", () => {
    renderHeader(teacherUser, "college-vogt");
    expect(screen.queryByTestId("app-header-home-name")).toBeNull();
    expect(screen.queryByTestId("app-header-auth-btn")).toBeNull();
  });
});

// ── Variante accueil — nom + rôle + bouton connexion/déconnexion ─────────────

describe("Variante accueil", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("affiche le nom complet de l'utilisateur à gauche, prénom en minuscule et nom en majuscules", () => {
    renderHeader(teacherUser, "college-vogt");
    expect(screen.getByTestId("app-header-home-name")).toHaveTextContent(
      "bob ENSEIGNANT",
    );
  });

  it("affiche le nom de l'école en sous-titre", () => {
    renderHeader(teacherUser, "college-vogt");
    expect(screen.getByTestId("app-header-home-school")).toHaveTextContent(
      "College Vogt",
    );
  });

  it("n'affiche pas le sous-titre école quand schoolSlug est absent", () => {
    renderHeader(teacherUser, null);
    expect(screen.queryByTestId("app-header-home-school")).toBeNull();
  });

  it("n'affiche pas le sous-titre école pour un rôle plateforme même si schoolSlug est encore présent (ancien membership école)", () => {
    renderHeader(platformUser, "college-vogt");
    expect(screen.queryByTestId("app-header-home-school")).toBeNull();
  });

  it("n'affiche ni le titre centré ni le logo", () => {
    renderHeader(teacherUser, "college-vogt");
    expect(screen.queryByTestId("app-header-title")).toBeNull();
    expect(screen.queryByTestId("header-logo")).toBeNull();
  });

  it("affiche le bouton auth (icône de déconnexion) quand un utilisateur est connecté", () => {
    renderHeader(teacherUser, "college-vogt");
    expect(screen.getByTestId("app-header-auth-btn")).toBeTruthy();
  });

  it("ouvre la confirmation de déconnexion au clic sur le bouton auth", () => {
    renderHeader(teacherUser, "college-vogt");
    fireEvent.press(screen.getByTestId("app-header-auth-btn"));
    expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy();
  });

  it("appelle logout() après confirmation", () => {
    renderHeader(teacherUser, "college-vogt");
    fireEvent.press(screen.getByTestId("app-header-auth-btn"));
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas logout() si on annule la confirmation", () => {
    renderHeader(teacherUser, "college-vogt");
    fireEvent.press(screen.getByTestId("app-header-auth-btn"));
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("propose une connexion si aucun utilisateur n'est présent", () => {
    mockPathname = "/";
    renderHeader(null, null);
    fireEvent.press(screen.getByTestId("app-header-auth-btn"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

describe("Reconnaissance de la route accueil", () => {
  it('"/" est considéré comme la page accueil', () => {
    mockPathname = "/";
    renderHeader(teacherUser, "college-vogt");
    expect(screen.getByTestId("app-header-home-name")).toBeTruthy();
  });

  it('"/(home)/" est considéré comme la page accueil (groupe expo-router)', () => {
    mockPathname = "/(home)/";
    renderHeader(teacherUser, "college-vogt");
    expect(screen.getByTestId("app-header-home-name")).toBeTruthy();
  });

  it("toute autre route n'est pas considérée comme accueil", () => {
    mockPathname = "/account";
    renderHeader(teacherUser, "college-vogt");
    expect(screen.queryByTestId("app-header-home-name")).toBeNull();
    expect(screen.getByTestId("app-header-title")).toBeTruthy();
  });
});
