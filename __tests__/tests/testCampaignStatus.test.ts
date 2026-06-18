import {
  getCampaignDisplayStatus,
  sortCampaignsByDisplayStatus,
} from "../../src/components/tests/testCampaignStatus";

function makeCampaign(overrides: {
  id: string;
  startsAt?: string | null;
  dueAt?: string | null;
  totalCases?: number;
  completedCases?: number;
}) {
  return {
    id: overrides.id,
    startsAt: overrides.startsAt ?? null,
    dueAt: overrides.dueAt ?? null,
    summary: {
      totalCases: overrides.totalCases ?? 4,
      completedCases: overrides.completedCases ?? 0,
    },
  };
}

describe("getCampaignDisplayStatus", () => {
  it("returns COMPLETED when every case has been completed", () => {
    const campaign = makeCampaign({
      id: "c1",
      totalCases: 4,
      completedCases: 4,
    });
    expect(getCampaignDisplayStatus(campaign)).toBe("COMPLETED");
  });

  it("returns UPCOMING when the start date is in the future and nothing was done yet", () => {
    const campaign = makeCampaign({
      id: "c2",
      startsAt: "2099-01-01T00:00:00.000Z",
      completedCases: 0,
    });
    expect(getCampaignDisplayStatus(campaign)).toBe("UPCOMING");
  });

  it("returns IN_PROGRESS when started and partially completed", () => {
    const campaign = makeCampaign({
      id: "c3",
      startsAt: "2020-01-01T00:00:00.000Z",
      totalCases: 4,
      completedCases: 2,
    });
    expect(getCampaignDisplayStatus(campaign)).toBe("IN_PROGRESS");
  });

  it("returns IN_PROGRESS when no startsAt is set but progress already started", () => {
    const campaign = makeCampaign({
      id: "c4",
      startsAt: null,
      totalCases: 4,
      completedCases: 1,
    });
    expect(getCampaignDisplayStatus(campaign)).toBe("IN_PROGRESS");
  });
});

describe("sortCampaignsByDisplayStatus", () => {
  it("orders in-progress first, then upcoming, then completed", () => {
    const completed = makeCampaign({
      id: "completed",
      totalCases: 2,
      completedCases: 2,
    });
    const upcoming = makeCampaign({
      id: "upcoming",
      startsAt: "2099-01-01T00:00:00.000Z",
      completedCases: 0,
    });
    const inProgress = makeCampaign({
      id: "in-progress",
      startsAt: "2020-01-01T00:00:00.000Z",
      totalCases: 4,
      completedCases: 1,
    });

    const sorted = sortCampaignsByDisplayStatus([
      completed,
      upcoming,
      inProgress,
    ]);

    expect(sorted.map((campaign) => campaign.id)).toEqual([
      "in-progress",
      "upcoming",
      "completed",
    ]);
  });
});
