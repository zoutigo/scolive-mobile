import { siteContentApi } from "../../src/api/site-content.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  BASE_URL: "http://localhost:3001/api",
  apiFetch: jest.fn(),
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue("token"),
  },
}));

describe("siteContentApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("appelle getContactInfo sans authentification", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      email: "contact@scolive.cm",
      phone: "+237 6XX XXX XXX",
      address: "Cameroun",
    });

    const result = await siteContentApi.getContactInfo();

    expect(apiFetch).toHaveBeenCalledWith(
      "/public/site-content/contact",
      {},
      false,
    );
    expect(result.email).toBe("contact@scolive.cm");
  });

  it("appelle getLegalDocument avec slug et locale, sans authentification", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      slug: "cgu",
      locale: "fr",
      title: "CGU",
      contentHtml: "<p>x</p>",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = await siteContentApi.getLegalDocument("cgu", "fr");

    expect(apiFetch).toHaveBeenCalledWith(
      "/public/site-content/legal/cgu/fr",
      {},
      false,
    );
    expect(result.title).toBe("CGU");
  });
});
