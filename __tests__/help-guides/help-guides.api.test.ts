import { helpGuidesApi } from "../../src/api/help-guides.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  BASE_URL: "http://localhost:3001/api",
  apiFetch: jest.fn(),
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue("token"),
  },
}));

describe("helpGuidesApi", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("appelle getCurrent avec les bons paramètres", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      canManage: false,
      guide: null,
      resolvedAudience: "PARENT",
    });

    await helpGuidesApi.getCurrent({ guideId: "g1" });

    expect(apiFetch).toHaveBeenCalledWith(
      "/help-guides/current?guideId=g1",
      {},
      true,
    );
  });

  it("appelle search avec query string", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ guide: null, items: [] });

    await helpGuidesApi.search("message", { guideId: "g1" });

    expect(apiFetch).toHaveBeenCalledWith(
      "/help-guides/current/search?q=message&guideId=g1",
      {},
      true,
    );
  });

  it("uploade une video inline", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://cdn.example.test/video.mp4" }),
    });

    const result = await helpGuidesApi.uploadInlineVideo({
      uri: "file:///tmp/video.mp4",
      name: "video.mp4",
      mimeType: "video/mp4",
    });

    expect(result.url).toBe("https://cdn.example.test/video.mp4");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://localhost:3001/api/help-guides/admin/uploads/inline-video",
    );
    expect(options.method).toBe("POST");
  });
});
