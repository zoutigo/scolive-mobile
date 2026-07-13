import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ResourceCard } from "../../src/components/resources/ResourceCard";
import { useAuthStore } from "../../src/store/auth.store";
import type { ResourceRow } from "../../src/types/resources.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/store/auth.store");

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

const BASE_RESOURCE: ResourceRow = {
  id: "res-1",
  kind: "ASSESSMENT",
  schoolId: "school-1",
  academicLevelId: "level-1",
  trackId: null,
  subjectId: "subject-1",
  examType: "SEQUENCE_TEST",
  sequence: "SEQ_1",
  academicYearLabel: "2025-2026",
  title: "Contrôle chapitre 3",
  authorUserId: "teacher-1",
  statementContent: "<p>Énoncé</p>",
  statementStatus: "APPROVED",
  correctionContent: null,
  correctionStatus: "PENDING",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  school: { id: "school-1", name: "École Test" },
  academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
  track: null,
  subject: { id: "subject-1", name: "Mathématiques" },
  authorUser: { id: "teacher-1", firstName: "Paul", lastName: "Martin" },
  isFavorite: false,
};

function setUser(
  user: {
    id: string;
    platformRoles?: string[];
    activeRole?: string | null;
    role?: string | null;
  } | null,
) {
  mockUseAuthStore.mockReturnValue({ user } as never);
}

