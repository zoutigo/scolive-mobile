import { platformIndicatorsApi } from "../../src/api/platform-indicators.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  BASE_URL: "http://localhost:3001/api",
  apiFetch: jest.fn(),
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue("token"),
  },
}));

describe("platformIndicatorsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("récupère les indicateurs plateforme via une requête authentifiée", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ schoolsCount: 1 });

    await platformIndicatorsApi.getIndicators();

    expect(apiFetch).toHaveBeenCalledWith("/system/indicators", {}, true);
  });
});
