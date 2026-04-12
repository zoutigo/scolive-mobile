import React from "react";
import {
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
  useLocalSearchParams: () => ({
    studentId: "student-1",
    studentName: "Remi Ntamack",
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;
const { useAuthStore } = jest.requireMock("../../src/store/auth.store") as {
  useAuthStore: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
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

    fireEvent.changeText(screen.getByTestId("input-reason"), "   ");
    fireEvent.changeText(screen.getByTestId("input-occurred-at"), "bad");
    fireEvent.press(screen.getByTestId("btn-submit"));

    expect(screen.getByText("Le motif est obligatoire.")).toBeOnTheScreen();
    expect(screen.getByText("La date est invalide.")).toBeOnTheScreen();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("cree un evenement et bascule sur l'historique", async () => {
    useDisciplineStore.setState({ eventsMap: { "student-1": [] } });
    render(<DisciplineStudentScreen />);

    fireEvent.changeText(
      screen.getByTestId("input-reason"),
      "Retard au portail",
    );
    fireEvent.changeText(
      screen.getByTestId("input-occurred-at"),
      "2026-04-09T08:30",
    );
    fireEvent.press(screen.getByTestId("btn-submit"));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        expect.objectContaining({
          reason: "Retard au portail",
        }),
      );
    });

    expect(screen.getByTestId("list-historique")).toBeOnTheScreen();
    expect(useDisciplineStore.getState().getEvents("student-1")[0]?.id).toBe(
      "created-1",
    );
    expect(useSuccessToastStore.getState().title).toBe("Événement enregistré");
  });

  it("affiche l'erreur de creation renvoyee par l'API", async () => {
    api.create.mockRejectedValueOnce(new Error("Motif invalide"));
    useDisciplineStore.setState({ eventsMap: { "student-1": [] } });

    render(<DisciplineStudentScreen />);

    fireEvent.changeText(screen.getByTestId("input-reason"), "Retard");
    fireEvent.changeText(
      screen.getByTestId("input-occurred-at"),
      "2026-04-09T08:30",
    );
    fireEvent.press(screen.getByTestId("btn-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toBeOnTheScreen();
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

  it("permet d'editer un evenement puis d'annuler l'edition", async () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [
          makeLifeEvent({ id: "event-1", authorUserId: "teacher-1" }),
        ],
      },
    });

    render(<DisciplineStudentScreen />);
    fireEvent.press(screen.getByTestId("tab-historique"));
    fireEvent.press(screen.getByTestId("edit-event-event-1"));
    fireEvent.changeText(
      screen.getByTestId("input-reason"),
      "Retard mis a jour",
    );
    fireEvent.press(screen.getByTestId("btn-submit"));

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
