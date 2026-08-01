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

  it("appelle getAdminContactInfo avec authentification", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      email: "contact@scolive.cm",
      phone: "+237 6XX XXX XXX",
      address: "Cameroun",
    });

    await siteContentApi.getAdminContactInfo();

    expect(apiFetch).toHaveBeenCalledWith(
      "/site-content/admin/contact",
      {},
      true,
    );
  });

  it("appelle updateContactInfo en PUT avec authentification", async () => {
    const payload = {
      email: "a@b.cm",
      phone: "+237 690000000",
      address: "Douala",
      legalRepresentativeFirstName: "",
      legalRepresentativeLastName: "",
    };
    (apiFetch as jest.Mock).mockResolvedValue(payload);

    await siteContentApi.updateContactInfo(payload);

    expect(apiFetch).toHaveBeenCalledWith(
      "/site-content/admin/contact",
      { method: "PUT", body: JSON.stringify(payload) },
      true,
    );
  });

  it("appelle listLegalDocuments avec la query slug/locale", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([]);

    await siteContentApi.listLegalDocuments({ slug: "cgu", locale: "fr" });

    expect(apiFetch).toHaveBeenCalledWith(
      "/site-content/admin/legal-documents?slug=cgu&locale=fr",
      {},
      true,
    );
  });

  it("appelle createLegalDocument en POST avec authentification", async () => {
    const payload = {
      slug: "cgu" as const,
      locale: "fr" as const,
      title: "CGU",
      contentHtml: "<p>x</p>",
    };
    (apiFetch as jest.Mock).mockResolvedValue({ id: "doc-1", ...payload });

    await siteContentApi.createLegalDocument(payload);

    expect(apiFetch).toHaveBeenCalledWith(
      "/site-content/admin/legal-documents",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  });

  it("appelle updateLegalDocument en PATCH avec authentification", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ id: "doc-1" });

    await siteContentApi.updateLegalDocument("doc-1", {
      title: "CGU v2",
      contentHtml: "<p>y</p>",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/site-content/admin/legal-documents/doc-1",
      {
        method: "PATCH",
        body: JSON.stringify({ title: "CGU v2", contentHtml: "<p>y</p>" }),
      },
      true,
    );
  });

  it("appelle publishLegalDocument en POST avec authentification", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      id: "doc-1",
      status: "PUBLISHED",
    });

    await siteContentApi.publishLegalDocument("doc-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/site-content/admin/legal-documents/doc-1/publish",
      { method: "POST" },
      true,
    );
  });

  it("appelle deleteLegalDocument en DELETE avec authentification", async () => {
    (apiFetch as jest.Mock).mockResolvedValue(undefined);

    await siteContentApi.deleteLegalDocument("doc-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/site-content/admin/legal-documents/doc-1",
      { method: "DELETE" },
      true,
    );
  });
});
