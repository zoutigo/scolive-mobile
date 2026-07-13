import { tokenStorage } from "../../src/api/client";
import { resourcesApi, resourcesAdminApi } from "../../src/api/resources.api";

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

describe("resourcesApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("listResources", () => {
    it("builds the query string with only the provided filters", async () => {
      apiFetch.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await resourcesApi.listResources({
        kind: "ASSESSMENT",
        academicLevelId: "level-1",
        subjectId: "sub-1",
      });

      expect(apiFetch).toHaveBeenCalledWith(
        "/resources?kind=ASSESSMENT&academicLevelId=level-1&subjectId=sub-1",
        {},
        true,
      );
    });

    it("includes schoolId, academicYearLabel and search when provided", async () => {
      apiFetch.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await resourcesApi.listResources({
        kind: "ASSESSMENT",
        schoolId: "school-1",
        academicYearLabel: "2025-2026",
        search: "chapitre 3",
      });

      expect(apiFetch).toHaveBeenCalledWith(
        "/resources?kind=ASSESSMENT&schoolId=school-1&academicYearLabel=2025-2026&search=chapitre+3",
        {},
        true,
      );
    });

    it("omits undefined filters entirely", async () => {
      apiFetch.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      await resourcesApi.listResources({ kind: "EXAM" });

      expect(apiFetch).toHaveBeenCalledWith("/resources?kind=EXAM", {}, true);
    });
  });

  describe("getCatalog", () => {
    it("hits the read-only national catalog route", async () => {
      apiFetch.mockResolvedValueOnce({ academicLevels: [], subjects: [] });
      await resourcesApi.getCatalog();
      expect(apiFetch).toHaveBeenCalledWith("/resources/catalog", {}, true);
    });
  });

  describe("listSchoolsWithResources", () => {
    it("hits the schools-with-resources route", async () => {
      apiFetch.mockResolvedValueOnce([{ id: "school-1", name: "Ecole A" }]);
      const result = await resourcesApi.listSchoolsWithResources();
      expect(apiFetch).toHaveBeenCalledWith("/resources/schools", {}, true);
      expect(result).toEqual([{ id: "school-1", name: "Ecole A" }]);
    });
  });

  describe("searchSchools", () => {
    it("hits the search route without a query param when q is omitted", async () => {
      apiFetch.mockResolvedValueOnce([]);
      await resourcesApi.searchSchools();
      expect(apiFetch).toHaveBeenCalledWith(
        "/resources/schools/search",
        {},
        true,
      );
    });

    it("forwards q as a query param when provided", async () => {
      apiFetch.mockResolvedValueOnce([
        {
          id: "school-1",
          name: "Ecole A",
          cycle: "SECONDARY",
          languageSystem: "FRANCOPHONE",
        },
      ]);
      const result = await resourcesApi.searchSchools("vogt");
      expect(apiFetch).toHaveBeenCalledWith(
        "/resources/schools/search?q=vogt",
        {},
        true,
      );
      expect(result).toEqual([
        {
          id: "school-1",
          name: "Ecole A",
          cycle: "SECONDARY",
          languageSystem: "FRANCOPHONE",
        },
      ]);
    });
  });

  describe("createResource", () => {
    it("posts the metadata-only payload as-is", async () => {
      apiFetch.mockResolvedValueOnce({ id: "res-1" });

      await resourcesApi.createResource({
        kind: "ASSESSMENT",
        schoolId: "school-1",
        academicLevelId: "level-1",
        subjectId: "sub-1",
        examType: "SEQUENCE_TEST",
        sequence: "SEQ_1",
        academicYearLabel: "2025-2026",
        title: "Controle",
      });

      expect(apiFetch).toHaveBeenCalledWith(
        "/resources",
        expect.objectContaining({ method: "POST" }),
        true,
      );
    });

    it("forwards confirmDuplicate when set", async () => {
      apiFetch.mockResolvedValueOnce({ id: "res-1" });

      await resourcesApi.createResource({
        kind: "ASSESSMENT",
        schoolId: "school-1",
        academicLevelId: "level-1",
        subjectId: "sub-1",
        examType: "SEQUENCE_TEST",
        sequence: "SEQ_1",
        academicYearLabel: "2025-2026",
        title: "Controle",
        confirmDuplicate: true,
      });

      const [, options] = apiFetch.mock.calls[0];
      expect(JSON.parse((options as { body: string }).body)).toEqual(
        expect.objectContaining({ confirmDuplicate: true }),
      );
    });
  });

  describe("listSubmissions / saveSubmissionDraft / submitSubmission", () => {
    it("listSubmissions GETs with the part query param", async () => {
      apiFetch.mockResolvedValueOnce([]);
      await resourcesApi.listSubmissions("res-1", "statement");
      expect(apiFetch).toHaveBeenCalledWith(
        "/resources/res-1/submissions?part=statement",
        {},
        true,
      );
    });

    it("saveSubmissionDraft POSTs to the part-scoped submissions route", async () => {
      apiFetch.mockResolvedValueOnce({ id: "sub-1" });
      await resourcesApi.saveSubmissionDraft("res-1", "correction", {
        content: "<p>Corrige</p>",
        attachments: [],
      });
      expect(apiFetch).toHaveBeenCalledWith(
        "/resources/res-1/correction/submissions",
        {
          method: "POST",
          body: JSON.stringify({ content: "<p>Corrige</p>", attachments: [] }),
        },
        true,
      );
    });

    it("submitSubmission PATCHes the submit route", async () => {
      apiFetch.mockResolvedValueOnce({ id: "sub-1", status: "AWAITING" });
      await resourcesApi.submitSubmission("res-1", "sub-1");
      expect(apiFetch).toHaveBeenCalledWith(
        "/resources/res-1/submissions/sub-1/submit",
        { method: "PATCH" },
        true,
      );
    });
  });

  describe("favoriteResource / unfavoriteResource", () => {
    it("POSTs to favorite and DELETEs to unfavorite", async () => {
      apiFetch.mockResolvedValue({ favorite: true });

      await resourcesApi.favoriteResource("res-1");
      expect(apiFetch).toHaveBeenCalledWith(
        "/resources/res-1/favorite",
        { method: "POST" },
        true,
      );

      await resourcesApi.unfavoriteResource("res-1");
      expect(apiFetch).toHaveBeenCalledWith(
        "/resources/res-1/favorite",
        { method: "DELETE" },
        true,
      );
    });
  });

  describe("uploadAttachment", () => {
    it("reconstructs a clean attachment object, never spreading the raw media response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: "https://media.test/f.pdf",
          size: 12345,
          width: 800,
          height: 600,
          fileName: "controle.pdf",
          mimeType: "application/pdf",
        }),
      });

      const result = await resourcesApi.uploadAttachment({
        uri: "file:///tmp/controle.pdf",
        mimeType: "application/pdf",
        fileName: "controle.pdf",
      });

      expect(result).toEqual({
        fileName: "controle.pdf",
        fileUrl: "https://media.test/f.pdf",
        mimeType: "application/pdf",
        sizeLabel: null,
      });
      // regression guard: raw media fields must never leak into the payload
      expect(result).not.toHaveProperty("url");
      expect(result).not.toHaveProperty("size");
      expect(result).not.toHaveProperty("width");
      expect(result).not.toHaveProperty("height");
    });

    it("throws with the API error message when the upload fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Type de piece jointe non supporte" }),
      });

      await expect(
        resourcesApi.uploadAttachment({
          uri: "file:///tmp/x.exe",
          mimeType: "application/x-msdownload",
          fileName: "x.exe",
        }),
      ).rejects.toThrow("Type de piece jointe non supporte");
    });
  });

  describe("uploadInlineImage", () => {
    it("posts to the dedicated inline-image route, distinct from attachments", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: "https://media.test/inline.webp" }),
      });

      const result = await resourcesApi.uploadInlineImage({
        uri: "file:///tmp/inline.png",
        mimeType: "image/png",
        fileName: "inline.png",
      });

      expect(result).toEqual({ url: "https://media.test/inline.webp" });
      const [calledUrl] = (global.fetch as jest.Mock).mock.calls[0];
      expect(calledUrl).toContain("/resources/uploads/inline-image");
    });
  });

  it("sends the bearer token on multipart uploads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://media.test/f.pdf" }),
    });

    await resourcesApi.uploadAttachment({
      uri: "file:///tmp/x.pdf",
      mimeType: "application/pdf",
      fileName: "x.pdf",
    });

    expect(tokenStorage.getAccessToken).toHaveBeenCalled();
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer token-123");
  });
});

describe("resourcesAdminApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the admin submissions listing query with kind/part/status", async () => {
    apiFetch.mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 });

    await resourcesAdminApi.listAdminSubmissions({
      kind: "ASSESSMENT",
      part: "correction",
      status: "AWAITING",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/resources/submissions?kind=ASSESSMENT&part=correction&status=AWAITING",
      {},
      true,
    );
  });

  it.each([
    ["approveSubmission", "/admin/resources/submissions/sub-1/approve"],
    ["revokeSubmission", "/admin/resources/submissions/sub-1/revoke"],
  ] as const)("%s PATCHes %s", async (method, path) => {
    apiFetch.mockResolvedValueOnce({ id: "sub-1" });
    await resourcesAdminApi[method]("sub-1");
    expect(apiFetch).toHaveBeenCalledWith(path, { method: "PATCH" }, true);
  });

  it("rejectSubmission sends the optional reason in the body", async () => {
    apiFetch.mockResolvedValueOnce({ id: "sub-1" });
    await resourcesAdminApi.rejectSubmission("sub-1", "Contenu incomplet");
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/resources/submissions/sub-1/reject",
      {
        method: "PATCH",
        body: JSON.stringify({ reason: "Contenu incomplet" }),
      },
      true,
    );
  });
});
