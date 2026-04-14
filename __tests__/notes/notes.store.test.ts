import { useNotesStore } from "../../src/store/notes.store";

jest.mock("../../src/api/notes.api", () => ({
  notesApi: {
    listStudentNotes: jest.fn(),
    getClassOptions: jest.fn(),
    getTeacherContext: jest.fn(),
    listClassEvaluations: jest.fn(),
    getEvaluation: jest.fn(),
    createEvaluation: jest.fn(),
    updateEvaluation: jest.fn(),
    saveScores: jest.fn(),
    listTermReports: jest.fn(),
    upsertTermReports: jest.fn(),
  },
}));

const { notesApi } = jest.requireMock("../../src/api/notes.api") as {
  notesApi: Record<string, jest.Mock>;
};

describe("useNotesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotesStore.getState().reset();
  });

  it("charge et met en cache les notes d'un élève", async () => {
    notesApi.listStudentNotes.mockResolvedValueOnce([
      {
        term: "TERM_1",
        label: "Trimestre 1",
        councilLabel: "6e A",
        generatedAtLabel: "Publié",
        generalAverage: {
          student: 13,
          class: 12,
          min: 7,
          max: 18,
        },
        subjects: [],
      },
    ]);

    await useNotesStore
      .getState()
      .loadStudentNotes("college-vogt", "student-1");

    expect(useNotesStore.getState().studentNotes["student-1"]).toHaveLength(1);
  });

  it("met à jour la liste après création d'une évaluation", async () => {
    notesApi.createEvaluation.mockResolvedValueOnce({
      id: "eval-1",
      title: "Interro 1",
      description: null,
      coefficient: 2,
      maxScore: 20,
      term: "TERM_1",
      status: "DRAFT",
      scheduledAt: "2026-04-12T08:00:00.000Z",
      createdAt: "2026-04-12T08:00:00.000Z",
      updatedAt: "2026-04-12T08:00:00.000Z",
      subject: { id: "math", name: "Mathématiques" },
      subjectBranch: null,
      evaluationType: { id: "type-1", code: "INT", label: "Interro" },
      attachments: [],
      _count: { scores: 0 },
    });

    await useNotesStore.getState().createEvaluation("college-vogt", "class-1", {
      subjectId: "math",
      subjectBranchId: "",
      evaluationTypeId: "type-1",
      title: "Interro 1",
      description: "",
      coefficient: 2,
      maxScore: 20,
      term: "TERM_1",
      scheduledAt: "2026-04-12T08:00:00.000Z",
      status: "DRAFT",
      attachments: [],
    });

    expect(useNotesStore.getState().evaluations[0]?.id).toBe("eval-1");
  });

  it("alimente le cache de détail après chargement d'une évaluation", async () => {
    notesApi.getEvaluation.mockResolvedValueOnce({
      id: "eval-1",
      title: "Interro 1",
      description: null,
      coefficient: 1,
      maxScore: 20,
      term: "TERM_1",
      status: "PUBLISHED",
      scheduledAt: "2026-04-12T08:00:00.000Z",
      createdAt: "2026-04-12T08:00:00.000Z",
      updatedAt: "2026-04-12T08:00:00.000Z",
      subject: { id: "math", name: "Mathématiques" },
      subjectBranch: null,
      evaluationType: { id: "type-1", code: "INT", label: "Interro" },
      attachments: [],
      _count: { scores: 1 },
      students: [
        {
          id: "student-1",
          firstName: "Lisa",
          lastName: "Ntamack",
          score: 15,
          scoreStatus: "ENTERED",
          comment: "Bon travail",
        },
      ],
    });

    await useNotesStore
      .getState()
      .loadEvaluationDetail("college-vogt", "class-1", "eval-1");

    expect(
      useNotesStore.getState().evaluationDetails["eval-1"]?.students,
    ).toHaveLength(1);
  });
});
