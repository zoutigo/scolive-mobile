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
  subjectId: "subject-1",
  examType: "SEQUENCE_TEST",
  sequence: "SEQ_1",
  academicYearLabel: "2025-2026",
  title: "Contrôle chapitre 3",
  authorUserId: "teacher-1",
  statementStatus: "APPROVED",
  correctionContent: null,
  correctionStatus: "PENDING",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  school: { id: "school-1", name: "École Test" },
  academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
  subject: { id: "subject-1", name: "Mathématiques" },
  authorUser: { id: "teacher-1", firstName: "Paul", lastName: "Martin" },
  isFavorite: false,
};

function setUser(user: { id: string; platformRoles?: string[] } | null) {
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

  it("affiche le bouton Corrigé pour l'auteur même si PENDING", () => {
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
        testID="card"
      />,
    );

    expect(screen.getByTestId("card-correction-btn")).toBeTruthy();
  });

  it("affiche le bouton Corrigé pour un admin plateforme même si PENDING", () => {
    setUser({ id: "admin-1", platformRoles: ["SUPER_ADMIN"] });
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

    expect(screen.getByTestId("card-correction-btn")).toBeTruthy();
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

  it("affiche le bouton Éditer pour un admin plateforme non auteur", () => {
    setUser({ id: "admin-1", platformRoles: ["ADMIN"] });
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

  it("affiche les badges de statut quand showStatuses est actif", () => {
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

    expect(screen.getByTestId("card-statement-status")).toBeTruthy();
    expect(screen.getByTestId("card-correction-status")).toBeTruthy();
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
