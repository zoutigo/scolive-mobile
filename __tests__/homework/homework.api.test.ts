import { BASE_URL, tokenStorage } from "../../src/api/client";
import { homeworkApi } from "../../src/api/homework.api";

jest.mock("../../src/api/client", () => {
  const actual = jest.requireActual("../../src/api/client");
  return {
    ...actual,
    apiFetch: jest.fn(),
    tokenStorage: {
      getAccessToken: jest.fn().mockResolvedValue("token-123"),
    },
  };
});

const { apiFetch } = jest.requireMock("../../src/api/client") as {
  apiFetch: jest.Mock;
};

const baseRow = {
  id: "hw-1",
  classId: "class-1",
  title: "Exercices chapitre 2",
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

describe("homeworkApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // ─── listClassHomework ─────────────────────────────────────────────────

  describe("listClassHomework", () => {
    it("charge la liste sans filtres", async () => {
      apiFetch.mockResolvedValueOnce([]);

      await homeworkApi.listClassHomework("college-vogt", "class-1");

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework",
        {},
        true,
      );
    });

    it("charge la liste avec filtre de période", async () => {
      apiFetch.mockResolvedValueOnce([]);

      await homeworkApi.listClassHomework("college-vogt", "class-1", {
        fromDate: "2026-05-01",
        toDate: "2026-05-31",
        studentId: "student-1",
      });

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework?fromDate=2026-05-01&toDate=2026-05-31&studentId=student-1",
        {},
        true,
      );
    });

    it("normalise les attachments (url → fileUrl)", async () => {
      apiFetch.mockResolvedValueOnce([
        {
          ...baseRow,
          attachments: [
            {
              fileName: "cours.pdf",
              url: "http://cdn/cours.pdf",
              mimeType: "application/pdf",
            },
          ],
        },
      ]);

      const rows = await homeworkApi.listClassHomework(
        "college-vogt",
        "class-1",
      );
      expect(rows[0].attachments[0].fileUrl).toBe("http://cdn/cours.pdf");
    });
  });

  // ─── getHomeworkDetail ─────────────────────────────────────────────────

  describe("getHomeworkDetail", () => {
    it("charge le détail d'un devoir sans studentId", async () => {
      apiFetch.mockResolvedValueOnce(baseDetail);

      await homeworkApi.getHomeworkDetail("college-vogt", "class-1", "hw-1");

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework/hw-1",
        {},
        true,
      );
    });

    it("ajoute le studentId en query string si fourni", async () => {
      apiFetch.mockResolvedValueOnce(baseDetail);

      await homeworkApi.getHomeworkDetail(
        "college-vogt",
        "class-1",
        "hw-1",
        "stu-1",
      );

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework/hw-1?studentId=stu-1",
        {},
        true,
      );
    });

    it("trie les commentaires par date croissante", async () => {
      apiFetch.mockResolvedValueOnce({
        ...baseDetail,
        comments: [
          {
            id: "cmt-2",
            body: "Deuxième",
            createdAt: "2026-05-02T10:00:00Z",
            authorUserId: "u-2",
            authorDisplayName: "M. Dupont",
          },
          {
            id: "cmt-1",
            body: "Premier",
            createdAt: "2026-05-01T09:00:00Z",
            authorUserId: "u-1",
            authorDisplayName: "Mme Mbele",
          },
        ],
      });

      const detail = await homeworkApi.getHomeworkDetail(
        "college-vogt",
        "class-1",
        "hw-1",
      );

      expect(detail.comments[0].id).toBe("cmt-1");
      expect(detail.comments[1].id).toBe("cmt-2");
    });
  });

  // ─── createHomework ────────────────────────────────────────────────────

  describe("createHomework", () => {
    it("crée un homework en JSON", async () => {
      apiFetch.mockResolvedValueOnce(baseRow);

      await homeworkApi.createHomework("college-vogt", "class-1", {
        subjectId: "math",
        title: "Lire la leçon",
        expectedAt: "2026-05-03T18:00:00.000Z",
        contentHtml: "<p>Chapitre 2</p>",
        attachments: [],
      });

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework",
        expect.objectContaining({ method: "POST" }),
        true,
      );
    });
  });

  // ─── updateHomework ────────────────────────────────────────────────────

  describe("updateHomework", () => {
    it("met à jour un devoir via PATCH", async () => {
      apiFetch.mockResolvedValueOnce({ ...baseRow, title: "Titre modifié" });

      const result = await homeworkApi.updateHomework(
        "college-vogt",
        "class-1",
        "hw-1",
        { title: "Titre modifié" },
      );

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework/hw-1",
        expect.objectContaining({ method: "PATCH" }),
        true,
      );
      expect(result.title).toBe("Titre modifié");
    });
  });

  // ─── deleteHomework ────────────────────────────────────────────────────

  describe("deleteHomework", () => {
    it("supprime un devoir via DELETE", async () => {
      apiFetch.mockResolvedValueOnce(undefined);

      await homeworkApi.deleteHomework("college-vogt", "class-1", "hw-1");

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework/hw-1",
        { method: "DELETE" },
        true,
      );
    });
  });

  // ─── addComment ────────────────────────────────────────────────────────

  describe("addComment", () => {
    it("ajoute un commentaire et renvoie le détail", async () => {
      const detailWithComment = {
        ...baseDetail,
        comments: [
          {
            id: "cmt-1",
            body: "Bravo !",
            createdAt: "2026-05-01T10:00:00Z",
            authorUserId: "teacher-1",
            authorDisplayName: "Mme Mbele",
          },
        ],
      };
      apiFetch.mockResolvedValueOnce(detailWithComment);

      const result = await homeworkApi.addComment(
        "college-vogt",
        "class-1",
        "hw-1",
        { body: "Bravo !" },
      );

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework/hw-1/comments",
        expect.objectContaining({ method: "POST" }),
        true,
      );
      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].body).toBe("Bravo !");
    });

    it("inclut studentId dans le payload si fourni", async () => {
      apiFetch.mockResolvedValueOnce(baseDetail);

      await homeworkApi.addComment("college-vogt", "class-1", "hw-1", {
        body: "Question",
        studentId: "stu-1",
      });

      const call = apiFetch.mock.calls[0];
      const body = JSON.parse(String(call[1].body));
      expect(body.studentId).toBe("stu-1");
    });
  });

  // ─── setCompletion ─────────────────────────────────────────────────────

  describe("setCompletion", () => {
    it("marque le devoir comme fait (done=true)", async () => {
      apiFetch.mockResolvedValueOnce({
        ...baseDetail,
        myDoneAt: "2026-05-02T17:00:00.000Z",
      });

      const result = await homeworkApi.setCompletion(
        "college-vogt",
        "class-1",
        "hw-1",
        { done: true },
      );

      expect(apiFetch).toHaveBeenCalledWith(
        "/schools/college-vogt/classes/class-1/homework/hw-1/completion",
        expect.objectContaining({ method: "PATCH" }),
        true,
      );
      expect(result.myDoneAt).toBe("2026-05-02T17:00:00.000Z");
    });

    it("démarque le devoir (done=false) → myDoneAt null", async () => {
      apiFetch.mockResolvedValueOnce({
        ...baseDetail,
        myDoneAt: null,
      });

      const result = await homeworkApi.setCompletion(
        "college-vogt",
        "class-1",
        "hw-1",
        { done: false },
      );

      expect(result.myDoneAt).toBeNull();
    });
  });

  // ─── uploadAttachment ──────────────────────────────────────────────────

  describe("uploadAttachment", () => {
    it("upload une pièce jointe via multipart", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          fileUrl: "https://cdn.example.com/homework/sujet.pdf",
          mimeType: "application/pdf",
          sizeLabel: "12 Ko",
          fileName: "sujet.pdf",
        }),
      });

      const result = await homeworkApi.uploadAttachment("college-vogt", {
        uri: "file:///tmp/sujet.pdf",
        mimeType: "application/pdf",
        fileName: "sujet.pdf",
      });

      expect(tokenStorage.getAccessToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/schools/college-vogt/homework/uploads/attachment`,
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer token-123" },
          body: expect.any(FormData),
        }),
      );
      expect(result).toEqual({
        fileName: "sujet.pdf",
        fileUrl: "https://cdn.example.com/homework/sujet.pdf",
        mimeType: "application/pdf",
        sizeLabel: "12 Ko",
      });
    });

    it("normalise url → fileUrl si le serveur renvoie url", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          url: "https://cdn.example.com/homework/image.png",
          mimeType: "image/png",
          fileName: "image.png",
        }),
      });

      const result = await homeworkApi.uploadAttachment("college-vogt", {
        uri: "file:///tmp/image.png",
        mimeType: "image/png",
        fileName: "image.png",
      });

      expect(result.fileUrl).toBe("https://cdn.example.com/homework/image.png");
    });

    it("lève une erreur si le serveur renvoie 413", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({ message: "Fichier trop volumineux" }),
      });

      await expect(
        homeworkApi.uploadAttachment("college-vogt", {
          uri: "file:///tmp/heavy.zip",
          mimeType: "application/zip",
          fileName: "heavy.zip",
        }),
      ).rejects.toThrow("Fichier trop volumineux");
    });
  });

  // ─── uploadInlineImage ─────────────────────────────────────────────────

  describe("uploadInlineImage", () => {
    it("upload une image inline et renvoie l'URL", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ url: "https://cdn.example.com/inline/img.jpg" }),
      });

      const result = await homeworkApi.uploadInlineImage("college-vogt", {
        uri: "file:///tmp/img.jpg",
        mimeType: "image/jpeg",
        fileName: "img.jpg",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/schools/college-vogt/homework/uploads/inline-image`,
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer token-123" },
        }),
      );
      expect(result.url).toBe("https://cdn.example.com/inline/img.jpg");
    });

    it("lève une erreur si l'upload échoue", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Erreur serveur" }),
      });

      await expect(
        homeworkApi.uploadInlineImage("college-vogt", {
          uri: "file:///tmp/img.jpg",
          mimeType: "image/jpeg",
          fileName: "img.jpg",
        }),
      ).rejects.toThrow("Erreur serveur");
    });
  });
});
