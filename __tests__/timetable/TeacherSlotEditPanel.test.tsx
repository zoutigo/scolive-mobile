/**
 * Tests unitaires pour TeacherSlotEditPanel
 *
 * Couvre :
 * - rendu du formulaire (champs heure début/fin, salle, scope toggle)
 * - validation zod (format HH:MM, fin > début)
 * - sauvegarde selon scope × source
 * - suppression (occurrence seule vs série entière)
 * - gestion des erreurs API
 */
import React from "react";
import { Alert } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import {
  TeacherSlotEditPanel,
  teacherSlotEditSchema,
} from "../../src/components/timetable/TeacherSlotEditPanel";
import { timetableApi } from "../../src/api/timetable.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import type { TimetableOccurrence } from "../../src/types/timetable.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api", () => ({
  timetableApi: {
    createOneOffSlot: jest.fn(),
    updateOneOffSlot: jest.fn(),
    updateRecurringSlot: jest.fn(),
    deleteOneOffSlot: jest.fn(),
    deleteRecurringSlot: jest.fn(),
  },
}));
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(),
}));

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const mockApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockUseSuccessToastStore = useSuccessToastStore as jest.MockedFunction<
  typeof useSuccessToastStore
>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const RECURRING_OCC: TimetableOccurrence = {
  id: "occ-rec-1",
  source: "RECURRING",
  status: "PLANNED",
  occurrenceDate: "2026-04-14",
  weekday: 2,
  startMinute: 480,
  endMinute: 570,
  room: "A01",
  reason: null,
  slotId: "slot-1",
  oneOffSlotId: undefined,
  subject: { id: "math", name: "Mathématiques" },
  teacherUser: { id: "t1", firstName: "Alice", lastName: "Dupont" },
};

const ONE_OFF_OCC: TimetableOccurrence = {
  id: "occ-oneoff-1",
  source: "ONE_OFF",
  status: "PLANNED",
  occurrenceDate: "2026-04-14",
  weekday: 2,
  startMinute: 480,
  endMinute: 570,
  room: "B02",
  reason: null,
  slotId: undefined,
  oneOffSlotId: "oneoff-1",
  subject: { id: "ang", name: "Anglais" },
  teacherUser: { id: "t1", firstName: "Alice", lastName: "Dupont" },
};

function renderPanel(
  occurrence: TimetableOccurrence = RECURRING_OCC,
  overrides: Partial<{
    className: string;
    classId: string;
    schoolYearId: string;
    schoolSlug: string;
  }> = {},
) {
  return render(
    <TeacherSlotEditPanel
      occurrence={occurrence}
      className={overrides.className ?? "6e B"}
      classId={overrides.classId ?? "class-1"}
      schoolYearId={overrides.schoolYearId ?? "sy1"}
      schoolSlug={overrides.schoolSlug ?? "college-vogt"}
      onClose={mockOnClose}
      onSuccess={mockOnSuccess}
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

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSuccessToastStore.mockReturnValue({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  } as never);
  mockApi.createOneOffSlot.mockResolvedValue(undefined as never);
  mockApi.updateOneOffSlot.mockResolvedValue(undefined as never);
  mockApi.updateRecurringSlot.mockResolvedValue(undefined as never);
  mockApi.deleteOneOffSlot.mockResolvedValue(undefined as never);
  mockApi.deleteRecurringSlot.mockResolvedValue(undefined as never);
});

// ─── Rendu ───────────────────────────────────────────────────────────────────

