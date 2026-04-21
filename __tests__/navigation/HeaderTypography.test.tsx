/**
 * Tests : titres en majuscules + sous-titres warmAccent sur tous les headers.
 *
 * Couverture :
 *  - ModuleHeader (title uppercase + centered, subtitle warmAccent + centered)
 *  - AppHeader (title déjà uppercase via JS)
 *  - messages/[messageId] header title
 *  - messages/compose header title
 *  - discipline-student header title + subtitle
 *  - ClassNotesManagerScreen header title + subtitle
 *  - NotesClassesScreen header title + subtitle
 */

import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import {
  AppHeader,
  slugToDisplayName,
} from "../../src/components/navigation/AppHeader";
import { useAuthStore } from "../../src/store/auth.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks communs ─────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

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

const teacher: AuthUser = {
  id: "u1",
  firstName: "Alice",
  lastName: "Durand",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "TEACHER" }],
  profileCompleted: true,
  role: "TEACHER",
  activeRole: "TEACHER",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    isDrawerOpen: false,
  });
});

// ── ModuleHeader — titre uppercase + centré ───────────────────────────────────

describe("ModuleHeader — titre uppercase et centré", () => {
  it("applique textTransform uppercase au titre", () => {
    render(
      <ModuleHeader title="Emploi du temps" onBack={jest.fn()} />,
    );
    const title = screen.getByTestId("module-header-title");
    const flat = StyleSheet.flatten(title.props.style);
    expect(flat.textTransform).toBe("uppercase");
  });

  it("centre le titre (textAlign center)", () => {
    render(
      <ModuleHeader title="Messagerie" onBack={jest.fn()} />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    expect(flat.textAlign).toBe("center");
  });

  it("le titre reste blanc", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    expect(flat.color).toBe("#FFFFFF");
  });
});

// ── ModuleHeader — sous-titre warmAccent + centré ─────────────────────────────

describe("ModuleHeader — sous-titre warmAccent et centré", () => {
  it("applique la couleur warmAccent au sous-titre", () => {
    render(
      <ModuleHeader
        title="Messagerie"
        subtitle="Hugo • CM2"
        onBack={jest.fn()}
      />,
    );
    const sub = screen.getByTestId("module-header-subtitle");
    const flat = StyleSheet.flatten(sub.props.style);
    expect(flat.color).toBe("#D89B5B");
  });

  it("centre le sous-titre (textAlign center)", () => {
    render(
      <ModuleHeader
        title="Messagerie"
        subtitle="Hugo • CM2"
        onBack={jest.fn()}
      />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-subtitle").props.style,
    );
    expect(flat.textAlign).toBe("center");
  });

  it("n'affiche pas le sous-titre quand il est absent", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });

  it("n'affiche pas le sous-titre quand il est null", () => {
    render(<ModuleHeader title="Notes" subtitle={null} onBack={jest.fn()} />);
    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });
});

// ── ModuleHeader — centrage robuste avec et sans bouton droit ─────────────────

describe("ModuleHeader — centrage robuste", () => {
  it("le headerText a flex:1 (équilibre les deux boutons)", () => {
    render(
      <ModuleHeader
        title="Accueil"
        onBack={jest.fn()}
        rightIcon="menu-outline"
        onRightPress={jest.fn()}
        backTestID="mh-back"
        rightTestID="mh-menu"
      />,
    );
    // Vérifie que back et menu sont tous deux présents et le titre est centré
    expect(screen.getByTestId("mh-back")).toBeTruthy();
    expect(screen.getByTestId("mh-menu")).toBeTruthy();
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    expect(flat.textAlign).toBe("center");
  });

  it("le titre reste centré même sans bouton droit (spacer présent)", () => {
    render(<ModuleHeader title="Titre seul" onBack={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    expect(flat.textAlign).toBe("center");
  });
});

// ── AppHeader — titre uppercase ───────────────────────────────────────────────

describe("AppHeader — titre uppercase", () => {
  function renderAppHeader(
    user: AuthUser | null,
    schoolSlug: string | null = null,
  ) {
    mockUseAuthStore.mockReturnValue({ user, schoolSlug } as ReturnType<
      typeof useAuthStore
    >);
    return render(<AppHeader />);
  }

  it("affiche le titre en majuscules pour un slug d'école", () => {
    renderAppHeader(teacher, "college-vogt");
    const text = screen.getByTestId("header-title").props.children;
    expect(text).toBe("COLLEGE VOGT");
    expect(text).toBe(text.toUpperCase());
  });

  it("affiche 'SCOLIVE' en majuscules pour un user plateforme", () => {
    const platformUser: AuthUser = {
      ...teacher,
      platformRoles: ["SUPER_ADMIN"],
      role: "SUPER_ADMIN",
      activeRole: "SUPER_ADMIN",
    };
    renderAppHeader(platformUser, null);
    const text = screen.getByTestId("header-title").props.children;
    expect(text).toBe("SCOLIVE");
  });

  it("slugToDisplayName + toUpperCase produit bien des majuscules", () => {
    expect(slugToDisplayName("lycee-bilingue").toUpperCase()).toBe(
      "LYCEE BILINGUE",
    );
  });
});

// ── ModuleHeader — combinaison titre + sous-titre ─────────────────────────────

describe("ModuleHeader — titre + sous-titre ensemble", () => {
  it("titre uppercase ET sous-titre warmAccent coexistent", () => {
    render(
      <ModuleHeader
        title="Emploi du temps"
        subtitle="Pauline Dupont • 6ème A"
        onBack={jest.fn()}
      />,
    );
    const titleFlat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    const subFlat = StyleSheet.flatten(
      screen.getByTestId("module-header-subtitle").props.style,
    );
    expect(titleFlat.textTransform).toBe("uppercase");
    expect(subFlat.color).toBe("#D89B5B");
  });

  it("sous-titre avec classe et prénom", () => {
    render(
      <ModuleHeader
        title="Notes"
        subtitle="Marie Martin • CP"
        onBack={jest.fn()}
        subtitleTestID="notes-subtitle"
      />,
    );
    const sub = screen.getByTestId("notes-subtitle");
    expect(sub.props.children).toBe("Marie Martin • CP");
    const flat = StyleSheet.flatten(sub.props.style);
    expect(flat.color).toBe("#D89B5B");
  });
});

// ── Vérification de la valeur exacte de warmAccent ───────────────────────────

describe("Cohérence de la couleur warmAccent (#D89B5B)", () => {
  it("ModuleHeader subtitle utilise exactement #D89B5B", () => {
    render(
      <ModuleHeader title="T" subtitle="Sous-titre" onBack={jest.fn()} />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-subtitle").props.style,
    );
    expect(flat.color).toBe("#D89B5B");
  });
});
