import { useHomeworkStore } from "../../src/store/homework.store";

jest.mock("../../src/api/homework.api", () => ({
  homeworkApi: {
    listClassHomework: jest.fn(),
    getHomeworkDetail: jest.fn(),
    createHomework: jest.fn(),
    updateHomework: jest.fn(),
    deleteHomework: jest.fn(),
    addComment: jest.fn(),
    setCompletion: jest.fn(),
  },
}));

const { homeworkApi } = jest.requireMock("../../src/api/homework.api") as {
  homeworkApi: Record<string, jest.Mock>;
};

describe("useHomeworkStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useHomeworkStore.getState().reset();
  });

  it("charge la liste des homework", async () => {
    homeworkApi.listClassHomework.mockResolvedValueOnce([
      {
        id: "hw-1",
        classId: "class-1",
        title: "Exercices 1 à 3",
        contentHtml: "<p>Faire les exercices</p>",
        expectedAt: "2026-05-03T18:00:00.000Z",
        createdAt: "2026-05-01T08:00:00.000Z",
        updatedAt: "2026-05-01T08:00:00.000Z",
        authorUserId: "teacher-1",
        authorDisplayName: "Mme Mbele",
        subject: { id: "math", name: "Mathématiques" },
        attachments: [],
        commentsCount: 0,
        summary: null,
        myDoneAt: null,
      },
    ]);

    await useHomeworkStore.getState().loadHomework("college-vogt", "class-1", {
      fromDate: "2026-05-01",
      toDate: "2026-05-31",
    });

    expect(useHomeworkStore.getState().items).toHaveLength(1);
    expect(useHomeworkStore.getState().items[0]?.id).toBe("hw-1");
  });

  it("met à jour le cache après création d'un homework", async () => {
    homeworkApi.createHomework.mockResolvedValueOnce({
      id: "hw-1",
      classId: "class-1",
      title: "Lire le texte",
      contentHtml: "<p>Page 12</p>",
      expectedAt: "2026-05-02T18:00:00.000Z",
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-01T08:00:00.000Z",
      authorUserId: "teacher-1",
      authorDisplayName: "Mme Mbele",
      subject: { id: "fr", name: "Français" },
      attachments: [],
      commentsCount: 0,
      summary: null,
      myDoneAt: null,
    });

    await useHomeworkStore
      .getState()
      .createHomework("college-vogt", "class-1", {
        subjectId: "fr",
        title: "Lire le texte",
        expectedAt: "2026-05-02T18:00:00.000Z",
        contentHtml: "<p>Page 12</p>",
        attachments: [],
      });

    expect(useHomeworkStore.getState().items[0]?.title).toBe("Lire le texte");
  });

  it("rafraîchit le détail et la ligne après un changement d'état", async () => {
    useHomeworkStore.setState({
      items: [
        {
          id: "hw-1",
          classId: "class-1",
          title: "Exercices",
          contentHtml: "<p>Faire</p>",
          expectedAt: "2026-05-02T18:00:00.000Z",
          createdAt: "2026-05-01T08:00:00.000Z",
          updatedAt: "2026-05-01T08:00:00.000Z",
          authorUserId: "teacher-1",
          authorDisplayName: "Mme Mbele",
          subject: { id: "math", name: "Mathématiques" },
          attachments: [],
          commentsCount: 0,
          summary: { totalStudents: 10, doneStudents: 0, pendingStudents: 10 },
          myDoneAt: null,
        },
      ],
    });

    homeworkApi.setCompletion.mockResolvedValueOnce({
      id: "hw-1",
      classId: "class-1",
      title: "Exercices",
      contentHtml: "<p>Faire</p>",
      expectedAt: "2026-05-02T18:00:00.000Z",
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-01T08:00:00.000Z",
      authorUserId: "teacher-1",
      authorDisplayName: "Mme Mbele",
      subject: { id: "math", name: "Mathématiques" },
      attachments: [],
      commentsCount: 0,
      summary: { totalStudents: 10, doneStudents: 1, pendingStudents: 9 },
      myDoneAt: "2026-05-02T17:00:00.000Z",
      comments: [],
      completionStatuses: [],
    });

    await useHomeworkStore
      .getState()
      .setCompletion("college-vogt", "class-1", "hw-1", {
        done: true,
        studentId: "student-1",
      });

    expect(useHomeworkStore.getState().details["hw-1"]?.myDoneAt).toBe(
      "2026-05-02T17:00:00.000Z",
    );
    expect(useHomeworkStore.getState().items[0]?.summary?.doneStudents).toBe(1);
  });
});
