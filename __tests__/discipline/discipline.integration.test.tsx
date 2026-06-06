/**
 * Tests d'intégration — module discipline
 *
 * Couvre :
 *  - DisciplineStudentScreen : onglet Synthèse + onglet Historique + modale CRUD
 *  - VieScolaireScreen : vue parent lecture seule
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import DisciplineStudentScreen from "../../app/(home)/discipline-student/[studentId]";
import VieScolaireScreen from "../../app/(home)/vie-scolaire/[childId]";
import { disciplineApi } from "../../src/api/discipline.api";
import { SuccessToastHost } from "../../src/components/feedback/SuccessToastHost";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useFamilyStore } from "../../src/store/family.store";
import { makeLifeEvent, makeUser } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;
const { useAuthStore } = jest.requireMock("../../src/store/auth.store") as {
  useAuthStore: jest.Mock;
};

let mockRouteParams: Record<string, string> = {
  studentId: "student-1",
  studentName: "Remi Ntamack",
  className: "6e A",
  childId: "child-1",
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams,
  usePathname: () => "/(home)/discipline-student/[studentId]",
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = {
    studentId: "student-1",
    studentName: "Remi Ntamack",
    className: "6e A",
    childId: "child-1",
  };
  useDisciplineStore.getState().reset();
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
    isLoading: false,
    activeChildId: null,
  });
  api.list.mockResolvedValue([]);
  api.create.mockResolvedValue(
    makeLifeEvent({
      id: "created-1",
      studentId: "student-1",
      type: "ABSENCE",
      reason: "Absence injustifiée",
    }),
  );
  api.update.mockResolvedValue(
    makeLifeEvent({
      id: "event-1",
      studentId: "student-1",
      type: "RETARD",
      reason: "Bus en retard",
    }),
  );
  api.remove.mockResolvedValue(undefined as never);
  useAuthStore.mockReturnValue({
    schoolSlug: "college-vogt",
    user: makeUser({
      id: "admin-1",
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
      memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    }),
  });
});

// ── DisciplineStudentScreen ───────────────────────────────────────────────────

describe("DisciplineStudentScreen", () => {
  describe("structure des onglets", () => {
    it("affiche les onglets Synthèse et Historique", async () => {
      render(<DisciplineStudentScreen />);
      expect(screen.getByTestId("tab-synthese")).toBeTruthy();
      expect(screen.getByTestId("tab-historique")).toBeTruthy();
    });

    it("ouvre l'onglet Synthèse par défaut", async () => {
      render(<DisciplineStudentScreen />);
      await waitFor(() =>
        expect(screen.getByTestId("synthese-tab")).toBeTruthy(),
      );
    });

    it("affiche le FAB sur l'onglet Synthèse", async () => {
      render(<DisciplineStudentScreen />);
      await waitFor(() =>
        expect(screen.getByTestId("fab-synthese")).toBeTruthy(),
      );
    });

    it("bascule vers l'onglet Historique au clic", async () => {
      render(<DisciplineStudentScreen />);
      fireEvent.press(screen.getByTestId("tab-historique"));
      // Sans événements, la liste vide est affichée
      await waitFor(() =>
        expect(screen.getByTestId("discipline-list-empty")).toBeTruthy(),
      );
    });

    it("affiche le FAB sur l'onglet Historique", async () => {
      render(<DisciplineStudentScreen />);
      fireEvent.press(screen.getByTestId("tab-historique"));
      await waitFor(() =>
        expect(screen.getByTestId("fab-historique")).toBeTruthy(),
      );
    });
  });

  describe("création d'un événement via modale", () => {
    it("ouvre la modale au clic sur le FAB Synthèse", async () => {
      render(<DisciplineStudentScreen />);
      await waitFor(() =>
        expect(screen.getByTestId("fab-synthese")).toBeTruthy(),
      );
      fireEvent.press(screen.getByTestId("fab-synthese"));
      await waitFor(() =>
        expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
      );
      expect(screen.getByText("Nouvel événement")).toBeTruthy();
    });

    it("ouvre la modale au clic sur le FAB Historique", async () => {
      render(<DisciplineStudentScreen />);
      fireEvent.press(screen.getByTestId("tab-historique"));
      await waitFor(() =>
        expect(screen.getByTestId("fab-historique")).toBeTruthy(),
      );
      fireEvent.press(screen.getByTestId("fab-historique"));
      await waitFor(() =>
        expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
      );
    });

    it("crée un événement, alimente le store et affiche un toast", async () => {
      render(
        <>
          <DisciplineStudentScreen />
          <SuccessToastHost />
        </>,
      );

      // Ouvrir la modale
      await waitFor(() =>
        expect(screen.getByTestId("fab-synthese")).toBeTruthy(),
      );
      fireEvent.press(screen.getByTestId("fab-synthese"));
      await waitFor(() =>
        expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
      );

      // Remplir le formulaire
      fireEvent.changeText(
        screen.getByTestId("modal-occurred-at"),
        "2026-04-09T08:30",
      );
      fireEvent.changeText(
        screen.getByTestId("modal-reason"),
        "Absence injustifiée",
      );

      // Soumettre
      fireEvent.press(screen.getByTestId("modal-submit"));

      await waitFor(() => {
        expect(api.create).toHaveBeenCalledWith(
          "college-vogt",
          "student-1",
          expect.objectContaining({
            type: "ABSENCE",
            reason: "Absence injustifiée",
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("success-toast-card")).toBeOnTheScreen();
      });
      expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
        "Événement enregistré",
      );
      expect(
        useDisciplineStore.getState().getEvents("student-1")[0]?.id,
      ).toBe("created-1");
    });

    it("ferme la modale au clic sur Annuler", async () => {
      render(<DisciplineStudentScreen />);
      await waitFor(() =>
        expect(screen.getByTestId("fab-synthese")).toBeTruthy(),
      );
      fireEvent.press(screen.getByTestId("fab-synthese"));
      await waitFor(() =>
        expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
      );

      fireEvent.press(screen.getByTestId("modal-cancel"));
      await waitFor(() => {
        expect(screen.queryByTestId("student-discipline-modal")).toBeNull();
      });
    });
  });

  describe("édition d'un événement via modale", () => {
    const EDIT_EVENT_ID = "ev-edit";
    beforeEach(() => {
      const existingEvent = makeLifeEvent({
        id: EDIT_EVENT_ID,
        studentId: "student-1",
        type: "RETARD",
        reason: "Retard initial",
        authorUserId: "admin-1",
      });
      useDisciplineStore.getState().addEvent("student-1", existingEvent);
      api.list.mockResolvedValue([existingEvent]);
    });

    it("ouvre la modale en mode édition avec les valeurs pré-remplies", async () => {
      render(<DisciplineStudentScreen />);
      fireEvent.press(screen.getByTestId("tab-historique"));

      // L'événement pré-chargé rend la liste non vide → list-historique présent
      await waitFor(() =>
        expect(screen.getByTestId("list-historique")).toBeTruthy(),
      );

      const editBtn = await waitFor(() =>
        screen.getByTestId(`edit-event-${EDIT_EVENT_ID}`),
      );
      fireEvent.press(editBtn);

      await waitFor(() =>
        expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
      );
      expect(screen.getByText("Modification")).toBeTruthy();
    });

    it("met à jour un événement et affiche un toast succès", async () => {
      render(
        <>
          <DisciplineStudentScreen />
          <SuccessToastHost />
        </>,
      );

      fireEvent.press(screen.getByTestId("tab-historique"));
      await waitFor(() =>
        expect(screen.getByTestId("list-historique")).toBeTruthy(),
      );

      const editBtn = await waitFor(() =>
        screen.getByTestId(`edit-event-${EDIT_EVENT_ID}`),
      );
      fireEvent.press(editBtn);

      await waitFor(() =>
        expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
      );

      fireEvent.changeText(
        screen.getByTestId("modal-reason"),
        "Retard modifié",
      );
      fireEvent.press(screen.getByTestId("modal-submit"));

      await waitFor(() => {
        expect(api.update).toHaveBeenCalledWith(
          "college-vogt",
          "student-1",
          EDIT_EVENT_ID,
          expect.objectContaining({ reason: "Retard modifié" }),
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
          "Événement modifié",
        );
      });
    });
  });

  describe("suppression d'un événement", () => {
    const DEL_EVENT_ID = "ev-del";
    beforeEach(() => {
      const existingEvent = makeLifeEvent({
        id: DEL_EVENT_ID,
        studentId: "student-1",
        authorUserId: "admin-1",
      });
      useDisciplineStore.getState().addEvent("student-1", existingEvent);
    });

    it("ouvre le dialog de suppression", async () => {
      render(<DisciplineStudentScreen />);
      fireEvent.press(screen.getByTestId("tab-historique"));

      // L'événement pré-chargé rend la liste non vide
      await waitFor(() =>
        expect(screen.getByTestId("list-historique")).toBeTruthy(),
      );
      const deleteBtn = await waitFor(() =>
        screen.getByTestId(`delete-event-${DEL_EVENT_ID}`),
      );
      fireEvent.press(deleteBtn);

      // Le dialog expose le bouton de confirmation
      await waitFor(() => {
        expect(screen.getByTestId("delete-dialog-confirm")).toBeTruthy();
      });
    });
  });

  describe("chargement et erreurs", () => {
    it("appelle api.list au montage quand les données ne sont pas en cache", async () => {
      render(<DisciplineStudentScreen />);
      await waitFor(() => {
        expect(api.list).toHaveBeenCalledWith(
          "college-vogt",
          "student-1",
          expect.objectContaining({ scope: "current", limit: 200 }),
        );
      });
    });

    it("affiche le banner d'erreur si api.list échoue", async () => {
      api.list.mockRejectedValueOnce(new Error("Network error"));
      render(<DisciplineStudentScreen />);
      await waitFor(() => {
        expect(screen.getByTestId("load-error")).toBeTruthy();
      });
    });
  });
});

// ── VieScolaireScreen (parent — lecture seule) ────────────────────────────────

describe("VieScolaireScreen", () => {
  it("charge la vue parent lecture seule dans le store et affiche la bannière d'absence non justifiée", async () => {
    useAuthStore.mockReturnValue({
      schoolSlug: "college-vogt",
      user: makeUser(),
    });
    mockRouteParams = { childId: "child-1" };
    api.list.mockResolvedValueOnce([
      makeLifeEvent({
        id: "abs-1",
        studentId: "child-1",
        type: "ABSENCE",
        justified: false,
      }),
    ]);

    render(<VieScolaireScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("unjustified-banner")).toBeOnTheScreen();
    });
    expect(useDisciplineStore.getState().getEvents("child-1")).toHaveLength(1);
  });

  it("n'affiche pas de FAB sur la vue parent (lecture seule)", async () => {
    useAuthStore.mockReturnValue({
      schoolSlug: "college-vogt",
      user: makeUser(),
    });
    mockRouteParams = { childId: "child-1" };
    api.list.mockResolvedValue([]);

    render(<VieScolaireScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("synthese-tab")).toBeTruthy(),
    );
    expect(screen.queryByTestId("fab-synthese")).toBeNull();
  });
});
