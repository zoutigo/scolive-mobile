import { BASE_URL, tokenStorage } from "../../src/api/client";
import { notesApi } from "../../src/api/notes.api";

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

describe("notesApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("charge les notes d'un élève avec le filtre de période", async () => {
    apiFetch.mockResolvedValueOnce([]);

    await notesApi.listStudentNotes("college-vogt", "student-1", "TERM_2");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/notes?term=TERM_2",
      {},
      true,
    );
  });

  it("charge le contexte enseignant d'une classe", async () => {
    apiFetch.mockResolvedValueOnce({});

    await notesApi.getTeacherContext("college-vogt", "class-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/classes/class-1/evaluations/context",
      {},
      true,
    );
  });

  it("crée une évaluation en JSON", async () => {
    apiFetch.mockResolvedValueOnce({});

    await notesApi.createEvaluation("college-vogt", "class-1", {
      subjectId: "math",
      subjectBranchId: "",
      evaluationTypeId: "type-1",
      title: "Interro 1",
      description: "Consignes",
      coefficient: 2,
      maxScore: 20,
      term: "TERM_1",
      scheduledAt: "2026-04-12T08:00:00.000Z",
      status: "DRAFT",
      attachments: [],
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/classes/class-1/evaluations",
      expect.objectContaining({
        method: "POST",
      }),
      true,
    );
  });

  it("upload une pièce jointe en multipart", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        url: "https://cdn.example.com/evaluations/sujet.pdf",
        mimeType: "application/pdf",
        sizeLabel: "12 Ko",
      }),
      text: async () => "",
    });

    const result = await notesApi.uploadAttachment("college-vogt", {
      uri: "file:///tmp/sujet.pdf",
      mimeType: "application/pdf",
      fileName: "sujet.pdf",
    });

    expect(tokenStorage.getAccessToken).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/schools/college-vogt/evaluations/uploads/attachment`,
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer token-123" },
        body: expect.any(FormData),
      }),
    );
    expect(result).toEqual({
      fileName: "sujet.pdf",
      fileUrl: "https://cdn.example.com/evaluations/sujet.pdf",
      mimeType: "application/pdf",
      sizeLabel: "12 Ko",
    });
  });
});
