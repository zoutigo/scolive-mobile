import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import DisciplineStudentScreen from "../../app/(home)/discipline-student/[studentId]";
import { disciplineApi } from "../../src/api/discipline.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { makeLifeEvent, makeUser } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: jest.fn(() => ({
    studentId: "student-1",
    studentName: "Remi Ntamack",
  })),
  usePathname: () => "/(home)/discipline-student/[studentId]",
}));

const { useLocalSearchParams } = jest.requireMock("expo-router") as {
  useLocalSearchParams: jest.Mock;
};
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;
const { useAuthStore } = jest.requireMock("../../src/store/auth.store") as {
  useAuthStore: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({
    studentId: "student-1",
    studentName: "Remi Ntamack",
  });
  useDisciplineStore.getState().reset();
  useSuccessToastStore.getState().hide();
  useAuthStore.mockReturnValue({
    schoolSlug: "college-vogt",
    user: makeUser({
      id: "teacher-1",
      role: "TEACHER",
      activeRole: "TEACHER",
      memberships: [{ schoolId: "school-1", role: "TEACHER" }],
    }),
  });
  api.list.mockResolvedValue([]);
  api.create.mockResolvedValue(makeLifeEvent({ id: "created-1" }));
  api.update.mockResolvedValue(makeLifeEvent({ id: "event-1", reason: "MAJ" }));
  api.remove.mockResolvedValue(undefined);
});

describe("DisciplineStudentScreen", () => {
  it("charge l'historique au montage", async () => {
    api.list.mockResolvedValueOnce([makeLifeEvent({ id: "event-1" })]);

    render(<DisciplineStudentScreen />);
    expect(screen.getByTestId("module-header")).toBeOnTheScreen();
    expect(screen.getByTestId("btn-back")).toBeOnTheScreen();
    expect(screen.getByTestId("discipline-header-title")).toBeOnTheScreen();
    expect(screen.getByTestId("discipline-header-subtitle")).toBeOnTheScreen();
    expect(screen.getAllByText("Discipline").length).toBeGreaterThan(0);
    expect(screen.getByTestId("discipline-header-subtitle")).toHaveTextContent(
      "Remi Ntamack",
    );

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith("college-vogt", "student-1", {
        scope: "current",
        limit: 200,
      });
    });
  });

  it("affiche une erreur de chargement et permet de reessayer", async () => {
    api.list.mockRejectedValueOnce(new Error("DOWN")).mockResolvedValueOnce([]);

    render(<DisciplineStudentScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("load-error")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("btn-retry"));

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(2);
    });
  });

  it("valide le formulaire avec zod avant la creation", async () => {
    useDisciplineStore.setState({ eventsMap: { "student-1": [] } });
    render(<DisciplineStudentScreen />);

    // Ouvrir la modale via le FAB Synthèse
    await waitFor(() =>
      expect(screen.getByTestId("fab-synthese")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("fab-synthese"));
    await waitFor(() =>
      expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("modal-reason"), "   ");
    fireEvent.changeText(screen.getByTestId("modal-occurred-at"), "bad");

    await act(async () => {
      fireEvent.press(screen.getByTestId("modal-submit"));
    });

    await waitFor(() => {
      expect(screen.getByText("Le motif est obligatoire.")).toBeOnTheScreen();
      expect(screen.getByText("La date est invalide.")).toBeOnTheScreen();
    });
    expect(api.create).not.toHaveBeenCalled();
  });

  it("cree un evenement via la modale et alimente le store", async () => {
    useDisciplineStore.setState({ eventsMap: { "student-1": [] } });
    render(<DisciplineStudentScreen />);

    // Ouvrir la modale
    await waitFor(() =>
      expect(screen.getByTestId("fab-synthese")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("fab-synthese"));
    await waitFor(() =>
      expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("modal-reason"),
      "Retard au portail",
    );
    fireEvent.changeText(
      screen.getByTestId("modal-occurred-at"),
      "2026-04-09T08:30",
    );
    fireEvent.press(screen.getByTestId("modal-submit"));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        expect.objectContaining({
          reason: "Retard au portail",
        }),
      );
    });

    expect(useDisciplineStore.getState().getEvents("student-1")[0]?.id).toBe(
      "created-1",
    );
    expect(useSuccessToastStore.getState().title).toBe("Événement enregistré");
  });

  it("affiche l'erreur de creation renvoyee par l'API dans la modale", async () => {
    api.create.mockRejectedValueOnce(new Error("Motif invalide"));
    useDisciplineStore.setState({ eventsMap: { "student-1": [] } });

    render(<DisciplineStudentScreen />);

    // Ouvrir la modale
    await waitFor(() =>
      expect(screen.getByTestId("fab-synthese")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("fab-synthese"));
    await waitFor(() =>
      expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("modal-reason"), "Retard");
    fireEvent.changeText(
      screen.getByTestId("modal-occurred-at"),
      "2026-04-09T08:30",
    );
    fireEvent.press(screen.getByTestId("modal-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("modal-error")).toBeOnTheScreen();
    });
    expect(screen.getByText("Motif invalide")).toBeOnTheScreen();
  });

  it("n'affiche les actions d'edition/suppression que pour les evenements autorises au teacher", async () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [
          makeLifeEvent({ id: "own-1", authorUserId: "teacher-1" }),
          makeLifeEvent({ id: "other-1", authorUserId: "teacher-2" }),
        ],
      },
    });

    render(<DisciplineStudentScreen />);
    fireEvent.press(screen.getByTestId("tab-historique"));

    expect(screen.getByTestId("edit-event-own-1")).toBeOnTheScreen();
    expect(screen.getByTestId("delete-event-own-1")).toBeOnTheScreen();
    expect(screen.queryByTestId("edit-event-other-1")).toBeNull();
    expect(screen.queryByTestId("delete-event-other-1")).toBeNull();
  });

  it("permet d'editer un evenement via la modale", async () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [
          makeLifeEvent({ id: "event-1", authorUserId: "teacher-1" }),
        ],
      },
    });

    render(<DisciplineStudentScreen />);
    fireEvent.press(screen.getByTestId("tab-historique"));

    // Attendre que la liste soit rendue
    await waitFor(() =>
      expect(screen.getByTestId("edit-event-event-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("edit-event-event-1"));

    // La modale s'ouvre en mode édition
    await waitFor(() =>
      expect(screen.getByTestId("student-discipline-modal")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("modal-reason"),
      "Retard mis a jour",
    );
    fireEvent.press(screen.getByTestId("modal-submit"));

    await waitFor(() => {
      expect(api.update).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        "event-1",
        expect.objectContaining({ reason: "Retard mis a jour" }),
      );
    });

    expect(useSuccessToastStore.getState().title).toBe("Événement modifié");
  });

  it("ouvre la modale de suppression et supprime l'evenement", async () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [
          makeLifeEvent({ id: "event-1", authorUserId: "teacher-1" }),
        ],
      },
    });

    render(<DisciplineStudentScreen />);
    fireEvent.press(screen.getByTestId("tab-historique"));
    fireEvent.press(screen.getByTestId("delete-event-event-1"));
    expect(screen.getByTestId("delete-dialog-confirm")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("delete-dialog-confirm"));

    await waitFor(() => {
      expect(api.remove).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        "event-1",
      );
    });
    expect(useDisciplineStore.getState().getEvents("student-1")).toHaveLength(
      0,
    );
    expect(useSuccessToastStore.getState().title).toBe("Événement supprimé");
  });
});

