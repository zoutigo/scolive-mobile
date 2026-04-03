import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import {
  AppHeader,
  slugToDisplayName,
} from "../../src/components/navigation/AppHeader";
import { useAuthStore } from "../../src/store/auth.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;

const mockOpenDrawer = jest.fn();

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

// Utilisateur parent
const parentUser: AuthUser = {
  id: "u3",
  firstName: "Claire",
  lastName: "Parent",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "PARENT" }],
  profileCompleted: true,
  role: "PARENT",
  activeRole: "PARENT",
};

// Utilisateur élève
const studentUser: AuthUser = {
  id: "u4",
  firstName: "Denis",
  lastName: "Eleve",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "STUDENT" }],
  profileCompleted: true,
  role: "STUDENT",
  activeRole: "STUDENT",
};

// Utilisateur SCHOOL_ADMIN
const schoolAdminUser: AuthUser = {
  id: "u5",
  firstName: "Eve",
  lastName: "Directrice",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
  profileCompleted: true,
  role: "SCHOOL_ADMIN",
  activeRole: "SCHOOL_ADMIN",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
    isDrawerOpen: false,
  });
});

function renderHeader(user: AuthUser | null, schoolSlug: string | null = null) {
  mockUseAuthStore.mockReturnValue({ user, schoolSlug } as ReturnType<
    typeof useAuthStore
  >);
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

// ── Logo ─────────────────────────────────────────────────────────────────────

describe("Logo", () => {
  it("affiche le logo Scolive (testID header-logo)", () => {
    renderHeader(platformUser, null);
    expect(screen.getByTestId("header-logo")).toBeTruthy();
  });
});

// ── Titre — rôle plateforme ───────────────────────────────────────────────────

describe("Titre — rôles plateforme", () => {
  const platformRoles = ["SUPER_ADMIN", "ADMIN", "SALES", "SUPPORT"] as const;

  platformRoles.forEach((role) => {
    it(`affiche "SCOLIVE" en majuscules pour ${role}`, () => {
      const user: AuthUser = {
        ...platformUser,
        platformRoles: [role],
        role,
        activeRole: role,
      };
      renderHeader(user, null);
      expect(screen.getByTestId("header-title").props.children).toBe("SCOLIVE");
    });
  });
});

// ── Titre — rôles école ───────────────────────────────────────────────────────

describe("Titre — rôles école (nom de l'établissement)", () => {
  const cases: [string, AuthUser][] = [
    ["TEACHER", teacherUser],
    ["PARENT", parentUser],
    ["STUDENT", studentUser],
    ["SCHOOL_ADMIN", schoolAdminUser],
  ];

  cases.forEach(([role, user]) => {
    it(`affiche le nom de l'école en majuscules pour ${role}`, () => {
      renderHeader(user, "college-vogt");
      expect(screen.getByTestId("header-title").props.children).toBe(
        "COLLEGE VOGT",
      );
    });
  });

  it("affiche le slug transformé en majuscules pour un slug complexe", () => {
    renderHeader(teacherUser, "lycee-bilingue-de-yaounde");
    expect(screen.getByTestId("header-title").props.children).toBe(
      "LYCEE BILINGUE DE YAOUNDE",
    );
  });

  it('affiche "SCOLIVE" quand schoolSlug est null', () => {
    renderHeader(teacherUser, null);
    expect(screen.getByTestId("header-title").props.children).toBe("SCOLIVE");
  });
});

// ── Bouton menu ───────────────────────────────────────────────────────────────

describe("Bouton menu", () => {
  it("est présent dans le header (testID header-menu-btn)", () => {
    renderHeader(platformUser, null);
    expect(screen.getByTestId("header-menu-btn")).toBeTruthy();
  });

  it("a le label d'accessibilité 'Ouvrir le menu'", () => {
    renderHeader(platformUser, null);
    expect(screen.getByTestId("header-menu-btn").props.accessibilityLabel).toBe(
      "Ouvrir le menu",
    );
  });

  it("appelle openDrawer au clic", () => {
    renderHeader(platformUser, null);
    fireEvent.press(screen.getByTestId("header-menu-btn"));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas openDrawer si on ne clique pas", () => {
    renderHeader(platformUser, null);
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });
});
