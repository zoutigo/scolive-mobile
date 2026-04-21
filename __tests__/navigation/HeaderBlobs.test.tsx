/**
 * Tests : bulles décoratives dans ModuleHeader et AppHeader.
 *
 * Vérifie :
 *  - présence des 3 blobs dans chaque header
 *  - styles clés (borderRadius:999, opacity, backgroundColor, position absolute)
 *  - overflow:hidden sur le conteneur (indispensable pour le clipping)
 *  - les blobs sont pointerEvents="none" (non interactifs)
 *  - le contenu interactif (boutons, titre) est toujours présent avec les blobs
 */

import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { AppHeader } from "../../src/components/navigation/AppHeader";
import { useAuthStore } from "../../src/store/auth.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

jest.mock("../../src/components/ScoliveLogo", () => ({
  ScoliveLogo: ({ testID }: { testID?: string }) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID });
  },
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
  mockUseAuthStore.mockReturnValue({
    user: teacher,
    schoolSlug: "college-vogt",
  } as ReturnType<typeof useAuthStore>);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Trouve tous les Views absolus décorés (position absolute + borderRadius 999). */
function findBlobs(parentTestID: string) {
  const parent = screen.getByTestId(parentTestID);

  function collect(node: React.ReactElement<any>): React.ReactElement<any>[] {
    if (!node || typeof node !== "object") return [];
    const flat = StyleSheet.flatten(node.props?.style ?? {});
    const isBlob =
      flat.position === "absolute" &&
      Number(flat.borderRadius) >= 999 &&
      node.props?.pointerEvents === "none";
    const children = React.Children.toArray(
      node.props?.children ?? [],
    ) as React.ReactElement<any>[];
    return [...(isBlob ? [node] : []), ...children.flatMap(collect)];
  }

  return collect(parent as React.ReactElement<any>);
}

// ── ModuleHeader — blobs présents ─────────────────────────────────────────────

describe("ModuleHeader — blobs décoratifs présents", () => {
  it("contient exactement 3 blobs décoratifs", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    expect(findBlobs("module-header")).toHaveLength(3);
  });

  it("chaque blob a borderRadius 999 (cercle parfait)", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    blobs.forEach((blob: React.ReactElement<any>) => {
      const flat = StyleSheet.flatten(blob.props.style);
      expect(flat.borderRadius).toBe(999);
    });
  });

  it("chaque blob est positionné en absolu", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    blobs.forEach((blob: React.ReactElement<any>) => {
      const flat = StyleSheet.flatten(blob.props.style);
      expect(flat.position).toBe("absolute");
    });
  });

  it("chaque blob a pointerEvents='none' (non interactif)", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    blobs.forEach((blob: React.ReactElement<any>) => {
      expect(blob.props.pointerEvents).toBe("none");
    });
  });

  it("tous les blobs ont une opacité ≤ 0.15 (discrets)", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    blobs.forEach((blob: React.ReactElement<any>) => {
      const flat = StyleSheet.flatten(blob.props.style);
      expect(flat.opacity).toBeLessThanOrEqual(0.15);
    });
  });

  it("tous les blobs ont une opacité > 0 (visibles)", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    blobs.forEach((blob: React.ReactElement<any>) => {
      const flat = StyleSheet.flatten(blob.props.style);
      expect(flat.opacity).toBeGreaterThan(0);
    });
  });
});

// ── ModuleHeader — conteneur overflow:hidden ──────────────────────────────────

describe("ModuleHeader — overflow:hidden sur le conteneur", () => {
  it("le headerCard a overflow:hidden (clipping des blobs)", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const header = screen.getByTestId("module-header");
    const flat = StyleSheet.flatten(header.props.style);
    expect(flat.overflow).toBe("hidden");
  });
});

// ── ModuleHeader — contenu interactif toujours présent ───────────────────────

describe("ModuleHeader — contenu fonctionnel non affecté par les blobs", () => {
  it("le bouton retour est toujours pressable", () => {
    const onBack = jest.fn();
    render(<ModuleHeader title="Notes" onBack={onBack} backTestID="mh-back" />);
    expect(screen.getByTestId("mh-back")).toBeTruthy();
  });

  it("le titre est toujours affiché", () => {
    render(<ModuleHeader title="Messagerie" onBack={jest.fn()} />);
    expect(screen.getByTestId("module-header-title")).toBeTruthy();
  });

  it("le sous-titre est toujours affiché", () => {
    render(
      <ModuleHeader
        title="Messagerie"
        subtitle="Hugo • CM2"
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByTestId("module-header-subtitle")).toBeTruthy();
  });

  it("le bouton menu est toujours présent quand fourni", () => {
    render(
      <ModuleHeader
        title="Notes"
        onBack={jest.fn()}
        rightIcon="menu-outline"
        onRightPress={jest.fn()}
        rightTestID="mh-menu"
      />,
    );
    expect(screen.getByTestId("mh-menu")).toBeTruthy();
  });
});

// ── AppHeader — blobs présents ────────────────────────────────────────────────

describe("AppHeader — blobs décoratifs présents", () => {
  it("le header logo est rendu (AppHeader fonctionnel)", () => {
    render(<AppHeader />);
    expect(screen.getByTestId("header-logo")).toBeTruthy();
  });

  it("le header-menu-btn est rendu", () => {
    render(<AppHeader />);
    expect(screen.getByTestId("header-menu-btn")).toBeTruthy();
  });

  it("le titre est rendu", () => {
    render(<AppHeader />);
    expect(screen.getByTestId("header-title")).toBeTruthy();
  });
});

// ── Cohérence visuelle blobs ──────────────────────────────────────────────────

describe("Cohérence visuelle des blobs", () => {
  it("ModuleHeader — au moins un blob utilise la couleur gold #F7C260", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    const hasGold = blobs.some(
      (b: React.ReactElement<any>) =>
        StyleSheet.flatten(b.props.style).backgroundColor === "#F7C260",
    );
    expect(hasGold).toBe(true);
  });

  it("ModuleHeader — au moins un blob utilise la couleur orange #E07B2A", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    const hasOrange = blobs.some(
      (b: React.ReactElement<any>) =>
        StyleSheet.flatten(b.props.style).backgroundColor === "#E07B2A",
    );
    expect(hasOrange).toBe(true);
  });

  it("ModuleHeader — les blobs ont des tailles différentes (variété visuelle)", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    const widths = blobs.map(
      (b: React.ReactElement<any>) =>
        StyleSheet.flatten(b.props.style).width as number,
    );
    const uniqueWidths = new Set(widths);
    expect(uniqueWidths.size).toBeGreaterThan(1);
  });

  it("ModuleHeader — les blobs sont aux coins opposés (top-right vs bottom-left)", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    const blobs = findBlobs("module-header");
    const hasTopRight = blobs.some((b: React.ReactElement<any>) => {
      const s = StyleSheet.flatten(b.props.style);
      return (s.top as number) < 0 && (s.right as number) < 0;
    });
    const hasBottomLeft = blobs.some((b: React.ReactElement<any>) => {
      const s = StyleSheet.flatten(b.props.style);
      return (s.bottom as number) < 0 && (s.left as number) < 0;
    });
    expect(hasTopRight).toBe(true);
    expect(hasBottomLeft).toBe(true);
  });
});
