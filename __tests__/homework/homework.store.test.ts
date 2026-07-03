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

const baseRow = {
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
};

const baseDetail = {
  ...baseRow,
  comments: [],
  completionStatuses: [],
};

describe("useHomeworkStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useHomeworkStore.getState().reset();
  });

  // ─── loadHomework ──────────────────────────────────────────────────────

  describe("loadHomework", () => {
    it("charge la liste des homework", async () => {
      homeworkApi.listClassHomework.mockResolvedValueOnce([baseRow]);

      await useHomeworkStore
        .getState()
        .loadHomework("college-vogt", "class-1", {
          fromDate: "2026-05-01",
          toDate: "2026-05-31",
        });

      expect(useHomeworkStore.getState().items).toHaveLength(1);
      expect(useHomeworkStore.getState().items[0]?.id).toBe("hw-1");
    });

    it("trie les homework par date croissante", async () => {
      homeworkApi.listClassHomework.mockResolvedValueOnce([
        { ...baseRow, id: "hw-2", expectedAt: "2026-05-10T08:00:00Z" },
        { ...baseRow, id: "hw-1", expectedAt: "2026-05-05T08:00:00Z" },
      ]);

      await useHomeworkStore.getState().loadHomework("college-vogt", "class-1");

      expect(useHomeworkStore.getState().items[0]?.id).toBe("hw-1");
      expect(useHomeworkStore.getState().items[1]?.id).toBe("hw-2");
    });

    it("expose l'erreur si l'API échoue", async () => {
      homeworkApi.listClassHomework.mockRejectedValueOnce(
        new Error("Réseau indisponible"),
      );

      await expect(
        useHomeworkStore.getState().loadHomework("college-vogt", "class-1"),
      ).rejects.toThrow("Réseau indisponible");

      expect(useHomeworkStore.getState().errorMessage).toBe(
        "Réseau indisponible",
      );
    });
  });

  // ─── loadHomeworkDetail ────────────────────────────────────────────────

  describe("loadHomeworkDetail", () => {
    it("charge et met en cache le détail d'un devoir", async () => {
      homeworkApi.getHomeworkDetail.mockResolvedValueOnce(baseDetail);

      await useHomeworkStore
        .getState()
        .loadHomeworkDetail("college-vogt", "class-1", "hw-1");

      expect(useHomeworkStore.getState().details["hw-1"]).toBeDefined();
      expect(useHomeworkStore.getState().details["hw-1"]?.id).toBe("hw-1");
    });

    it("met à jour la row dans items après chargement du détail", async () => {
      useHomeworkStore.setState({ items: [{ ...baseRow, commentsCount: 0 }] });

      homeworkApi.getHomeworkDetail.mockResolvedValueOnce({
        ...baseDetail,
        comments: [
          {
            id: "cmt-1",
            body: "Super !",
            authorUserId: "teacher-1",
            authorDisplayName: "Mme Mbele",
            createdAt: "2026-05-01T10:00:00Z",
          },
        ],
      });

      await useHomeworkStore
        .getState()
        .loadHomeworkDetail("college-vogt", "class-1", "hw-1");

      expect(useHomeworkStore.getState().items[0]?.commentsCount).toBe(1);
    });
  });

  // ─── createHomework ────────────────────────────────────────────────────

  describe("createHomework", () => {
    it("met à jour le cache après création d'un homework", async () => {
      homeworkApi.createHomework.mockResolvedValueOnce({
        ...baseRow,
        id: "hw-new",
        title: "Lire le texte",
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
  });

  // ─── updateHomework ────────────────────────────────────────────────────

  describe("updateHomework", () => {
    it("remplace la row existante dans items", async () => {
      useHomeworkStore.setState({ items: [baseRow] });

      homeworkApi.updateHomework.mockResolvedValueOnce({
        ...baseRow,
        title: "Titre modifié",
      });

      await useHomeworkStore
        .getState()
        .updateHomework("college-vogt", "class-1", "hw-1", {
          title: "Titre modifié",
        });

      expect(useHomeworkStore.getState().items[0]?.title).toBe("Titre modifié");
    });

    it("met à jour le détail en cache si chargé", async () => {
      useHomeworkStore.setState({
        items: [baseRow],
        details: { "hw-1": baseDetail },
      });

      homeworkApi.updateHomework.mockResolvedValueOnce({
        ...baseRow,
        title: "Modifié",
        contentHtml: "<p>Nouveau contenu</p>",
      });

      await useHomeworkStore
        .getState()
        .updateHomework("college-vogt", "class-1", "hw-1", {
          title: "Modifié",
          contentHtml: "<p>Nouveau contenu</p>",
        });

      expect(useHomeworkStore.getState().details["hw-1"]?.title).toBe(
        "Modifié",
      );
      expect(useHomeworkStore.getState().details["hw-1"]?.contentHtml).toBe(
        "<p>Nouveau contenu</p>",
      );
    });

    it("ne crash pas si le détail n'est pas en cache", async () => {
      useHomeworkStore.setState({ items: [baseRow], details: {} });

      homeworkApi.updateHomework.mockResolvedValueOnce({
        ...baseRow,
        title: "OK sans détail",
      });

      await expect(
        useHomeworkStore
          .getState()
          .updateHomework("college-vogt", "class-1", "hw-1", {
            title: "OK sans détail",
          }),
      ).resolves.toBeDefined();
    });
  });

  // ─── deleteHomework ────────────────────────────────────────────────────

  describe("deleteHomework", () => {
    it("retire le homework des items et du cache", async () => {
      useHomeworkStore.setState({
        items: [baseRow],
        details: { "hw-1": baseDetail },
      });

      homeworkApi.deleteHomework.mockResolvedValueOnce(undefined);

      await useHomeworkStore
        .getState()
        .deleteHomework("college-vogt", "class-1", "hw-1");

      expect(useHomeworkStore.getState().items).toHaveLength(0);
      expect(useHomeworkStore.getState().details["hw-1"]).toBeUndefined();
    });

    it("expose l'erreur si la suppression échoue", async () => {
      homeworkApi.deleteHomework.mockRejectedValueOnce(
        new Error("Suppression impossible"),
      );

      await expect(
        useHomeworkStore
          .getState()
          .deleteHomework("college-vogt", "class-1", "hw-1"),
      ).rejects.toThrow("Suppression impossible");

      expect(useHomeworkStore.getState().errorMessage).toBe(
        "Suppression impossible",
      );
    });
  });

  // ─── addComment ────────────────────────────────────────────────────────

  describe("addComment", () => {
    it("met à jour le détail et le commentsCount dans items", async () => {
      useHomeworkStore.setState({
        items: [{ ...baseRow, commentsCount: 0 }],
        details: { "hw-1": baseDetail },
      });

      const detailWithComment = {
        ...baseDetail,
        comments: [
          {
            id: "cmt-1",
            body: "Bon courage !",
            authorUserId: "teacher-1",
            authorDisplayName: "Mme Mbele",
            createdAt: "2026-05-01T10:00:00Z",
          },
        ],
      };
      homeworkApi.addComment.mockResolvedValueOnce(detailWithComment);

      await useHomeworkStore
        .getState()
        .addComment("college-vogt", "class-1", "hw-1", {
          body: "Bon courage !",
        });

      expect(
        useHomeworkStore.getState().details["hw-1"]?.comments,
      ).toHaveLength(1);
      expect(useHomeworkStore.getState().items[0]?.commentsCount).toBe(1);
    });

    it("expose l'erreur si le commentaire échoue", async () => {
      homeworkApi.addComment.mockRejectedValueOnce(
        new Error("Commentaire refusé"),
      );

      await expect(
        useHomeworkStore
          .getState()
          .addComment("college-vogt", "class-1", "hw-1", { body: "..." }),
      ).rejects.toThrow("Commentaire refusé");

      expect(useHomeworkStore.getState().errorMessage).toBe(
        "Commentaire refusé",
      );
    });
  });

  // ─── setCompletion ─────────────────────────────────────────────────────

  describe("setCompletion", () => {
    it("rafraîchit le détail et la ligne après done=true", async () => {
      useHomeworkStore.setState({
        items: [
          {
            ...baseRow,
            summary: {
              totalStudents: 10,
              doneStudents: 0,
              pendingStudents: 10,
            },
          },
        ],
      });

      homeworkApi.setCompletion.mockResolvedValueOnce({
        ...baseDetail,
        summary: { totalStudents: 10, doneStudents: 1, pendingStudents: 9 },
        myDoneAt: "2026-05-02T17:00:00.000Z",
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
      expect(useHomeworkStore.getState().items[0]?.summary?.doneStudents).toBe(
        1,
      );
    });

    it("remet myDoneAt à null après done=false", async () => {
      useHomeworkStore.setState({
        items: [{ ...baseRow, myDoneAt: "2026-05-02T17:00:00.000Z" }],
        details: {
          "hw-1": { ...baseDetail, myDoneAt: "2026-05-02T17:00:00.000Z" },
        },
      });

      homeworkApi.setCompletion.mockResolvedValueOnce({
        ...baseDetail,
        myDoneAt: null,
      });

      await useHomeworkStore
        .getState()
        .setCompletion("college-vogt", "class-1", "hw-1", { done: false });

      expect(useHomeworkStore.getState().details["hw-1"]?.myDoneAt).toBeNull();
      expect(useHomeworkStore.getState().items[0]?.myDoneAt).toBeNull();
    });
  });

  // ─── clearError / reset ────────────────────────────────────────────────

  describe("clearError", () => {
    it("remet errorMessage à null", () => {
      useHomeworkStore.setState({ errorMessage: "Erreur quelconque" });
      useHomeworkStore.getState().clearError();
      expect(useHomeworkStore.getState().errorMessage).toBeNull();
    });
  });

  describe("reset", () => {
    it("vide items, details et errorMessage", () => {
      useHomeworkStore.setState({
        items: [baseRow],
        details: { "hw-1": baseDetail },
        errorMessage: "oops",
      });

      useHomeworkStore.getState().reset();

      expect(useHomeworkStore.getState().items).toHaveLength(0);
      expect(Object.keys(useHomeworkStore.getState().details)).toHaveLength(0);
      expect(useHomeworkStore.getState().errorMessage).toBeNull();
    });
  });
});