describe("TeacherSlotEditPanel — rendu", () => {
  it("affiche le titre et le nom de la matière", () => {
    renderPanel();
    expect(screen.getByTestId("teacher-slot-edit-panel")).toBeTruthy();
    expect(screen.getByText("Modifier ce créneau")).toBeTruthy();
    expect(screen.getByText(/Mathématiques/)).toBeTruthy();
  });

  it("affiche le nom de la classe dans le sous-titre", () => {
    renderPanel(RECURRING_OCC, { className: "6e B" });
    expect(screen.getByText(/6e B/)).toBeTruthy();
  });

  it("pré-remplit les champs avec les valeurs de l'occurrence", () => {
    renderPanel();
    expect(screen.getByText("08:00")).toBeTruthy();
    expect(screen.getByText("09:30")).toBeTruthy();
    expect(screen.getByTestId("teacher-slot-room-input").props.value).toBe(
      "A01",
    );
  });

  it("affiche le toggle de scope pour un créneau récurrent", () => {
    renderPanel(RECURRING_OCC);
    expect(screen.getByTestId("teacher-slot-scope-row")).toBeTruthy();
    expect(screen.getByTestId("teacher-slot-scope-occurrence")).toBeTruthy();
    expect(screen.getByTestId("teacher-slot-scope-series")).toBeTruthy();
  });

  it("masque le toggle de scope pour un créneau ponctuel", () => {
    renderPanel(ONE_OFF_OCC);
    expect(screen.queryByTestId("teacher-slot-scope-row")).toBeNull();
  });

  it("affiche les boutons de suppression", () => {
    renderPanel();
    expect(screen.getByTestId("teacher-slot-delete-occurrence")).toBeTruthy();
    expect(screen.getByTestId("teacher-slot-delete-series")).toBeTruthy();
  });

  it("n'affiche pas le bouton 'Supprimer la série' pour un créneau ponctuel", () => {
    renderPanel(ONE_OFF_OCC);
    expect(screen.queryByTestId("teacher-slot-delete-series")).toBeNull();
  });

  it("le bouton fermer appelle onClose", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-slot-edit-close"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

// ─── Scope toggle ─────────────────────────────────────────────────────────────

describe("TeacherSlotEditPanel — scope toggle", () => {
  it("scope par défaut : 'Ce créneau'", () => {
    renderPanel();
    expect(screen.getByText("Enregistrer ce créneau")).toBeTruthy();
  });

  it("passer en scope 'série' change le label du bouton", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-slot-scope-series"));
    expect(screen.getByText("Modifier toute la série")).toBeTruthy();
  });

  it("repasser en scope 'occurrence' restaure le label", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-slot-scope-series"));
    fireEvent.press(screen.getByTestId("teacher-slot-scope-occurrence"));
    expect(screen.getByText("Enregistrer ce créneau")).toBeTruthy();
  });
});

// ─── Validation ──────────────────────────────────────────────────────────────

describe("TeacherSlotEditPanel — validation", () => {
  it("rejette un horaire de début vide au niveau du schéma", () => {
    const result = teacherSlotEditSchema.safeParse({
      start: "",
      end: "09:30",
      room: "A01",
      scope: "occurrence",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un horaire de fin vide au niveau du schéma", () => {
    const result = teacherSlotEditSchema.safeParse({
      start: "08:00",
      end: "",
      room: "A01",
      scope: "occurrence",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une salle vide au niveau du schéma", () => {
    const result = teacherSlotEditSchema.safeParse({
      start: "08:00",
      end: "09:30",
      room: " ",
      scope: "occurrence",
    });
    expect(result.success).toBe(false);
  });

  it("affiche une erreur si la fin est avant le début", async () => {
    renderPanel();
    await pickTime("teacher-slot-start-input", "09", "00");
    await pickTime("teacher-slot-end-input", "08", "00");
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-slot-end-error")).toBeTruthy(),
    );
    expect(mockApi.createOneOffSlot).not.toHaveBeenCalled();
  });

  it("affiche une erreur si la salle est vide", async () => {
    renderPanel();
    fireEvent.changeText(screen.getByTestId("teacher-slot-room-input"), "");
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-slot-room-error")).toBeTruthy(),
    );
    expect(mockApi.createOneOffSlot).not.toHaveBeenCalled();
  });

  it("n'affiche pas d'erreur si les champs sont valides", async () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
    expect(screen.queryByTestId("teacher-slot-start-error")).toBeNull();
    expect(screen.queryByTestId("teacher-slot-end-error")).toBeNull();
  });
});

// ─── Sauvegarde ──────────────────────────────────────────────────────────────

describe("TeacherSlotEditPanel — sauvegarde", () => {
  it("scope=occurrence + RECURRING → createOneOffSlot avec sourceSlotId", async () => {
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockApi.createOneOffSlot).toHaveBeenCalled());
    expect(mockApi.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-1",
      expect.objectContaining({
        sourceSlotId: "slot-1",
        status: "PLANNED",
        startMinute: 480,
        endMinute: 570,
      }),
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("scope=series + RECURRING → updateRecurringSlot", async () => {
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-scope-series"));
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockApi.updateRecurringSlot).toHaveBeenCalled());
    expect(mockApi.updateRecurringSlot).toHaveBeenCalledWith(
      "college-vogt",
      "slot-1",
      expect.objectContaining({ startMinute: 480, endMinute: 570 }),
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("transmet les horaires choisis via le sélecteur moderne", async () => {
    renderPanel(RECURRING_OCC);
    await pickTime("teacher-slot-start-input", "09", "15");
    await pickTime("teacher-slot-end-input", "10", "05");
    fireEvent.press(screen.getByTestId("teacher-slot-save"));

    await waitFor(() => expect(mockApi.createOneOffSlot).toHaveBeenCalled());
    expect(mockApi.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-1",
      expect.objectContaining({
        startMinute: 555,
        endMinute: 605,
      }),
    );
  });

  it("source=ONE_OFF → updateOneOffSlot", async () => {
    renderPanel(ONE_OFF_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockApi.updateOneOffSlot).toHaveBeenCalled());
    expect(mockApi.updateOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "oneoff-1",
      expect.objectContaining({ startMinute: 480, endMinute: 570 }),
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("appelle showSuccess après une sauvegarde réussie", async () => {
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());
  });

  it("propage le message d'erreur traduit quand l'API rejette", async () => {
    mockApi.createOneOffSlot.mockRejectedValueOnce(
      new Error(
        "Only class referent teacher can manage timetable for this class",
      ),
    );
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(mockShowError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("référent"),
      }),
    );
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("traduit un conflit horaire enseignant", async () => {
    mockApi.createOneOffSlot.mockRejectedValueOnce(
      new Error("Conflicting occurrence for teacher"),
    );
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(mockShowError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("enseignant"),
      }),
    );
  });

  it("traduit un conflit horaire de salle", async () => {
    mockApi.createOneOffSlot.mockRejectedValueOnce(
      new Error("Conflicting occurrence for room"),
    );
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(mockShowError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("salle"),
      }),
    );
  });

  it("affiche le message brut si non répertorié", async () => {
    mockApi.createOneOffSlot.mockRejectedValueOnce(
      new Error("Some unexpected backend error"),
    );
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(mockShowError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Some unexpected backend error",
      }),
    );
  });

  it("modification de la salle est transmise à l'API", async () => {
    renderPanel(RECURRING_OCC);
    fireEvent.changeText(screen.getByTestId("teacher-slot-room-input"), "C99");
    fireEvent.press(screen.getByTestId("teacher-slot-save"));
    await waitFor(() => expect(mockApi.createOneOffSlot).toHaveBeenCalled());
    expect(mockApi.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-1",
      expect.objectContaining({ room: "C99" }),
    );
  });
});

