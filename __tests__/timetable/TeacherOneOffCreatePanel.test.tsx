/**
 * Tests pour TeacherOneOffCreatePanel
 *
 * Couvre :
 * - picker de classe : visible seulement quand aucune classe connue, caché après sélection
 * - pas de picker d'enseignant (implicite = user courant)
 * - filtrage des matières par teacher
 * - toggle ponctuel / récurrent
 * - ponctuel : validation date, heures, soumission payload correct
 * - récurrent : sélecteur de jours (MultiPillSelector), validation, soumission mono/multi-jours
 * - salles : seulement les rooms isAvailable + AVAILABLE
 * - erreur API : bandeau inline (visible dans le Modal)
 * - erreur inline effacée au submit suivant
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherOneOffCreatePanel } from "../../src/components/timetable/TeacherOneOffCreatePanel";
import { timetableApi } from "../../src/api/timetable.api";
import { roomsApi } from "../../src/api/rooms.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { translate } from "../../src/i18n/useTranslation";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import { timeLabelToMinute } from "../../src/utils/timetable";
import { z } from "zod";

const t = (key: string) => translate(DEFAULT_LOCALE, key);

// Mirror schema — doit refléter exactement la logique de createSchema()
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;

const schema = z
  .object({
    slotType: z.enum(["oneoff", "recurring"]),
    subjectId: z
      .string()
      .min(1, t("timetable.classManager.validation.chooseSubject")),
    start: z
      .string()
      .trim()
      .min(1, t("timetable.oneOffPanel.validation.startRequired"))
      .regex(TIME_RE, t("timetable.classManager.validation.timeFormat")),
    end: z
      .string()
      .trim()
      .min(1, t("timetable.oneOffPanel.validation.endRequired"))
      .regex(TIME_RE, t("timetable.classManager.validation.timeFormat")),
    roomId: z.string().optional(),
    occurrenceDate: z.string().optional(),
    weekdays: z.array(z.string()).optional(),
    activeFromDate: z.string().optional(),
    activeToDate: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.slotType === "oneoff") {
      if (!d.occurrenceDate || !ISO_DATE.test(d.occurrenceDate)) {
        ctx.addIssue({
          path: ["occurrenceDate"],
          code: z.ZodIssueCode.custom,
          message: t("timetable.classManager.validation.dateFormat"),
        });
      }
    } else {
      if (!d.weekdays || d.weekdays.length === 0) {
        ctx.addIssue({
          path: ["weekdays"],
          code: z.ZodIssueCode.custom,
          message: t("timetable.classManager.validation.chooseDays"),
        });
      }
      if (!d.activeFromDate || !ISO_DATE.test(d.activeFromDate)) {
        ctx.addIssue({
          path: ["activeFromDate"],
          code: z.ZodIssueCode.custom,
          message: t("timetable.oneOffPanel.validation.activeFromRequired"),
        });
      }
      if (
        d.activeToDate &&
        d.activeToDate.trim() !== "" &&
        d.activeFromDate &&
        ISO_DATE.test(d.activeFromDate) &&
        ISO_DATE.test(d.activeToDate) &&
        d.activeToDate <= d.activeFromDate
      ) {
        ctx.addIssue({
          path: ["activeToDate"],
          code: z.ZodIssueCode.custom,
          message: t("timetable.oneOffPanel.validation.activeToAfterFrom"),
        });
      }
    }
    const s = timeLabelToMinute(d.start);
    const e = timeLabelToMinute(d.end);
    if (s !== null && e !== null && e <= s) {
      ctx.addIssue({
        path: ["end"],
        code: z.ZodIssueCode.custom,
        message: t("timetable.oneOffPanel.validation.endAfterStart"),
      });
    }
  });

import type {
  ClassTimetableContextResponse,
  TimetableClassOption,
} from "../../src/types/timetable.types";
import type { RoomAvailability } from "../../src/types/room.types";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api", () => ({
  timetableApi: {
    getClassContext: jest.fn(),
    createOneOffSlot: jest.fn(),
    createRecurringSlot: jest.fn(),
  },
}));
jest.mock("../../src/api/rooms.api", () => ({
  roomsApi: { listAvailableRooms: jest.fn() },
}));
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(),
}));

const mockShowSuccess = jest.fn();
const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();
const api = timetableApi as jest.Mocked<typeof timetableApi>;
const rooms = roomsApi as jest.Mocked<typeof roomsApi>;
const mockUseToast = useSuccessToastStore as jest.MockedFunction<
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

// Albert (u1) → Anglais ; Guy (u2) → Maths
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

// Rooms: B45 available, LAB2 full (isAvailable=false), A08 maintenance
const ROOMS: RoomAvailability[] = [
  {
    id: "r-b45",
    name: "B45",
    description: null,
    capacity: null,
    maxConcurrentSlots: 1,
    status: "AVAILABLE",
    occupiedSlots: 0,
    isAvailable: true,
  },
  {
    id: "r-lab2",
    name: "LAB2",
    description: null,
    capacity: 25,
    maxConcurrentSlots: 1,
    status: "AVAILABLE",
    occupiedSlots: 1,
    isAvailable: false,
  },
  {
    id: "r-a08",
    name: "A08",
    description: null,
    capacity: 30,
    maxConcurrentSlots: 1,
    status: "MAINTENANCE",
    occupiedSlots: 0,
    isAvailable: false,
  },
];

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-27T08:00:00Z")); // Monday
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.clearAllMocks();
  mockUseToast.mockReturnValue({ showSuccess: mockShowSuccess } as never);
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
  api.createRecurringSlot.mockResolvedValue(undefined as never);
  rooms.listAvailableRooms.mockResolvedValue(ROOMS);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

async function waitForForm(prefilledClassId = "class-6eC") {
  renderPanel({ prefilledClassId, prefilledTeacherId: "u1" });
  await waitFor(() =>
    expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
  );
}

async function switchToRecurring(prefilledDate = "2026-04-28") {
  renderPanel({
    prefilledClassId: "class-6eC",
    prefilledTeacherId: "u1",
    prefilledDate,
  });
  await waitFor(() =>
    expect(screen.getByTestId("teacher-oneoff-type-recurring")).toBeTruthy(),
  );
  fireEvent.press(screen.getByTestId("teacher-oneoff-type-recurring"));
  await waitFor(() =>
    expect(screen.getByTestId("teacher-oneoff-activefrom-input")).toBeTruthy(),
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

async function pickDate(testID: string, isoDate: string) {
  fireEvent.press(screen.getByTestId(testID));
  await waitFor(() =>
    expect(screen.getByTestId(`${testID}-modal`)).toBeTruthy(),
  );
  for (let attempt = 0; attempt < 24; attempt++) {
    if (screen.queryByTestId(`${testID}-day-${isoDate}`)) break;
    fireEvent.press(screen.getByTestId(`${testID}-next-month`));
  }
  fireEvent.press(screen.getByTestId(`${testID}-day-${isoDate}`));
  fireEvent.press(screen.getByTestId(`${testID}-confirm`));
  await waitFor(() =>
    expect(screen.queryByTestId(`${testID}-modal`)).toBeNull(),
  );
}

// ─── Schema Zod — oneoff ──────────────────────────────────────────────────────

describe("Schema Zod — oneoff", () => {
  it("valide un ponctuel correct sans salle", () => {
    expect(
      schema.safeParse({
        slotType: "oneoff",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
        occurrenceDate: "2026-04-28",
      }).success,
    ).toBe(true);
  });

  it("valide un ponctuel correct avec salle", () => {
    expect(
      schema.safeParse({
        slotType: "oneoff",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
        occurrenceDate: "2026-04-28",
        roomId: "r-b45",
      }).success,
    ).toBe(true);
  });

  it("rejette occurrenceDate absente", () => {
    expect(
      schema.safeParse({
        slotType: "oneoff",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
      }).success,
    ).toBe(false);
  });

  it("rejette occurrenceDate format invalide", () => {
    expect(
      schema.safeParse({
        slotType: "oneoff",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
        occurrenceDate: "28/04/2026",
      }).success,
    ).toBe(false);
  });

  it("rejette fin <= début", () => {
    const r = schema.safeParse({
      slotType: "oneoff",
      subjectId: "ang",
      start: "10:00",
      end: "09:00",
      occurrenceDate: "2026-04-28",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "end")).toBe(true);
    }
  });
});

// ─── Schema Zod — récurrent ───────────────────────────────────────────────────

describe("Schema Zod — récurrent", () => {
  it("valide un récurrent avec jours sélectionnés et sans activeToDate", () => {
    expect(
      schema.safeParse({
        slotType: "recurring",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
        weekdays: ["1"],
        activeFromDate: "2026-09-01",
      }).success,
    ).toBe(true);
  });

  it("valide un récurrent multi-jours avec activeToDate", () => {
    expect(
      schema.safeParse({
        slotType: "recurring",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
        weekdays: ["1", "3", "5"],
        activeFromDate: "2026-09-01",
        activeToDate: "2027-06-30",
      }).success,
    ).toBe(true);
  });

  it("rejette si weekdays est un tableau vide", () => {
    const r = schema.safeParse({
      slotType: "recurring",
      subjectId: "ang",
      start: "08:00",
      end: "09:00",
      weekdays: [],
      activeFromDate: "2026-09-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "weekdays")).toBe(true);
    }
  });

  it("rejette si weekdays est absent", () => {
    const r = schema.safeParse({
      slotType: "recurring",
      subjectId: "ang",
      start: "08:00",
      end: "09:00",
      activeFromDate: "2026-09-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "weekdays")).toBe(true);
    }
  });

  it("rejette activeFromDate absente", () => {
    expect(
      schema.safeParse({
        slotType: "recurring",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
        weekdays: ["1"],
      }).success,
    ).toBe(false);
  });

  it("rejette activeToDate <= activeFromDate", () => {
    const r = schema.safeParse({
      slotType: "recurring",
      subjectId: "ang",
      start: "08:00",
      end: "09:00",
      weekdays: ["1"],
      activeFromDate: "2026-09-01",
      activeToDate: "2026-08-01",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "activeToDate")).toBe(
        true,
      );
    }
  });

  it("accepte activeToDate vide (pas de date de fin)", () => {
    expect(
      schema.safeParse({
        slotType: "recurring",
        subjectId: "ang",
        start: "08:00",
        end: "09:00",
        weekdays: ["1"],
        activeFromDate: "2026-09-01",
        activeToDate: "",
      }).success,
    ).toBe(true);
  });
});

// ─── Rendu ────────────────────────────────────────────────────────────────────

describe("Rendu", () => {
  it("affiche le titre 'Nouveau créneau'", () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    expect(screen.getByText("Nouveau créneau")).toBeTruthy();
  });

  it("ferme au clic sur le X", () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-close"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("n'affiche PAS le picker de classe quand prefilledClassId est fourni", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() => expect(api.getClassContext).toHaveBeenCalled());
    expect(screen.queryByTestId("teacher-oneoff-class-class-6eC")).toBeNull();
  });

  it("affiche le nom de la classe en sous-titre du header", async () => {
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() => expect(screen.getByText("6eC")).toBeTruthy());
  });

  it("affiche le picker de classe quand aucune classe n'est connue", () => {
    renderPanel();
    expect(screen.getByTestId("teacher-oneoff-class-class-6eC")).toBeTruthy();
    expect(screen.getByTestId("teacher-oneoff-class-class-5eB")).toBeTruthy();
  });

  it("masque le picker de classe après sélection et charge le contexte", async () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-oneoff-class-class-5eB")).toBeNull();
  });

  it("n'affiche PAS de picker d'enseignant", async () => {
    await waitForForm();
    expect(screen.queryByTestId("teacher-oneoff-teacher-u1")).toBeNull();
    expect(screen.queryByTestId("teacher-oneoff-teacher-u2")).toBeNull();
  });

  it("affiche le toggle Ponctuel / Récurrent", async () => {
    await waitForForm();
    expect(screen.getByTestId("teacher-oneoff-type-oneoff")).toBeTruthy();
    expect(screen.getByTestId("teacher-oneoff-type-recurring")).toBeTruthy();
  });
});

// ─── Filtrage matières ────────────────────────────────────────────────────────

describe("Filtrage matières par enseignant", () => {
  it("Albert ne voit que Anglais (pas Maths)", async () => {
    await waitForForm();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-subject-ang")).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-oneoff-subject-math")).toBeNull();
  });

  it("Guy (u2) ne voit que Maths", async () => {
    useAuthStore.setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, id: "u2" } : null,
    }));
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u2",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-subject-math")).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-oneoff-subject-ang")).toBeNull();
  });

  it("un utilisateur absent des assignments voit toutes les matières", async () => {
    useAuthStore.setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, id: "admin-99" } : null,
    }));
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-subject-ang")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-oneoff-subject-math")).toBeTruthy();
  });
});

// ─── Salles disponibles ───────────────────────────────────────────────────────

describe("Sélecteur de salles (disponibles uniquement)", () => {
  async function openRoomDropdown() {
    fireEvent.press(screen.getByTestId("teacher-oneoff-room"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-room-modal")).toBeTruthy(),
    );
  }

  it("affiche seulement les salles isAvailable+AVAILABLE (B45), pas LAB2 ni A08", async () => {
    await waitForForm();
    await waitFor(() => expect(rooms.listAvailableRooms).toHaveBeenCalled());
    await openRoomDropdown();
    expect(screen.getByTestId("teacher-oneoff-room-option-r-b45")).toBeTruthy();
    expect(
      screen.queryByTestId("teacher-oneoff-room-option-r-lab2"),
    ).toBeNull();
    expect(screen.queryByTestId("teacher-oneoff-room-option-r-a08")).toBeNull();
  });

  it("affiche toujours l'option 'Aucune'", async () => {
    await waitForForm();
    await openRoomDropdown();
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-oneoff-room-option-none"),
      ).toBeTruthy(),
    );
  });

  it("appelle listAvailableRooms sans occurrenceDate en mode récurrent", async () => {
    await waitForForm();
    await waitFor(() => expect(rooms.listAvailableRooms).toHaveBeenCalled());
    jest.clearAllMocks();
    rooms.listAvailableRooms.mockResolvedValue([]);

    fireEvent.press(screen.getByTestId("teacher-oneoff-type-recurring"));
    await waitFor(() =>
      expect(rooms.listAvailableRooms).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ occurrenceDate: undefined }),
      ),
    );
  });

  it("recalcule les salles quand les heures changent", async () => {
    await waitForForm();
    await waitFor(() =>
      expect(rooms.listAvailableRooms).toHaveBeenCalledTimes(1),
    );
    await pickTime("teacher-oneoff-start-input", "10", "00");
    await waitFor(() =>
      expect(rooms.listAvailableRooms).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ startMinute: 600 }),
      ),
    );
  });
});

// ─── Mode ponctuel ────────────────────────────────────────────────────────────

describe("Mode ponctuel", () => {
  it("soumet avec le bon payload oneoff (sans salle)", async () => {
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "2026-04-28",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({
        schoolYearId: "sy1",
        occurrenceDate: "2026-04-28",
        startMinute: 480,
        endMinute: 540,
        subjectId: "ang",
        teacherUserId: "u1",
        roomId: null,
        status: "PLANNED",
      }),
    );
    expect(api.createRecurringSlot).not.toHaveBeenCalled();
  });

  it("soumet avec roomId quand une salle est choisie", async () => {
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "2026-04-28",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-room")).toBeTruthy(),
    );
    await waitFor(() => expect(rooms.listAvailableRooms).toHaveBeenCalled());
    fireEvent.press(screen.getByTestId("teacher-oneoff-room"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-oneoff-room-option-r-b45"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-room-option-r-b45"));
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createOneOffSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({ roomId: "r-b45" }),
    );
  });

  it("appelle onSuccess puis showSuccess après création réussie", async () => {
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "2026-04-28",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalledTimes(1));
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Séance ajoutée" }),
    );
  });

  it("bloque si occurrenceDate vide (aucune date sélectionnée)", async () => {
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).not.toHaveBeenCalled());
  });

  it("bloque si la fin est avant le début", async () => {
    await waitForForm();
    await pickTime("teacher-oneoff-start-input", "10", "00");
    await pickTime("teacher-oneoff-end-input", "09", "00");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-end-error")).toBeTruthy(),
    );
    expect(api.createOneOffSlot).not.toHaveBeenCalled();
  });

  it("n'affiche PAS le sélecteur de jours en mode ponctuel", async () => {
    await waitForForm();
    expect(
      screen.queryByTestId("teacher-oneoff-weekday-1"),
    ).toBeNull();
  });

  it("n'appelle PAS createRecurringSlot en mode ponctuel", async () => {
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "2026-04-28",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
    expect(api.createRecurringSlot).not.toHaveBeenCalled();
  });
});

// ─── Mode récurrent — sélecteur de jours ─────────────────────────────────────

describe("Mode récurrent — sélecteur de jours", () => {
  it("affiche le sélecteur de jours (7 pills) en mode récurrent", async () => {
    await switchToRecurring();
    for (const day of ["1", "2", "3", "4", "5", "6", "7"]) {
      expect(
        screen.getByTestId(`teacher-oneoff-weekday-${day}`),
      ).toBeTruthy();
    }
  });

  it("n'affiche PAS le badge auto-calculé du jour (supprimé)", async () => {
    await switchToRecurring("2026-04-27"); // lundi
    expect(
      screen.queryByTestId("teacher-oneoff-weekday-label"),
    ).toBeNull();
  });

  it("Lundi (1) est sélectionné par défaut", async () => {
    await switchToRecurring();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-weekday-1")).toBeTruthy(),
    );
    // Lundi sélectionné = soumet sans erreur de validation jours
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(api.createRecurringSlot).toHaveBeenCalledWith(
        "college-vogt",
        "class-6eC",
        expect.objectContaining({ weekday: 1 }),
      ),
    );
  });

  it("sélectionner Mercredi seul soumet un slot avec weekday:3", async () => {
    await switchToRecurring();
    // Ajouter Mercredi d'abord, puis désélectionner Lundi (MultiPillSelector interdit de vider la liste)
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-3")); // ["1","3"]
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-1")); // ["3"]
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createRecurringSlot).toHaveBeenCalledTimes(1));
    expect(api.createRecurringSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({ weekday: 3 }),
    );
  });

  it("sélectionner Lun+Mer+Ven → 3 appels createRecurringSlot", async () => {
    await switchToRecurring();
    // Lundi déjà sélectionné, ajouter Mercredi et Vendredi
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-3"));
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-5"));
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(api.createRecurringSlot).toHaveBeenCalledTimes(3),
    );
    const calledWeekdays = api.createRecurringSlot.mock.calls.map(
      (call) => (call[2] as { weekday: number }).weekday,
    );
    expect(calledWeekdays.sort()).toEqual([1, 3, 5]);
  });

  it("tous les appels multi-jours partagent le même payload (sauf weekday)", async () => {
    await switchToRecurring();
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-2")); // ajouter Mardi
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(api.createRecurringSlot).toHaveBeenCalledTimes(2),
    );
    for (const call of api.createRecurringSlot.mock.calls) {
      expect(call[2]).toMatchObject({
        schoolYearId: "sy1",
        startMinute: 480,
        endMinute: 540,
        subjectId: "ang",
        teacherUserId: "u1",
        roomId: null,
      });
    }
  });

  it("ne descend pas en dessous d'un jour (dernier jour non décoché)", async () => {
    await switchToRecurring();
    // Essayer de désélectionner le seul jour actif (Lundi)
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-1"));
    // MultiPillSelector empêche de vider la liste — Lundi reste sélectionné
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createRecurringSlot).toHaveBeenCalledTimes(1));
  });

  it("masque le champ occurrenceDate en mode récurrent", async () => {
    await switchToRecurring();
    expect(screen.queryByTestId("teacher-oneoff-date-input")).toBeNull();
  });

  it("affiche les champs activeFrom et activeTo", async () => {
    await switchToRecurring();
    expect(screen.getByTestId("teacher-oneoff-activefrom-input")).toBeTruthy();
    expect(screen.getByTestId("teacher-oneoff-activeto-input")).toBeTruthy();
  });
});

// ─── Mode récurrent — soumission payload ─────────────────────────────────────

describe("Mode récurrent — soumission", () => {
  it("soumet avec le bon payload complet (activeToDate renseigné)", async () => {
    await switchToRecurring();
    // Sélectionner Mardi (désélectionner Lundi, prendre Mardi)
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-1"));
    fireEvent.press(screen.getByTestId("teacher-oneoff-weekday-2"));
    await pickDate("teacher-oneoff-activefrom-input", "2026-09-01");
    await pickDate("teacher-oneoff-activeto-input", "2027-06-30");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createRecurringSlot).toHaveBeenCalled());
    expect(api.createRecurringSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({
        schoolYearId: "sy1",
        weekday: 2,
        startMinute: 480,
        endMinute: 540,
        subjectId: "ang",
        teacherUserId: "u1",
        roomId: null,
        activeFromDate: "2026-09-01",
        activeToDate: "2027-06-30",
      }),
    );
    expect(api.createOneOffSlot).not.toHaveBeenCalled();
  });

  it("soumet sans activeToDate quand vide (activeToDate: null)", async () => {
    await switchToRecurring("2026-09-01");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(api.createRecurringSlot).toHaveBeenCalled());
    expect(api.createRecurringSlot).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eC",
      expect.objectContaining({ activeToDate: null }),
    );
  });

  it("bloque si activeFromDate absente", async () => {
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-type-recurring")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-type-recurring"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-activefrom-input")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(api.createRecurringSlot).not.toHaveBeenCalled(),
    );
  });

  it("bloque si activeToDate <= activeFromDate", async () => {
    await switchToRecurring("2026-09-01");
    await pickDate("teacher-oneoff-activeto-input", "2026-08-01");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(api.createRecurringSlot).not.toHaveBeenCalled(),
    );
  });

  it("affiche le toast 'Créneau récurrent ajouté' après succès", async () => {
    await switchToRecurring("2026-09-01");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Créneau récurrent ajouté" }),
    );
  });
});

// ─── Gestion des erreurs API ──────────────────────────────────────────────────

describe("Gestion des erreurs API", () => {
  it("affiche le bandeau d'erreur inline quand createOneOffSlot rejette", async () => {
    api.createOneOffSlot.mockRejectedValueOnce(
      new Error("Ce créneau chevauche un cours existant"),
    );
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "2026-04-28",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-api-error")).toBeTruthy(),
    );
    expect(
      screen.getByText("Ce créneau chevauche un cours existant"),
    ).toBeTruthy();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("affiche le bandeau d'erreur inline quand createRecurringSlot rejette", async () => {
    api.createRecurringSlot.mockRejectedValueOnce(
      new Error("Conflict with existing slot"),
    );
    await switchToRecurring("2026-09-01");
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-api-error")).toBeTruthy(),
    );
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("efface le bandeau d'erreur au submit suivant réussi", async () => {
    api.createOneOffSlot.mockRejectedValueOnce(new Error("Conflict"));
    renderPanel({
      prefilledClassId: "class-6eC",
      prefilledTeacherId: "u1",
      prefilledDate: "2026-04-28",
    });
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-api-error")).toBeTruthy(),
    );
    api.createOneOffSlot.mockResolvedValueOnce(undefined as never);
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));
    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
    expect(screen.queryByTestId("teacher-oneoff-api-error")).toBeNull();
  });

  it("gère silencieusement l'échec de listAvailableRooms (pas de crash)", async () => {
    rooms.listAvailableRooms.mockRejectedValueOnce(new Error("Network"));
    await waitForForm();
    expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy();
  });

  it("affiche l'erreur contextuelle si getClassContext échoue", async () => {
    api.getClassContext.mockRejectedValueOnce(new Error("Not found"));
    renderPanel({ prefilledClassId: "class-6eC" });
    await waitFor(() =>
      expect(
        screen.getByText(t("timetable.oneOffPanel.contextError")),
      ).toBeTruthy(),
    );
  });
});

// ─── Flux sans prefilledClassId ───────────────────────────────────────────────

describe("Flux via picker de classe", () => {
  it("charge le contexte et masque le picker après sélection", async () => {
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
    expect(screen.queryByTestId("teacher-oneoff-class-class-5eB")).toBeNull();
  });

  it("soumet avec la classe sélectionnée dans le picker", async () => {
    renderPanel({ prefilledTeacherId: "u1", prefilledDate: "2026-04-28" });
    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-start-input")).toBeTruthy(),
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
