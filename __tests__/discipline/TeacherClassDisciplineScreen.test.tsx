import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherClassDisciplineScreen } from "../../src/components/discipline/TeacherClassDisciplineScreen";
import { notesApi } from "../../src/api/notes.api";
import { timetableApi } from "../../src/api/timetable.api";
import { disciplineApi } from "../../src/api/discipline.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useTeacherClassDisciplineDraftStore } from "../../src/store/teacher-class-discipline-draft.store";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: "college-vogt",
    user: {
      id: "teacher-1",
      firstName: "Valery",
      lastName: "Mbele",
      role: "TEACHER",
      activeRole: "TEACHER",
      schoolName: "Collège Vogt",
    },
  }),
}));
jest.mock("expo-router", () => {
  const back = jest.fn();
  const navigate = jest.fn();
  return {
    __back: back,
    __navigate: navigate,
    useRouter: () => ({
      back,
      canGoBack: jest.fn().mockReturnValue(true),
      navigate,
    }),
    useLocalSearchParams: () => ({ classId: "class-1" }),
  };
});
jest.mock("../../src/store/success-toast.store", () => {
  const showSuccess = jest.fn();
  const showError = jest.fn();
  return {
    __showSuccess: showSuccess,
    __showError: showError,
    useSuccessToastStore: (selector: (state: unknown) => unknown) =>
      selector({ showSuccess, showError }),
  };
});
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockDisciplineApi = disciplineApi as jest.Mocked<typeof disciplineApi>;

const router = require("expo-router") as {
  __back: jest.Mock;
  __navigate: jest.Mock;
};
const toast = require("../../src/store/success-toast.store") as {
  __showSuccess: jest.Mock;
  __showError: jest.Mock;
};

const student1 = { id: "student-1", firstName: "Lisa", lastName: "MBELE" };
const student2 = { id: "student-2", firstName: "Remi", lastName: "NTAMACK" };

beforeEach(() => {
  jest.clearAllMocks();
  useDisciplineStore.getState().reset();
  useTeacherClassDisciplineDraftStore.getState().reset();

  mockNotesApi.getTeacherContext.mockResolvedValue({
    class: { id: "class-1", name: "6e A", schoolYearId: "sy-1" },
    subjects: [],
    evaluationTypes: [],
    students: [student1, student2],
  });
  mockTimetableApi.getClassContext.mockResolvedValue({
    class: {
      id: "class-1",
      name: "6e A",
      schoolId: "school-1",
      schoolYearId: "sy-1",
      academicLevelId: null,
      curriculumId: null,
      referentTeacherUserId: "teacher-1",
    },
    allowedSubjects: [],
    assignments: [],
    subjectStyles: [],
    schoolYears: [{ id: "sy-1", label: "2025-2026", isActive: true }],
    selectedSchoolYearId: "sy-1",
  });
  mockDisciplineApi.list.mockImplementation(async (_slug, studentId) => {
    if (studentId === "student-1") {
      return [
        makeLifeEvent({
          id: "event-1",
          studentId: "student-1",
          classId: "class-1",
          reason: "Bus arrivé en retard",
          type: "RETARD",
          authorUserId: "teacher-2",
        }),
      ];
    }
    return [
      makeLifeEvent({
        id: "event-2",
        studentId: "student-2",
        classId: "class-1",
        reason: "[DEMO] Sanction signée",
        type: "SANCTION",
        authorUserId: "teacher-2",
      }),
    ];
  });
  mockDisciplineApi.create.mockImplementation(
    async (_slug, studentId, payload) =>
      makeLifeEvent({
        id: "created-1",
        studentId,
        classId: payload.classId ?? "class-1",
        reason: payload.reason,
        type: payload.type,
        authorUserId: "teacher-1",
        justified: payload.justified ?? null,
        durationMinutes: payload.durationMinutes ?? null,
        occurredAt: payload.occurredAt ?? "2026-05-01T08:00:00.000Z",
        comment: payload.comment ?? null,
      }),
  );
  mockDisciplineApi.update.mockImplementation(
    async (_slug, studentId, id, payload) =>
      makeLifeEvent({
        id,
        studentId,
        classId: payload.classId ?? "class-1",
        reason: payload.reason,
        type: payload.type,
        authorUserId: "teacher-2",
        occurredAt: payload.occurredAt ?? "2026-05-01T08:00:00.000Z",
      }),
  );
  mockDisciplineApi.remove.mockResolvedValue(undefined);
});

async function renderLoaded() {
  render(<TeacherClassDisciplineScreen />);
  await waitFor(() =>
    expect(screen.getByTestId("teacher-class-discipline-fab")).toBeTruthy(),
  );
  await waitFor(() =>
    expect(screen.getByText("Bus arrivé en retard")).toBeTruthy(),
  );
}

