export type CampaignDisplayStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

export type CampaignStatusInput = {
  startsAt: string | null;
  dueAt?: string | null;
  summary: { totalCases: number; completedCases: number };
};

export function getCampaignDisplayStatus(
  campaign: CampaignStatusInput,
): CampaignDisplayStatus {
  const { totalCases, completedCases } = campaign.summary;

  if (totalCases > 0 && completedCases >= totalCases) {
    return "COMPLETED";
  }

  const startsAt = campaign.startsAt ? new Date(campaign.startsAt) : null;
  if (startsAt && startsAt.getTime() > Date.now() && completedCases === 0) {
    return "UPCOMING";
  }

  return "IN_PROGRESS";
}

export function sortCampaignsByDisplayStatus<T extends CampaignStatusInput>(
  campaigns: T[],
): T[] {
  const order: Record<CampaignDisplayStatus, number> = {
    IN_PROGRESS: 0,
    UPCOMING: 1,
    COMPLETED: 2,
  };

  return [...campaigns].sort((a, b) => {
    const statusDiff =
      order[getCampaignDisplayStatus(a)] - order[getCampaignDisplayStatus(b)];
    if (statusDiff !== 0) return statusDiff;

    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    return aDue - bDue;
  });
}
