/**
 * Tests unitaires et d'intégration du hook useTeacherDashboard.
 * Couvre : agrégation des données, filtrage des créneaux par enseignant,
 * détection des évaluations non saisies, devoirs non clos, messages non lus.
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { homeworkApi } from "../../src/api/homework.api";
import { messagingApi } from "../../src/api/messaging.api";
import { notesApi } from "../../src/api/notes.api";
import { teacherClassNavApi } from "../../src/api/teacher-class-nav.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useTeacherDashboard } from "../../src/hooks/useTeacherDashboard";
import type { HomeworkRow } from "../../src/types/homework.types";
import type {
  MessageListItem,
  MessagesMeta,
} from "../../src/types/messaging.types";
import type { EvaluationRow } from "../../src/types/notes.types";

const EMPTY_META: MessagesMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("../../src/api/teacher-class-nav.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/api/messaging.api");
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/homework.api");

const mockTeacherClassNavApi = teacherClassNavApi as jest.Mocked<
  typeof teacherClassNavApi
>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockMessagingApi = messagingApi as jest.Mocked<typeof messagingApi>;
const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockHomeworkApi = homeworkApi as jest.Mocked<typeof homeworkApi>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TODAY = new Date();
const todayIso = [
  TODAY.getFullYear(),
  String(TODAY.getMonth() + 1).padStart(2, "0"),
  String(TODAY.getDate()).padStart(2, "0"),
].join("-");

const TOMORROW_ISO = (() => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
})();

const YESTERDAY_ISO = (() => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
})();

const classA = {
  classId: "cls-A",
  className: "3e A",
  schoolYearId: "sy1",
  schoolYearLabel: "2024-2025",
  subjects: [{ id: "subj-1", name: "Maths" }],
  studentCount: 25,
};

const classB = {
  classId: "cls-B",
  className: "4e B",
  schoolYearId: "sy1",
  schoolYearLabel: "2024-2025",
  subjects: [{ id: "subj-2", name: "Français" }],
  studentCount: 28,
};

const baseClassOptions = {
  schoolYears: [{ id: "sy1", label: "2024-2025", isActive: true }],
  selectedSchoolYearId: "sy1",
  classes: [classA, classB],
};

const baseOccurrence = {
  id: "occ-1",
  source: "RECURRING" as const,
  status: "PLANNED" as const,
  occurrenceDate: todayIso,
  weekday: 1,
  startMinute: 480,
  endMinute: 570,
  room: "Salle 12",
  reason: null,
  subject: { id: "subj-1", name: "Maths" },
  teacherUser: { id: "teacher-42", firstName: "Paul", lastName: "Dupont" },
  slotId: "slot-1",
};

const baseTimetable = {
  class: { id: "cls-A", schoolYearId: "sy1", academicLevelId: null },
  slots: [],
  oneOffSlots: [],
  slotExceptions: [],
  occurrences: [baseOccurrence],
  calendarEvents: [],
  subjectStyles: [],
};

const baseMessage: MessageListItem = {
  id: "msg-1",
  folder: "inbox",
  status: "SENT",
  subject: "Réunion parents",
  preview: "Bonjour...",
  createdAt: new Date().toISOString(),
  sentAt: new Date().toISOString(),
  unread: true,
  sender: { id: "u2", firstName: "Marie", lastName: "Curie" },
  recipientsCount: 1,
  mailboxEntryId: "mbe-1",
  attachments: [],
};

const baseEvaluation: EvaluationRow = {
  id: "eval-1",
  title: "Contrôle 1",
  description: null,
  coefficient: 1,
  maxScore: 20,
  sequence: "SEQ_1",
  isFinalExam: false,
  countsForAverage: true,
  term: "TERM_1",
  status: "PUBLISHED",
  scheduledAt: todayIso,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  subject: { id: "subj-1", name: "Maths" },
  subjectBranch: null,
  evaluationType: { id: "et-1", code: "EXAM", label: "Examen" },
  attachments: [],
  _count: { scores: 10 }, // 10/25 saisis → non complet
};

const baseHomework: HomeworkRow = {
  id: "hw-1",
  classId: "cls-A",
  title: "Exercices chapitre 3",
  expectedAt: TOMORROW_ISO + "T00:00:00.000Z",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  authorUserId: "teacher-42",
  authorDisplayName: "Paul Dupont",
  subject: { id: "subj-1", name: "Maths" },
  attachments: [],
  commentsCount: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupDefaults() {
  mockTeacherClassNavApi.getClassOptions.mockResolvedValue(baseClassOptions);
  // cls-A a un créneau aujourd'hui, cls-B n'en a pas
  mockTimetableApi.getClassTimetable.mockImplementation(
    async (_slug, classId) =>
      classId === "cls-A"
        ? baseTimetable
        : { ...baseTimetable, occurrences: [] },
  );
  mockMessagingApi.unreadCount.mockResolvedValue(1);
  mockMessagingApi.list.mockResolvedValue({
    items: [baseMessage],
    meta: EMPTY_META,
  });
  // cls-A a l'évaluation de base, cls-B n'en a pas
  mockNotesApi.listClassEvaluations.mockImplementation(
    async (_slug, classId) => (classId === "cls-A" ? [baseEvaluation] : []),
  );
  // cls-A a le devoir de base, cls-B n'en a pas
  mockHomeworkApi.listClassHomework.mockImplementation(
    async (_slug, classId) => (classId === "cls-A" ? [baseHomework] : []),
  );
}

async function renderAndWait(
  schoolSlug = "college-vogt",
  userId = "teacher-42",
) {
  const { result } = renderHook(() => useTeacherDashboard(schoolSlug, userId));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return result;
}

// ── Tests unitaires — état initial ────────────────────────────────────────────

describe("useTeacherDashboard — état initial", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("démarre en état de chargement avec data null", () => {
    const { result } = renderHook(() =>
      useTeacherDashboard("college-vogt", "teacher-42"),
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("ne charge pas si schoolSlug est null", async () => {
    const { result } = renderHook(() =>
      useTeacherDashboard(null, "teacher-42"),
    );
    // Aucun chargement attendu : on attend juste la fin du render
    await act(async () => {});
    expect(mockTeacherClassNavApi.getClassOptions).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });
});

// ── Tests unitaires — classes ─────────────────────────────────────────────────

describe("useTeacherDashboard — classes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("expose la liste des classes après chargement", async () => {
    const result = await renderAndWait();
    expect(result.current.data?.classes).toHaveLength(2);
    expect(result.current.data?.classes[0]?.classId).toBe("cls-A");
    expect(result.current.data?.classes[1]?.classId).toBe("cls-B");
  });

  it("expose le studentCount de chaque classe", async () => {
    const result = await renderAndWait();
    expect(result.current.data?.classes[0]?.studentCount).toBe(25);
    expect(result.current.data?.classes[1]?.studentCount).toBe(28);
  });

  it("gère le cas où l'enseignant n'a aucune classe", async () => {
    mockTeacherClassNavApi.getClassOptions.mockResolvedValue({
      ...baseClassOptions,
      classes: [],
    });
    const result = await renderAndWait();
    expect(result.current.data?.classes).toHaveLength(0);
  });

  it("enrichit chaque classe avec openHomeworkCount et pendingEvalCount", async () => {
    const result = await renderAndWait();
    const clsA = result.current.data?.classes.find(
      (c) => c.classId === "cls-A",
    );
    expect(clsA?.openHomeworkCount).toBeGreaterThanOrEqual(0);
    expect(clsA?.pendingEvalCount).toBeGreaterThanOrEqual(0);
    expect(typeof clsA?.openHomeworkCount).toBe("number");
    expect(typeof clsA?.pendingEvalCount).toBe("number");
  });

  it("openHomeworkCount reflète le nombre de devoirs non clos pour cette classe", async () => {
    const result = await renderAndWait();
    // cls-A a 1 devoir non clos (baseHomework)
    const clsA = result.current.data?.classes.find(
      (c) => c.classId === "cls-A",
    );
    expect(clsA?.openHomeworkCount).toBe(1);
    // cls-B n'a pas de devoirs
    const clsB = result.current.data?.classes.find(
      (c) => c.classId === "cls-B",
    );
    expect(clsB?.openHomeworkCount).toBe(0);
  });

  it("pendingEvalCount reflète le nombre d'évaluations non saisies pour cette classe", async () => {
    const result = await renderAndWait();
    // cls-A a 1 éval avec 10/25 notes → pending
    const clsA = result.current.data?.classes.find(
      (c) => c.classId === "cls-A",
    );
    expect(clsA?.pendingEvalCount).toBe(1);
    // cls-B n'a pas d'éval
    const clsB = result.current.data?.classes.find(
      (c) => c.classId === "cls-B",
    );
    expect(clsB?.pendingEvalCount).toBe(0);
  });
});

// ── Tests unitaires — emploi du temps du jour ─────────────────────────────────

describe("useTeacherDashboard — créneaux du jour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("inclut les créneaux du jour pour cet enseignant", async () => {
    const result = await renderAndWait();
    expect(result.current.data?.todaySlots).toHaveLength(1);
    expect(result.current.data?.todaySlots[0]?.id).toBe("occ-1");
  });

  it("enrichit chaque créneau avec classId et className", async () => {
    const result = await renderAndWait();
    expect(result.current.data?.todaySlots[0]?.classId).toBe("cls-A");
    expect(result.current.data?.todaySlots[0]?.className).toBe("3e A");
  });

  it("exclut les créneaux d'un autre enseignant", async () => {
    mockTimetableApi.getClassTimetable.mockResolvedValue({
      ...baseTimetable,
      occurrences: [
        {
          ...baseOccurrence,
          teacherUser: {
            id: "other-teacher",
            firstName: "Jean",
            lastName: "Martin",
          },
        },
      ],
    });
    const result = await renderAndWait();
    expect(result.current.data?.todaySlots).toHaveLength(0);
  });

  it("exclut les créneaux annulés (CANCELLED)", async () => {
    mockTimetableApi.getClassTimetable.mockResolvedValue({
      ...baseTimetable,
      occurrences: [{ ...baseOccurrence, status: "CANCELLED" }],
    });
    const result = await renderAndWait();
    expect(result.current.data?.todaySlots).toHaveLength(0);
  });

  it("exclut les créneaux qui ne sont pas aujourd'hui", async () => {
    mockTimetableApi.getClassTimetable.mockResolvedValue({
      ...baseTimetable,
      occurrences: [{ ...baseOccurrence, occurrenceDate: YESTERDAY_ISO }],
    });
    const result = await renderAndWait();
    expect(result.current.data?.todaySlots).toHaveLength(0);
  });

  it("trie les créneaux par heure de début croissante", async () => {
    mockTimetableApi.getClassTimetable
      .mockResolvedValueOnce({
        ...baseTimetable,
        occurrences: [{ ...baseOccurrence, startMinute: 600 }],
      })
      .mockResolvedValueOnce({
        ...baseTimetable,
        occurrences: [{ ...baseOccurrence, id: "occ-2", startMinute: 480 }],
      });

    const result = await renderAndWait();
    const slots = result.current.data?.todaySlots ?? [];
    expect(slots[0]?.startMinute).toBeLessThanOrEqual(
      slots[1]?.startMinute ?? Infinity,
    );
  });
});

// ── Tests unitaires — messages ────────────────────────────────────────────────

describe("useTeacherDashboard — messages non lus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("expose le nombre total de messages non lus", async () => {
    mockMessagingApi.unreadCount.mockResolvedValue(7);
    const result = await renderAndWait();
    expect(result.current.data?.unreadCount).toBe(7);
  });

  it("limite les aperçus à 2 messages non lus maximum", async () => {
    const msg2 = { ...baseMessage, id: "msg-2", subject: "Deuxième message" };
    const msg3 = { ...baseMessage, id: "msg-3", subject: "Troisième message" };
    mockMessagingApi.list.mockResolvedValue({
      items: [baseMessage, msg2, msg3],
      meta: EMPTY_META,
    });
    const result = await renderAndWait();
    expect(result.current.data?.unreadMessages).toHaveLength(2);
  });

  it("n'inclut pas les messages lus dans les aperçus", async () => {
    const readMsg = { ...baseMessage, id: "msg-read", unread: false };
    mockMessagingApi.list.mockResolvedValue({
      items: [readMsg],
      meta: EMPTY_META,
    });
    const result = await renderAndWait();
    expect(result.current.data?.unreadMessages).toHaveLength(0);
  });

  it("expose 0 non lus et liste vide si aucun message", async () => {
    mockMessagingApi.unreadCount.mockResolvedValue(0);
    mockMessagingApi.list.mockResolvedValue({ items: [], meta: EMPTY_META });
    const result = await renderAndWait();
    expect(result.current.data?.unreadCount).toBe(0);
    expect(result.current.data?.unreadMessages).toHaveLength(0);
  });
});

// ── Tests unitaires — évaluations non saisies ────────────────────────────────

describe("useTeacherDashboard — évaluations non saisies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("détecte une évaluation partiellement saisie (scores < studentCount)", async () => {
    const result = await renderAndWait();
    // classA a 25 élèves, éval a 10 scores → non complète ; classB n'a pas d'éval
    expect(result.current.data?.pendingEvaluations).toHaveLength(1);
    expect(result.current.data?.pendingEvaluations[0]?.evaluation.id).toBe(
      "eval-1",
    );
  });

  it("exclut une évaluation entièrement saisie (scores === studentCount)", async () => {
    mockNotesApi.listClassEvaluations.mockImplementation(async () => [
      { ...baseEvaluation, _count: { scores: 25 } }, // 25/25 pour cls-A → complet
    ]);
    // cls-A a 25 élèves et 25 scores → complet ; cls-B n'est pas impactée
    const result = await renderAndWait();
    // Pour cls-B (28 élèves), 25 scores < 28 → encore pending, donc 1 reste
    // Ce test valide que cls-A est bien exclue (score=25 = studentCount=25)
    const clsAEvals = result.current.data?.pendingEvaluations.filter(
      (e) => e.classId === "cls-A",
    );
    expect(clsAEvals).toHaveLength(0);
  });

  it("enrichit chaque évaluation avec classId, className, studentCount", async () => {
    const result = await renderAndWait();
    const pending = result.current.data?.pendingEvaluations[0];
    expect(pending?.classId).toBe("cls-A");
    expect(pending?.className).toBe("3e A");
    expect(pending?.studentCount).toBe(25);
  });

  it("gère l'absence d'évaluations sans erreur", async () => {
    mockNotesApi.listClassEvaluations.mockResolvedValue([]);
    const result = await renderAndWait();
    expect(result.current.data?.pendingEvaluations).toHaveLength(0);
  });

  it("limite la liste à 2 évaluations maximum (slice dans le hook)", async () => {
    const manyEvals = Array.from({ length: 5 }, (_, i) => ({
      ...baseEvaluation,
      id: `eval-many-${i}`,
      _count: { scores: 0 },
    }));
    mockNotesApi.listClassEvaluations.mockImplementation(
      async (_slug, classId) => (classId === "cls-A" ? manyEvals : []),
    );
    const result = await renderAndWait();
    expect(result.current.data?.pendingEvaluations).toHaveLength(2);
  });
});

// ── Tests unitaires — devoirs ─────────────────────────────────────────────────

describe("useTeacherDashboard — devoirs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("inclut les devoirs dont la date d'échéance est future", async () => {
    const result = await renderAndWait();
    expect(
      result.current.data?.openHomework.some((h) => h.homework.id === "hw-1"),
    ).toBe(true);
  });

  it("exclut les devoirs dont la date d'échéance est passée", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([
      { ...baseHomework, expectedAt: YESTERDAY_ISO + "T00:00:00.000Z" },
    ]);
    const result = await renderAndWait();
    expect(result.current.data?.openHomework).toHaveLength(0);
  });

  it("trie les devoirs par date d'échéance croissante", async () => {
    const hw2 = {
      ...baseHomework,
      id: "hw-2",
      expectedAt: TOMORROW_ISO + "T23:59:59.000Z",
    };
    const hw1 = {
      ...baseHomework,
      id: "hw-1",
      expectedAt: TOMORROW_ISO + "T00:00:00.000Z",
    };
    mockHomeworkApi.listClassHomework
      .mockResolvedValueOnce([hw2, hw1])
      .mockResolvedValueOnce([]);
    const result = await renderAndWait();
    const hw = result.current.data?.openHomework ?? [];
    expect(
      hw[0]?.homework.expectedAt.localeCompare(
        hw[1]?.homework.expectedAt ?? "",
      ),
    ).toBeLessThanOrEqual(0);
  });

  it("enrichit chaque devoir avec classId, className et totalStudents", async () => {
    const result = await renderAndWait();
    const hw = result.current.data?.openHomework[0];
    expect(hw?.classId).toBe("cls-A");
    expect(hw?.className).toBe("3e A");
    expect(hw?.totalStudents).toBe(25);
  });

  it("limite la liste à 2 devoirs maximum (slice dans le hook)", async () => {
    const manyHw = Array.from({ length: 5 }, (_, i) => ({
      ...baseHomework,
      id: `hw-many-${i}`,
      expectedAt: TOMORROW_ISO + `T0${i}:00:00.000Z`,
    }));
    mockHomeworkApi.listClassHomework.mockImplementation(
      async (_slug, classId) => (classId === "cls-A" ? manyHw : []),
    );
    const result = await renderAndWait();
    expect(result.current.data?.openHomework).toHaveLength(2);
  });
});

// ── Tests de résilience — erreurs API ─────────────────────────────────────────

describe("useTeacherDashboard — résilience aux erreurs API partielles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("définit error si getClassOptions échoue", async () => {
    mockTeacherClassNavApi.getClassOptions.mockRejectedValue(
      new Error("Network error"),
    );
    const result = await renderAndWait();
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
  });

  it("continue si un appel timetable échoue (null → créneau ignoré)", async () => {
    mockTimetableApi.getClassTimetable.mockRejectedValue(new Error("Timeout"));
    const result = await renderAndWait();
    expect(result.current.data?.todaySlots).toHaveLength(0);
    expect(result.current.error).toBeNull(); // pas d'erreur globale
  });

  it("continue si l'API messagerie échoue (unreadCount → 0)", async () => {
    mockMessagingApi.unreadCount.mockRejectedValue(new Error("Auth error"));
    mockMessagingApi.list.mockRejectedValue(new Error("Auth error"));
    const result = await renderAndWait();
    expect(result.current.data?.unreadCount).toBe(0);
    expect(result.current.data?.unreadMessages).toHaveLength(0);
  });

  it("continue si listClassEvaluations échoue pour une classe", async () => {
    mockNotesApi.listClassEvaluations
      .mockResolvedValueOnce([baseEvaluation])
      .mockRejectedValueOnce(new Error("Forbidden"));
    const result = await renderAndWait();
    // Seule la classe A a des évaluations, classe B ignorée
    expect(
      result.current.data?.pendingEvaluations.some(
        (e) => e.classId === "cls-A",
      ),
    ).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("continue si listClassHomework échoue pour une classe", async () => {
    mockHomeworkApi.listClassHomework
      .mockResolvedValueOnce([baseHomework])
      .mockRejectedValueOnce(new Error("Forbidden"));
    const result = await renderAndWait();
    expect(
      result.current.data?.openHomework.some((h) => h.classId === "cls-A"),
    ).toBe(true);
    expect(result.current.error).toBeNull();
  });
});

// ── Tests d'intégration — appels API ─────────────────────────────────────────

describe("useTeacherDashboard — intégration appels API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaults();
  });

  it("appelle getClassOptions avec le bon schoolSlug", async () => {
    await renderAndWait("ecole-polytechnique");
    expect(mockTeacherClassNavApi.getClassOptions).toHaveBeenCalledWith(
      "ecole-polytechnique",
    );
  });

  it("appelle getClassTimetable pour chaque classe avec la date du jour", async () => {
    await renderAndWait();
    expect(mockTimetableApi.getClassTimetable).toHaveBeenCalledTimes(2);
    expect(mockTimetableApi.getClassTimetable).toHaveBeenCalledWith(
      "college-vogt",
      "cls-A",
      { fromDate: todayIso, toDate: todayIso },
    );
    expect(mockTimetableApi.getClassTimetable).toHaveBeenCalledWith(
      "college-vogt",
      "cls-B",
      { fromDate: todayIso, toDate: todayIso },
    );
  });

  it("appelle unreadCount et list avec folder inbox", async () => {
    await renderAndWait();
    expect(mockMessagingApi.unreadCount).toHaveBeenCalledWith("college-vogt");
    expect(mockMessagingApi.list).toHaveBeenCalledWith("college-vogt", {
      folder: "inbox",
      limit: 10,
    });
  });

  it("appelle listClassEvaluations pour chaque classe", async () => {
    await renderAndWait();
    expect(mockNotesApi.listClassEvaluations).toHaveBeenCalledTimes(2);
    expect(mockNotesApi.listClassEvaluations).toHaveBeenCalledWith(
      "college-vogt",
      "cls-A",
    );
    expect(mockNotesApi.listClassEvaluations).toHaveBeenCalledWith(
      "college-vogt",
      "cls-B",
    );
  });

  it("appelle listClassHomework pour chaque classe", async () => {
    await renderAndWait();
    expect(mockHomeworkApi.listClassHomework).toHaveBeenCalledTimes(2);
    expect(mockHomeworkApi.listClassHomework).toHaveBeenCalledWith(
      "college-vogt",
      "cls-A",
    );
  });

  it("expose refresh comme fonction appelable", async () => {
    const result = await renderAndWait();
    expect(typeof result.current.refresh).toBe("function");
    jest.clearAllMocks();
    setupDefaults();
    await result.current.refresh();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTeacherClassNavApi.getClassOptions).toHaveBeenCalledTimes(1);
  });
});