describe("TeacherClassDisciplineScreen — chargement & listes", () => {
  it("charge le contexte de classe et l'historique agrégé des élèves", async () => {
    render(<TeacherClassDisciplineScreen />);

    await waitFor(() => {
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
      );
    });
    await waitFor(() => {
      expect(mockDisciplineApi.list).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        expect.objectContaining({ classId: "class-1" }),
      );
    });

    expect(
      screen.getByTestId("teacher-class-discipline-events-list"),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("MBELE Lisa")).toBeTruthy();
      expect(screen.getByText("NTAMACK Remi")).toBeTruthy();
    });
  });

  it("filtre les événements par élève via la liste déroulante", async () => {
    await renderLoaded();
    expect(screen.getByText("[DEMO] Sanction signée")).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("teacher-class-discipline-events-student-trigger"),
    );
    fireEvent.press(
      screen.getByTestId(
        "teacher-class-discipline-events-student-option-student-1",
      ),
    );

    expect(screen.getByText("Bus arrivé en retard")).toBeTruthy();
    expect(screen.queryByText("[DEMO] Sanction signée")).toBeNull();
  });
});

describe("TeacherClassDisciplineScreen — navigation formulaire inline", () => {
  it("ouvre le tab forms via le FAB : hero de création, tabs et FAB masqués", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));

    expect(
      screen.getByTestId("teacher-class-discipline-forms-tab"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teacher-class-discipline-form-hero"),
    ).toBeTruthy();
    expect(screen.getByText("Nouvel événement de discipline")).toBeTruthy();
    expect(screen.getByTestId("discipline-form-submit")).toBeTruthy();

    // Tabs de liste et FAB masqués sur le tab forms
    expect(
      screen.queryByTestId("teacher-class-discipline-tab-events"),
    ).toBeNull();
    expect(screen.queryByTestId("teacher-class-discipline-fab")).toBeNull();
  });

  it("le bouton Annuler revient au tab events sans appel API", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));
    fireEvent.press(screen.getByTestId("discipline-form-cancel"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-class-discipline-fab")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-class-discipline-forms-tab"),
    ).toBeNull();
    expect(mockDisciplineApi.create).not.toHaveBeenCalled();
    expect(mockDisciplineApi.update).not.toHaveBeenCalled();
  });

  it("la flèche du ModuleHeader depuis forms revient au tab events sans router.back()", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));
    expect(
      screen.getByTestId("teacher-class-discipline-forms-tab"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-back"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-class-discipline-fab")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-class-discipline-forms-tab"),
    ).toBeNull();
    expect(router.__back).not.toHaveBeenCalled();
  });

  it("la flèche du ModuleHeader hors forms appelle router.back()", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-back"));

    expect(router.__back).toHaveBeenCalledTimes(1);
  });
});

describe("TeacherClassDisciplineScreen — création d'événement", () => {
  it("persiste le brouillon pendant la saisie et crée l'événement", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));
    fireEvent.press(screen.getByTestId("discipline-form-student-trigger"));
    fireEvent.press(
      screen.getByTestId("discipline-form-student-option-student-1"),
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Retard portail",
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-occurred-at"),
      "2026-05-02T07:10",
    );

    expect(
      useTeacherClassDisciplineDraftStore.getState().getDraft("class-1")
        ?.reason,
    ).toBe("Retard portail");

    jest.useFakeTimers();
    fireEvent.press(screen.getByTestId("discipline-form-submit"));
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    jest.useRealTimers();

    expect(mockDisciplineApi.create).toHaveBeenCalledWith(
      "college-vogt",
      "student-1",
      expect.objectContaining({
        classId: "class-1",
        reason: "Retard portail",
      }),
    );
    expect(toast.__showSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Événement créé" }),
    );
  });

  it("après succès, redirige vers le tab events après le timer de 2s", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));
    fireEvent.press(screen.getByTestId("discipline-form-student-trigger"));
    fireEvent.press(
      screen.getByTestId("discipline-form-student-option-student-1"),
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Retard portail",
    );

    jest.useFakeTimers();
    fireEvent.press(screen.getByTestId("discipline-form-submit"));
    // flush microtasks : create se résout et programme le setTimeout
    await act(async () => {});
    expect(mockDisciplineApi.create).toHaveBeenCalled();
    expect(
      screen.getByTestId("teacher-class-discipline-forms-tab"),
    ).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    jest.useRealTimers();

    expect(
      screen.queryByTestId("teacher-class-discipline-forms-tab"),
    ).toBeNull();
    expect(screen.getByTestId("teacher-class-discipline-fab")).toBeTruthy();
    expect(screen.getByText("Retard portail")).toBeTruthy();
  });

  it("validation zod : affiche les erreurs sous les champs et n'appelle pas l'API", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));
    // studentId vide (défaut), reason vide → soumission invalide
    fireEvent.press(screen.getByTestId("discipline-form-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("discipline-form-student-error")).toBeTruthy(),
    );
    expect(screen.getByTestId("discipline-form-reason-error")).toBeTruthy();
    expect(mockDisciplineApi.create).not.toHaveBeenCalled();
    // reste sur le formulaire
    expect(
      screen.getByTestId("teacher-class-discipline-forms-tab"),
    ).toBeTruthy();
  });

  it("erreur API : toast d'erreur et maintien sur le tab forms", async () => {
    mockDisciplineApi.create.mockRejectedValueOnce(
      new Error("Réseau indisponible"),
    );
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));
    fireEvent.press(screen.getByTestId("discipline-form-student-trigger"));
    fireEvent.press(
      screen.getByTestId("discipline-form-student-option-student-1"),
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Retard portail",
    );
    fireEvent.press(screen.getByTestId("discipline-form-submit"));

    await waitFor(() =>
      expect(toast.__showError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Réseau indisponible" }),
      ),
    );
    expect(
      screen.getByTestId("teacher-class-discipline-forms-tab"),
    ).toBeTruthy();
  });
});

