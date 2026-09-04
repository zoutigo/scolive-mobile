export type CampaignDisplayStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

export type CampaignStatusInput = {
  startsAt: string | null;
  dueAt?: string | null;
  assignedToMe?: boolean;
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
  options: { prioritizeMine?: boolean } = {},
): T[] {
  const order: Record<CampaignDisplayStatus, number> = {
    IN_PROGRESS: 0,
    UPCOMING: 1,
    COMPLETED: 2,
  };
  const prioritizeMine = options.prioritizeMine ?? true;

  return [...campaigns].sort((a, b) => {
    const statusDiff =
      order[getCampaignDisplayStatus(a)] - order[getCampaignDisplayStatus(b)];
    if (statusDiff !== 0) return statusDiff;

    if (prioritizeMine) {
      const mineDiff = Number(!a.assignedToMe) - Number(!b.assignedToMe);
      if (mineDiff !== 0) return mineDiff;
    }

    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    return aDue - bDue;
  });
}
