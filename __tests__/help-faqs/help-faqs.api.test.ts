import { helpFaqsApi } from "../../src/api/help-faqs.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  BASE_URL: "http://localhost:3001/api",
  apiFetch: jest.fn(),
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue("token"),
  },
}));

describe("helpFaqsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("appelle getCurrent avec les bons paramètres", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      permissions: { canManageGlobal: false, canManageSchool: false },
      schoolScope: null,
      sources: [],
      defaultSourceKey: null,
      resolvedAudience: "PARENT",
    });

    await helpFaqsApi.getCurrent({ faqId: "faq-1" });

    expect(apiFetch).toHaveBeenCalledWith(
      "/help-faqs/current?faqId=faq-1",
      {},
      true,
    );
  });

  it("appelle search avec query string", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ sources: [], items: [] });

    await helpFaqsApi.search("connexion", { faqId: "faq-1" });

    expect(apiFetch).toHaveBeenCalledWith(
      "/help-faqs/current/search?q=connexion&faqId=faq-1",
      {},
      true,
    );
  });

  it("appelle createItem sur le bon endpoint", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ id: "item-1" });

    await helpFaqsApi.createGlobalItem("theme-1", {
      question: "Comment récupérer mon mot de passe ?",
      orderIndex: 1,
      answerHtml: "<p>Utilisez le lien mot de passe oublié.</p>",
      answerJson: { html: "<p>Utilisez le lien mot de passe oublié.</p>" },
      status: "PUBLISHED",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/help-faqs/admin/global/themes/theme-1/items",
      expect.objectContaining({ method: "POST" }),
      true,
    );
  });
});