describe("TeacherClassDisciplineScreen — édition d'événement", () => {
  it("ouvre le formulaire pré-rempli et enregistre la mise à jour", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("edit-event-event-1"));

    expect(
      screen.getByTestId("teacher-class-discipline-form-hero"),
    ).toBeTruthy();
    expect(screen.getByText("Modifier l'événement")).toBeTruthy();
    // champ pré-rempli avec le motif de l'événement
    expect(screen.getByTestId("discipline-form-reason").props.value).toBe(
      "Bus arrivé en retard",
    );

    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Bus arrivé en retard (corrigé)",
    );

    jest.useFakeTimers();
    fireEvent.press(screen.getByTestId("discipline-form-submit"));
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    jest.useRealTimers();

    expect(mockDisciplineApi.update).toHaveBeenCalledWith(
      "college-vogt",
      "student-1",
      "event-1",
      expect.objectContaining({ reason: "Bus arrivé en retard (corrigé)" }),
    );
    expect(mockDisciplineApi.create).not.toHaveBeenCalled();
    expect(toast.__showSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Événement modifié" }),
    );
  });
});

describe("TeacherClassDisciplineScreen — carnets", () => {
  it("affiche l'onglet Carnets et réutilise la synthèse vie scolaire", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByTestId("teacher-class-discipline-tab-carnets"));

    expect(screen.getByText("Choisissez un élève")).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("teacher-class-discipline-carnets-student-trigger"),
    );
    fireEvent.press(
      screen.getByTestId(
        "teacher-class-discipline-carnets-student-option-student-2",
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-class-discipline-carnet-summary"),
      ).toBeTruthy(),
    );
    expect(screen.getByTestId("discipline-summary-kpis")).toBeTruthy();
    expect(screen.getByText("[DEMO] Sanction signée")).toBeTruthy();
  });

  it("filtre les evenements du carnet au clic sur un KPI et les remet a zero avec Tout voir", async () => {
    mockDisciplineApi.list.mockImplementation(async (_slug, studentId) => {
      if (studentId === "student-1") {
        return [
          makeLifeEvent({
            id: "ret-s1",
            studentId: "student-1",
            classId: "class-1",
            reason: "Bus arrivé en retard",
            type: "RETARD",
            authorUserId: "teacher-2",
          }),
        ];
      }
      return [
        makeLifeEvent({
          id: "san-s2",
          studentId: "student-2",
          classId: "class-1",
          reason: "Carnet sanction S2",
          type: "SANCTION",
          authorUserId: "teacher-2",
        }),
        makeLifeEvent({
          id: "ret-s2",
          studentId: "student-2",
          classId: "class-1",
          reason: "Carnet retard S2",
          type: "RETARD",
          authorUserId: "teacher-2",
        }),
      ];
    });

    render(<TeacherClassDisciplineScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-class-discipline-tab-carnets"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-class-discipline-tab-carnets"));
    fireEvent.press(
      screen.getByTestId("teacher-class-discipline-carnets-student-trigger"),
    );
    fireEvent.press(
      screen.getByTestId(
        "teacher-class-discipline-carnets-student-option-student-2",
      ),
    );

    await waitFor(() =>
      expect(screen.getByText("Carnet sanction S2")).toBeTruthy(),
    );
    expect(screen.getByText("Carnet retard S2")).toBeTruthy();

    fireEvent.press(screen.getByTestId("kpi-sanctions"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : SANCTIONS",
    );
    expect(screen.getByText("Carnet sanction S2")).toBeTruthy();
    expect(screen.queryByText("Carnet retard S2")).toBeNull();

    fireEvent.press(screen.getByTestId("btn-see-all"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements",
    );
    expect(screen.getByText("Carnet retard S2")).toBeTruthy();
    expect(screen.getByText("Carnet sanction S2")).toBeTruthy();
  });
});
