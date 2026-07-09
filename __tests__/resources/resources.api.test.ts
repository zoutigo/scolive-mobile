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

  describe("createResource", () => {
    it("posts the payload as-is", async () => {
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
        statementContent: "<p>Enonce</p>",
      });

      expect(apiFetch).toHaveBeenCalledWith(
        "/resources",
        expect.objectContaining({ method: "POST" }),
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

  it("builds the admin listing query with kind/part/status", async () => {
    apiFetch.mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 });

    await resourcesAdminApi.listAdminResources({
      kind: "ASSESSMENT",
      part: "correction",
      status: "PENDING",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/resources?kind=ASSESSMENT&part=correction&status=PENDING",
      {},
      true,
    );
  });

  it.each([
    ["approveStatement", "/admin/resources/res-1/statement/approve"],
    ["revokeStatement", "/admin/resources/res-1/statement/revoke"],
    ["approveCorrection", "/admin/resources/res-1/correction/approve"],
    ["revokeCorrection", "/admin/resources/res-1/correction/revoke"],
  ] as const)("%s PATCHes %s", async (method, path) => {
    apiFetch.mockResolvedValueOnce({ id: "res-1" });
    await resourcesAdminApi[method]("res-1");
    expect(apiFetch).toHaveBeenCalledWith(path, { method: "PATCH" }, true);
  });

  it("rejectStatement sends the optional reason in the body", async () => {
    apiFetch.mockResolvedValueOnce({ id: "res-1" });
    await resourcesAdminApi.rejectStatement("res-1", "Contenu incomplet");
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/resources/res-1/statement/reject",
      {
        method: "PATCH",
        body: JSON.stringify({ reason: "Contenu incomplet" }),
      },
      true,
    );
  });
});
