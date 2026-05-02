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

describe("homeworkApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("charge la liste des homework avec filtre de période", async () => {
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

  it("crée un homework en JSON", async () => {
    apiFetch.mockResolvedValueOnce({
      id: "hw-1",
      classId: "class-1",
      title: "Lire la leçon",
      contentHtml: "<p>Chapitre 2</p>",
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
    });

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

  it("upload une pièce jointe via le microservice dédié", async () => {
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
});
