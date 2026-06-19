jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

import { testsAdminApi } from "../../src/api/tests-admin.api";

const { apiFetch } = jest.requireMock("../../src/api/client") as {
  apiFetch: jest.Mock;
};

describe("testsAdminApi", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({});
  });

  it("fetches the global synthesis without any school scoping", async () => {
    await testsAdminApi.getSynthesis();
    expect(apiFetch).toHaveBeenCalledWith("/admin/tests/synthesis", {}, true);
  });

  it("lists campaigns with search and status query params", async () => {
    await testsAdminApi.listCampaigns({ search: "auth", status: "ACTIVE" });
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/tests/campaigns?search=auth&status=ACTIVE",
      {},
      true,
    );
  });

  it("lists campaigns with no query params when none provided", async () => {
    await testsAdminApi.listCampaigns();
    expect(apiFetch).toHaveBeenCalledWith("/admin/tests/campaigns?", {}, true);
  });

  it("fetches a campaign by id without a schoolSlug in the path", async () => {
    await testsAdminApi.getCampaign("camp-1");
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/tests/campaigns/camp-1",
      {},
      true,
    );
  });

  it("recycles a test case via POST", async () => {
    await testsAdminApi.recycleCase("case-1");
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/tests/cases/case-1/recycle",
      { method: "POST" },
      true,
    );
  });

  it("updates case instructions via PATCH", async () => {
    await testsAdminApi.updateCaseInstructions("case-1", {
      expectedResult: "ça marche",
    });
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/tests/cases/case-1",
      {
        method: "PATCH",
        body: JSON.stringify({ expectedResult: "ça marche" }),
      },
      true,
    );
  });

  it("lists testers with a search query param", async () => {
    await testsAdminApi.listTesters({ search: "Valery" });
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/tests/testers?search=Valery",
      {},
      true,
    );
  });

  it("assigns a campaign to a tester via POST", async () => {
    await testsAdminApi.assignCampaign("camp-1", {
      testerId: "tester-1",
      note: "Prioritaire",
    });
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/tests/campaigns/camp-1/assignments",
      {
        method: "POST",
        body: JSON.stringify({ testerId: "tester-1", note: "Prioritaire" }),
      },
      true,
    );
  });

  it("unassigns a campaign via DELETE", async () => {
    await testsAdminApi.unassignCampaign("assign-1");
    expect(apiFetch).toHaveBeenCalledWith(
      "/admin/tests/assignments/assign-1",
      { method: "DELETE" },
      true,
    );
  });
});