// ─── Suppression ─────────────────────────────────────────────────────────────

describe("TeacherSlotEditPanel — suppression", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const deleteBtn = buttons?.find((b) => b.style === "destructive");
      if (deleteBtn?.onPress) deleteBtn.onPress();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("suppression occurrence RECURRING → createOneOffSlot CANCELLED", async () => {
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-delete-occurrence"));
    await waitFor(() => expect(mockApi.createOneOffSlot).toHaveBeenCalled());
    expect(mockApi.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-1",
      expect.objectContaining({ status: "CANCELLED", sourceSlotId: "slot-1" }),
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("suppression série RECURRING → deleteRecurringSlot", async () => {
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-delete-series"));
    await waitFor(() => expect(mockApi.deleteRecurringSlot).toHaveBeenCalled());
    expect(mockApi.deleteRecurringSlot).toHaveBeenCalledWith(
      "college-vogt",
      "slot-1",
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("suppression créneau ONE_OFF → deleteOneOffSlot", async () => {
    renderPanel(ONE_OFF_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-delete-occurrence"));
    await waitFor(() => expect(mockApi.deleteOneOffSlot).toHaveBeenCalled());
    expect(mockApi.deleteOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "oneoff-1",
    );
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("appelle showSuccess après suppression", async () => {
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-delete-occurrence"));
    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());
  });

  it("propage le message d'erreur traduit quand la suppression échoue", async () => {
    mockApi.createOneOffSlot.mockRejectedValueOnce(
      new Error(
        "Only class referent teacher can manage timetable for this class",
      ),
    );
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-delete-occurrence"));
    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(mockShowError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("référent"),
      }),
    );
  });

  it("Alert.alert est appelé avec les bons titres", () => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-delete-occurrence"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Supprimer ce créneau ?",
      expect.any(String),
      expect.any(Array),
    );
  });

  it("Alert série a le bon titre", () => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    renderPanel(RECURRING_OCC);
    fireEvent.press(screen.getByTestId("teacher-slot-delete-series"));
    expect(Alert.alert).toHaveBeenCalledWith(
      "Supprimer toute la série ?",
      expect.any(String),
      expect.any(Array),
    );
  });
});