describe("DisciplineStudentScreen — subtitle avec className", () => {
  it("affiche uniquement le nom si className est absent", () => {
    useLocalSearchParams.mockReturnValue({
      studentId: "student-1",
      studentName: "Remi Ntamack",
    });
    api.list.mockResolvedValue([]);

    render(<DisciplineStudentScreen />);

    expect(screen.getByTestId("discipline-header-subtitle")).toHaveTextContent(
      "Remi Ntamack",
    );
    expect(
      screen.getByTestId("discipline-header-subtitle").props.children,
    ).not.toContain("·");
  });

  it("affiche nom · classe si className est fourni", () => {
    useLocalSearchParams.mockReturnValue({
      studentId: "student-1",
      studentName: "Remi Ntamack",
      className: "6e A",
    });
    api.list.mockResolvedValue([]);

    render(<DisciplineStudentScreen />);

    expect(screen.getByTestId("discipline-header-subtitle")).toHaveTextContent(
      "Remi Ntamack · 6e A",
    );
  });

  it("utilise Élève comme displayName si studentName est absent", () => {
    useLocalSearchParams.mockReturnValue({
      studentId: "student-1",
      className: "5e B",
    });
    api.list.mockResolvedValue([]);

    render(<DisciplineStudentScreen />);

    expect(screen.getByTestId("discipline-header-subtitle")).toHaveTextContent(
      "Élève · 5e B",
    );
  });
});
