/**
 * Tests unitaires pour TeacherOneOffCreatePanel
 *
 * Couvre :
 * - rendu selon présence ou absence de prefilledClassId
 * - chargement du contexte de classe (getClassContext)
 * - pré-sélection de l'enseignant courant / du premier enseignant
 * - filtrage des enseignants par matière sélectionnée
 * - validation zod (format HH:MM, YYYY-MM-DD, fin > début, champs requis)
 * - soumission : payload envoyé, onSuccess, toast succès
 * - erreur API : toast erreur, onSuccess non appelé
 * - bouton fermer : onClose appelé
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import {
  TeacherOneOffCreatePanel,
  teacherOneOffCreateSchema,
} from "../../src/components/timetable/TeacherOneOffCreatePanel";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import type {
  ClassTimetableContextResponse,
  TimetableClassOption,
} from "../../src/types/timetable.types";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api", () => ({
  timetableApi: {
    getClassContext: jest.fn(),
    createOneOffSlot: jest.fn(),
  },
}));
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(),
}));

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();
const api = timetableApi as jest.Mocked<typeof timetableApi>;
const mockUseSuccessToastStore = useSuccessToastStore as jest.MockedFunction<
  typeof useSuccessToastStore
>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ALL_CLASSES: TimetableClassOption[] = [
  {
    classId: "class-6eC",
    className: "6eC",
    schoolYearId: "sy1",
    schoolYearLabel: "2025-2026",
    studentCount: 28,
    subjects: [],
  },
  {
    classId: "class-5eB",
    className: "5eB",
    schoolYearId: "sy1",
    schoolYearLabel: "2025-2026",
    studentCount: 30,
    subjects: [],
  },
];

// Contexte : Albert (u1) enseigne l'Anglais, Guy (u2) enseigne les Maths
const CLASS_CTX: ClassTimetableContextResponse = {
  class: {
    id: "class-6eC",
    name: "6eC",
    schoolId: "s1",
    schoolYearId: "sy1",
    academicLevelId: null,
    curriculumId: null,
    referentTeacherUserId: "u1",
  },
  allowedSubjects: [
    { id: "ang", name: "Anglais" },
    { id: "math", name: "Mathématiques" },
  ],
  assignments: [
    {
      teacherUserId: "u1",
      subjectId: "ang",
      subject: { id: "ang", name: "Anglais" },
      teacherUser: { id: "u1", firstName: "Albert", lastName: "Mvondo" },
    },
    {
      teacherUserId: "u2",
      subjectId: "math",
      subject: { id: "math", name: "Mathématiques" },
      teacherUser: { id: "u2", firstName: "Guy", lastName: "Ndem" },
    },
  ],
  subjectStyles: [],
  schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
  selectedSchoolYearId: "sy1",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-27T08:00:00Z"));
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.clearAllMocks();

  mockUseSuccessToastStore.mockReturnValue({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  } as never);

  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Albert",
      lastName: "Mvondo",
      platformRoles: [] as never[],
      memberships: [{ schoolId: "s1", role: "TEACHER" as const }],
      profileCompleted: true,
    } as never,
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  } as never);

  api.getClassContext.mockResolvedValue(CLASS_CTX);
  api.createOneOffSlot.mockResolvedValue(undefined as never);
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderPanel(
  props: Partial<React.ComponentProps<typeof TeacherOneOffCreatePanel>> = {},
) {
  return render(
    <TeacherOneOffCreatePanel
      schoolSlug="college-vogt"
      allClasses={ALL_CLASSES}
      onClose={mockOnClose}
      onSuccess={mockOnSuccess}
      {...props}
    />,
  );
}

async function pickTime(testID: string, hour: string, minute: string) {
  fireEvent.press(screen.getByTestId(testID));
  await waitFor(() =>
    expect(screen.getByTestId(`${testID}-modal`)).toBeTruthy(),
  );
  fireEvent.press(screen.getByTestId(`${testID}-hour-${hour}`));
  fireEvent.press(screen.getByTestId(`${testID}-minute-${minute}`));
  fireEvent.press(screen.getByTestId(`${testID}-confirm`));
  await waitFor(() =>
    expect(screen.queryByTestId(`${testID}-modal`)).toBeNull(),
  );
}

// ─── Rendu ────────────────────────────────────────────────────────────────────

describe("TeacherOneOffCreatePanel — rendu", () => {
  it("affiche le titre 'Nouveau créneau'", () => {
    renderPanel();
    expect(screen.getByTestId("teacher-oneoff-create-panel")).toBeTruthy();
    expect(screen.getByText("Nouveau créneau")).toBeTruthy();
  });

  it("affiche le picker de classe quand prefilledClassId est absent", () => {
    renderPanel();
    expect(screen.getByTestId("teacher-oneoff-class-class-6eC")).toBeTruthy();
    expect(screen.getByTestId("teacher-oneoff-class-class-5eB")).toBeTruthy();
  });

  it("masque le picker de classe quand prefilledClassId est fourni", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() => expect(api.getClassContext).toHaveBeenCalled());
    expect(screen.queryByTestId("teacher-oneoff-class-class-6eC")).toBeNull();
  });

  it("affiche le nom de la classe pré-remplie dans le sous-titre", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() => expect(screen.getByText(/6eC/)).toBeTruthy());
  });

  it("le bouton fermer appelle onClose", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-close"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas de champs tant qu'aucune classe n'est sélectionnée", () => {
    renderPanel();
    expect(screen.queryByTestId("teacher-oneoff-date-input")).toBeNull();
    expect(screen.queryByTestId("teacher-oneoff-start-input")).toBeNull();
  });
});

// ─── Chargement du contexte ────────────────────────────────────────────────────

describe("TeacherOneOffCreatePanel — chargement du contexte", () => {
  it("appelle getClassContext au montage si prefilledClassId fourni", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-6eC",
      ),
    );
  });

  it("appelle getClassContext quand l'utilisateur sélectionne une classe", async () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-6eC",
      ),
    );
  });

  it("affiche les matières après chargement du contexte", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-subject-ang")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-oneoff-subject-math")).toBeTruthy();
  });

  it("affiche les champs date/heure après chargement du contexte", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-date-input")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy();
    expect(screen.getByTestId("teacher-oneoff-end-input")).toBeTruthy();
    expect(screen.getByTestId("teacher-oneoff-room-input")).toBeTruthy();
    expect(screen.getByText("08:00")).toBeTruthy();
    expect(screen.getByText("09:00")).toBeTruthy();
  });

  it("pré-remplit la date avec prefilledDate", async () => {
    renderPanel({ prefilledClassId: "class-6eC", prefilledDate: "2026-05-12" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-date-input")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-oneoff-date-input").props.value).toBe(
      "2026-05-12",
    );
  });

  it("utilise la date du jour si prefilledDate absent", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-date-input")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-oneoff-date-input").props.value).toBe(
      "2026-04-27",
    );
  });
});

// ─── Pré-sélection enseignant ─────────────────────────────────────────────────

describe("TeacherOneOffCreatePanel — pré-sélection enseignant", () => {
  it("pré-sélectionne l'enseignant courant s'il est dans les assignments", async () => {
    // u1 (Albert) enseigne Anglais → doit être pré-sélectionné
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-teacher-u1")).toBeTruthy(),
    );
    // Le pill u1 est actif (style pillActive appliqué via le fond primaire)
    // On vérifie via la soumission que teacherUserId = "u1" est sélectionné
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-date-input"),
      "2026-04-28",
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({ teacherUserId: "u1" }),
    );
  });

  it("pré-sélectionne le premier enseignant si l'utilisateur courant n'est pas dans les assignments", async () => {
    // Changer l'utilisateur connecté en u3 (non présent dans les assignments)
    useAuthStore.setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, id: "u3" } : null,
    }));
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-date-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-date-input"),
      "2026-04-28",
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({ teacherUserId: "u1" }), // premier assignment
    );
  });
});

// ─── Filtrage des enseignants par matière ─────────────────────────────────────

describe("TeacherOneOffCreatePanel — filtrage enseignants par matière", () => {
  it("affiche les enseignants de la matière sélectionnée", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-subject-ang")).toBeTruthy(),
    );
    // Sélectionner Anglais → Albert uniquement
    fireEvent.press(screen.getByTestId("teacher-oneoff-subject-ang"));
    expect(screen.getByTestId("teacher-oneoff-teacher-u1")).toBeTruthy();
    expect(screen.queryByTestId("teacher-oneoff-teacher-u2")).toBeNull();
  });

  it("affiche l'enseignant de Maths quand on sélectionne Maths", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-subject-math")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-subject-math"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-teacher-u2")).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-oneoff-teacher-u1")).toBeNull();
  });

  it("reset l'enseignant au premier de la matière quand la matière change", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-subject-math")).toBeTruthy(),
    );
    // Passer à Maths → Guy Ndem (u2) doit être sélectionné à la soumission
    fireEvent.press(screen.getByTestId("teacher-oneoff-subject-math"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-teacher-u2")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-date-input"),
      "2026-04-28",
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({
        subjectId: "math",
        teacherUserId: "u2",
      }),
    );
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe("TeacherOneOffCreatePanel — validation zod", () => {
  async function getFormVisible() {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
  }

  it("rejette un horaire de début vide au niveau du schéma", () => {
    const result = teacherOneOffCreateSchema.safeParse({
      classId: "class-6eC",
      occurrenceDate: "2026-04-28",
      start: "",
      end: "09:00",
      subjectId: "ang",
      teacherUserId: "u1",
      room: "B45",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un horaire de fin vide au niveau du schéma", () => {
    const result = teacherOneOffCreateSchema.safeParse({
      classId: "class-6eC",
      occurrenceDate: "2026-04-28",
      start: "08:00",
      end: "",
      subjectId: "ang",
      teacherUserId: "u1",
      room: "B45",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une salle vide au niveau du schéma", () => {
    const result = teacherOneOffCreateSchema.safeParse({
      classId: "class-6eC",
      occurrenceDate: "2026-04-28",
      start: "08:00",
      end: "09:00",
      subjectId: "ang",
      teacherUserId: "u1",
      room: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("bloque si format date invalide", async () => {
    await getFormVisible();
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-date-input"),
      "27/04/2026",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).not.toHaveBeenCalled());
  });

  it("bloque si la fin est avant le début", async () => {
    await getFormVisible();
    await pickTime("teacher-oneoff-start-input", "10", "00");
    await pickTime("teacher-oneoff-end-input", "09", "00");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-end-error")).toBeTruthy(),
    );
    expect(api.createOneOffSlot).not.toHaveBeenCalled();
  });

  it("bloque si la salle est vide", async () => {
    await getFormVisible();
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-room-error")).toBeTruthy(),
    );
    expect(api.createOneOffSlot).not.toHaveBeenCalled();
  });

  it("soumet si tous les champs sont valides", async () => {
    await getFormVisible();
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-date-input"),
      "2026-04-28",
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
  });
});

// ─── Soumission ───────────────────────────────────────────────────────────────

describe("TeacherOneOffCreatePanel — soumission", () => {
  async function fillAndSubmit(room = "B45") {
    renderPanel({ prefilledClassId: "class-6eC", prefilledDate: "2026-04-28" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByTestId("teacher-oneoff-room-input"), room);
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
  }

  it("appelle createOneOffSlot avec le bon payload", async () => {
    await fillAndSubmit("B45");
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({
        schoolYearId: "sy1",
        occurrenceDate: "2026-04-28",
        startMinute: 480, // 08:00
        endMinute: 540, // 09:00
        subjectId: "ang",
        teacherUserId: "u1",
        room: "B45",
        status: "PLANNED",
      }),
    );
  });

  it("transmet les horaires choisis via le sélecteur moderne", async () => {
    renderPanel({ prefilledClassId: "class-6eC", prefilledDate: "2026-04-28" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    await pickTime("teacher-oneoff-start-input", "09", "10");
    await pickTime("teacher-oneoff-end-input", "10", "00");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));

    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({
        startMinute: 550,
        endMinute: 600,
      }),
    );
  });

  it("appelle onSuccess après une création réussie", async () => {
    await fillAndSubmit();
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalledTimes(1));
  });

  it("affiche le toast succès après création", async () => {
    await fillAndSubmit();
    await waitFor(() =>
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Séance ajoutée" }),
      ),
    );
  });

  it("affiche le toast erreur si l'API rejette", async () => {
    api.createOneOffSlot.mockRejectedValueOnce(
      new Error("Conflicting occurrence for class"),
    );
    renderPanel({ prefilledClassId: "class-6eC", prefilledDate: "2026-04-28" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("n'appelle pas onSuccess si l'API rejette", async () => {
    api.createOneOffSlot.mockRejectedValueOnce(new Error("Forbidden"));
    renderPanel({ prefilledClassId: "class-6eC", prefilledDate: "2026-04-28" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("le bouton est désactivé pendant la soumission", async () => {
    // Promise qui ne résout jamais → état loading persistant
    api.createOneOffSlot.mockImplementation(() => new Promise(() => {}));
    renderPanel({ prefilledClassId: "class-6eC", prefilledDate: "2026-04-28" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-oneoff-create-save").props
          .accessibilityState?.disabled,
      ).toBe(true),
    );
  });

  it("utilise selectedSchoolYearId depuis le contexte", async () => {
    await fillAndSubmit();
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({ schoolYearId: "sy1" }),
    );
  });
});

// ─── Flux complet sans prefilledClassId ───────────────────────────────────────

describe("TeacherOneOffCreatePanel — flux via picker de classe", () => {
  it("sélectionner une classe charge son contexte et affiche le formulaire", async () => {
    renderPanel();
    expect(screen.queryByTestId("teacher-oneoff-start-input")).toBeNull();

    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));

    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-6eC",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
  });

  it("changer de classe recharge le contexte", async () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-6eC",
      ),
    );

    jest.clearAllMocks();
    api.getClassContext.mockResolvedValue({
      ...CLASS_CTX,
      class: { ...CLASS_CTX.class, id: "class-5eB", name: "5eB" },
    });

    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-5eB"));
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-5eB",
      ),
    );
  });

  it("soumet avec classId depuis le picker", async () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-date-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-date-input"),
      "2026-04-28",
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-room-input"),
      "B45",
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.any(Object),
    );
  });
});