describe("ResourceCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUser({ id: "someone-else" });
  });

  it("affiche toujours le bouton Énoncé et déclenche onPressStatement", () => {
    const onPressStatement = jest.fn();
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={onPressStatement}
        testID="card"
      />,
    );

    fireEvent.press(screen.getByTestId("card-statement-btn"));
    expect(onPressStatement).toHaveBeenCalledTimes(1);
  });

  it("masque le bouton Corrigé quand il n'y a pas de contenu de corrigé", () => {
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onPressCorrection={() => {}}
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-correction-btn")).toBeNull();
  });

  it("masque le bouton Corrigé pour un lecteur tiers quand il est PENDING", () => {
    render(
      <ResourceCard
        resource={{
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "PENDING",
        }}
        onPressStatement={() => {}}
        onPressCorrection={() => {}}
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-correction-btn")).toBeNull();
  });

  it("affiche le bouton Corrigé pour tous quand il est APPROVED", () => {
    const onPressCorrection = jest.fn();
    render(
      <ResourceCard
        resource={{
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "APPROVED",
        }}
        onPressStatement={() => {}}
        onPressCorrection={onPressCorrection}
        testID="card"
      />,
    );

    fireEvent.press(screen.getByTestId("card-correction-btn"));
    expect(onPressCorrection).toHaveBeenCalledTimes(1);
  });

  it("RÉGRESSION : jamais les boutons Corrigé et Proposer un corrigé en même temps — l'auteur voit Proposer, pas Corrigé, tant que ce n'est pas approuvé", () => {
    setUser({ id: BASE_RESOURCE.authorUserId });
    render(
      <ResourceCard
        resource={{
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "PENDING",
        }}
        onPressStatement={() => {}}
        onPressCorrection={() => {}}
        canContribute
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-correction-btn")).toBeNull();
    expect(screen.getByTestId("card-propose-correction-btn")).toBeTruthy();
  });

  it("RÉGRESSION : un admin plateforme voit Proposer, pas Corrigé, tant que ce n'est pas approuvé", () => {
    setUser({
      id: "admin-1",
      platformRoles: ["SUPER_ADMIN"],
      activeRole: "SUPER_ADMIN",
    });
    render(
      <ResourceCard
        resource={{
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "PENDING",
        }}
        onPressStatement={() => {}}
        onPressCorrection={() => {}}
        canContribute
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-correction-btn")).toBeNull();
    expect(screen.getByTestId("card-propose-correction-btn")).toBeTruthy();
  });

  it("masque tout bouton de corrigé quand canContribute est faux et que le corrigé n'est pas approuvé", () => {
    setUser({
      id: "admin-1",
      platformRoles: ["SUPER_ADMIN"],
      activeRole: "PARENT",
    });
    render(
      <ResourceCard
        resource={{
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "PENDING",
        }}
        onPressStatement={() => {}}
        onPressCorrection={() => {}}
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-correction-btn")).toBeNull();
    expect(screen.queryByTestId("card-propose-correction-btn")).toBeNull();
  });

  it("affiche le bouton Éditer pour l'auteur même si son rôle actif est parent", () => {
    setUser({
      id: BASE_RESOURCE.authorUserId,
      activeRole: "PARENT",
    });
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onEdit={() => {}}
        testID="card"
      />,
    );

    expect(screen.getByTestId("card-edit-btn")).toBeTruthy();
  });

  it("ne rend pas le bouton Éditer sans prop onEdit", () => {
    setUser({ id: BASE_RESOURCE.authorUserId });
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-edit-btn")).toBeNull();
  });

  it("masque le bouton Éditer si l'utilisateur n'est ni auteur ni admin", () => {
    setUser({ id: "someone-else" });
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onEdit={() => {}}
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-edit-btn")).toBeNull();
  });

  it("affiche le bouton Éditer pour l'auteur et déclenche onEdit", () => {
    setUser({ id: BASE_RESOURCE.authorUserId });
    const onEdit = jest.fn();
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onEdit={onEdit}
        testID="card"
      />,
    );

    fireEvent.press(screen.getByTestId("card-edit-btn"));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("affiche le bouton Éditer pour un admin plateforme non auteur avec rôle actif admin", () => {
    setUser({ id: "admin-1", platformRoles: ["ADMIN"], activeRole: "ADMIN" });
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onEdit={() => {}}
        testID="card"
      />,
    );

    expect(screen.getByTestId("card-edit-btn")).toBeTruthy();
  });

  it("masque le bouton Éditer pour un admin plateforme dont le rôle actif est parent", () => {
    setUser({ id: "admin-1", platformRoles: ["ADMIN"], activeRole: "PARENT" });
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onEdit={() => {}}
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-edit-btn")).toBeNull();
  });

  it("affiche uniquement le badge de statut du corrigé quand showStatuses est actif — pas de badge énoncé, déjà porté par le bouton", () => {
    render(
      <ResourceCard
        resource={{
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
        }}
        onPressStatement={() => {}}
        showStatuses
        testID="card"
      />,
    );

    expect(screen.getByTestId("card-correction-status")).toBeTruthy();
    expect(screen.queryByTestId("card-statement-status")).toBeNull();
  });

  it("n'affiche aucun badge de statut quand il n'y a pas encore de contenu de corrigé, même avec showStatuses actif", () => {
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        showStatuses
        testID="card"
      />,
    );

    expect(screen.queryByTestId("card-statement-status")).toBeNull();
    expect(screen.queryByTestId("card-correction-status")).toBeNull();
  });

  it("propose « Proposer un énoncé » quand l'énoncé n'est pas encore approuvé et canContribute est vrai", () => {
    render(
      <ResourceCard
        resource={{ ...BASE_RESOURCE, statementStatus: "PENDING" }}
        onPressStatement={() => {}}
        canContribute
        testID="card"
      />,
    );

    expect(screen.getByText("Proposer un énoncé")).toBeTruthy();
  });

  it("propose « Proposer un corrigé » quand l'énoncé est approuvé, sans corrigé approuvé, et canContribute est vrai", () => {
    const onPressCorrection = jest.fn();
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onPressCorrection={onPressCorrection}
        canContribute
        testID="card"
      />,
    );

    fireEvent.press(screen.getByTestId("card-propose-correction-btn"));
    expect(onPressCorrection).toHaveBeenCalledTimes(1);
  });

  it("ne propose aucun CTA de contribution quand canContribute est faux", () => {
    render(
      <ResourceCard
        resource={{ ...BASE_RESOURCE, statementStatus: "PENDING" }}
        onPressStatement={() => {}}
        onPressCorrection={() => {}}
        testID="card"
      />,
    );

    expect(screen.queryByText("Proposer un énoncé")).toBeNull();
    expect(screen.queryByTestId("card-propose-correction-btn")).toBeNull();
  });

  it("affiche le bouton « Voir le corrigé » plutôt que « Proposer » dès qu'un corrigé approuvé existe, même si canContribute est vrai", () => {
    render(
      <ResourceCard
        resource={{
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "APPROVED",
        }}
        onPressStatement={() => {}}
        onPressCorrection={() => {}}
        canContribute
        testID="card"
      />,
    );

    expect(screen.getByTestId("card-correction-btn")).toBeTruthy();
    expect(screen.queryByTestId("card-propose-correction-btn")).toBeNull();
  });

  it("déclenche onToggleFavorite au tap sur l'étoile", () => {
    const onToggleFavorite = jest.fn();
    render(
      <ResourceCard
        resource={BASE_RESOURCE}
        onPressStatement={() => {}}
        onToggleFavorite={onToggleFavorite}
        testID="card"
      />,
    );

    fireEvent.press(screen.getByTestId("card-favorite"));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});

// Règle absolue (voir CLAUDE.md) : le slot "corrigé" d'une card est binaire.
// Jamais "Voir le corrigé" et "Proposer un corrigé" en même temps, quels que
// soient le rôle actif, la propriété de la ressource ou canContribute. Cette
// matrice couvre toutes les combinaisons pour éviter toute régression future.
describe("ResourceCard — exclusivité stricte du slot corrigé", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const CORRECTION_MATRIX: Array<{
    label: string;
    correctionStatus: "PENDING" | "APPROVED" | "REJECTED";
    correctionContent: string | null;
    userId: string;
    activeRole: string | null;
    canContribute: boolean;
    expectView: boolean;
    expectPropose: boolean;
  }> = [
    {
      label: "corrigé approuvé, lecteur tiers, canContribute=false",
      correctionStatus: "APPROVED",
      correctionContent: "<p>Corrigé</p>",
      userId: "someone-else",
      activeRole: "PARENT",
      canContribute: false,
      expectView: true,
      expectPropose: false,
    },
    {
      label: "corrigé approuvé, auteur, canContribute=true",
      correctionStatus: "APPROVED",
      correctionContent: "<p>Corrigé</p>",
      userId: BASE_RESOURCE.authorUserId,
      activeRole: "TEACHER",
      canContribute: true,
      expectView: true,
      expectPropose: false,
    },
    {
      label: "corrigé approuvé, admin plateforme, canContribute=true",
      correctionStatus: "APPROVED",
      correctionContent: "<p>Corrigé</p>",
      userId: "admin-1",
      activeRole: "SUPER_ADMIN",
      canContribute: true,
      expectView: true,
      expectPropose: false,
    },
    {
      label: "corrigé PENDING, lecteur tiers, canContribute=false",
      correctionStatus: "PENDING",
      correctionContent: "<p>Corrigé</p>",
      userId: "someone-else",
      activeRole: "PARENT",
      canContribute: false,
      expectView: false,
      expectPropose: false,
    },
    {
      label:
        "corrigé PENDING, lecteur tiers, canContribute=true (n'importe qui peut proposer)",
      correctionStatus: "PENDING",
      correctionContent: "<p>Corrigé</p>",
      userId: "someone-else",
      activeRole: "PARENT",
      canContribute: true,
      expectView: false,
      expectPropose: true,
    },
    {
      label: "corrigé PENDING, auteur, canContribute=true",
      correctionStatus: "PENDING",
      correctionContent: "<p>Corrigé</p>",
      userId: BASE_RESOURCE.authorUserId,
      activeRole: "TEACHER",
      canContribute: true,
      expectView: false,
      expectPropose: true,
    },
    {
      label:
        "corrigé PENDING, auteur, canContribute=false (browse sans capacité)",
      correctionStatus: "PENDING",
      correctionContent: "<p>Corrigé</p>",
      userId: BASE_RESOURCE.authorUserId,
      activeRole: "TEACHER",
      canContribute: false,
      expectView: false,
      expectPropose: false,
    },
    {
      label: "corrigé admin plateforme, canContribute=true, PENDING",
      correctionStatus: "PENDING",
      correctionContent: "<p>Corrigé</p>",
      userId: "admin-1",
      activeRole: "SUPER_ADMIN",
      canContribute: true,
      expectView: false,
      expectPropose: true,
    },
    {
      label: "aucun contenu de corrigé, canContribute=true",
      correctionStatus: "PENDING",
      correctionContent: null,
      userId: "someone-else",
      activeRole: "PARENT",
      canContribute: true,
      expectView: false,
      expectPropose: true,
    },
    {
      label:
        "corrigé rejeté (contenu existant mais non approuvé), auteur, canContribute=true",
      correctionStatus: "REJECTED",
      correctionContent: "<p>Corrigé</p>",
      userId: BASE_RESOURCE.authorUserId,
      activeRole: "TEACHER",
      canContribute: true,
      expectView: false,
      expectPropose: true,
    },
  ];

  it.each(CORRECTION_MATRIX)(
    "$label → Voir=$expectView / Proposer=$expectPropose, jamais les deux",
    ({
      correctionStatus,
      correctionContent,
      userId,
      activeRole,
      canContribute,
      expectView,
      expectPropose,
    }) => {
      setUser({ id: userId, activeRole });
      render(
        <ResourceCard
          resource={{
            ...BASE_RESOURCE,
            correctionContent,
            correctionStatus,
          }}
          onPressStatement={() => {}}
          onPressCorrection={() => {}}
          canContribute={canContribute}
          testID="card"
        />,
      );

      const viewBtn = screen.queryByTestId("card-correction-btn");
      const proposeBtn = screen.queryByTestId("card-propose-correction-btn");

      expect(Boolean(viewBtn)).toBe(expectView);
      expect(Boolean(proposeBtn)).toBe(expectPropose);
      // Invariant absolu : jamais les deux boutons simultanément.
      expect(viewBtn && proposeBtn).toBeFalsy();
    },
  );
});
