import { useBadgesStore } from "../../src/store/badges.store";

jest.mock("../../src/api/badges.api", () => ({
  badgesApi: {
    getUnreadSummary: jest.fn(),
  },
}));

const mockSetBadgeCountAsync = jest.fn().mockResolvedValue(true);
jest.mock("../../src/notifications/push-registration", () => ({
  isRunningInExpoGo: () => false,
  getNotifications: () => ({
    setBadgeCountAsync: mockSetBadgeCountAsync,
  }),
}));

const { badgesApi } = jest.requireMock("../../src/api/badges.api") as {
  badgesApi: Record<string, jest.Mock>;
};

const SUMMARY = {
  messagesUnread: 1,
  feedUnread: 0,
  ticketsNeedingResponse: 0,
  ticketsUnreadReplies: 0,
  children: [],
  teacherClasses: [],
  total: 1,
};

describe("useBadgesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBadgesStore.getState().clear();
  });

  it("loads and stores the summary for the given school", async () => {
    badgesApi.getUnreadSummary.mockResolvedValueOnce(SUMMARY);

    await useBadgesStore.getState().loadSummary("college-vogt");

    expect(badgesApi.getUnreadSummary).toHaveBeenCalledWith("college-vogt");
    expect(useBadgesStore.getState().summary).toEqual(SUMMARY);
    expect(useBadgesStore.getState().schoolSlug).toBe("college-vogt");
  });

  it("keeps the last known summary for the same school when the fetch fails", async () => {
    badgesApi.getUnreadSummary.mockResolvedValueOnce(SUMMARY);
    await useBadgesStore.getState().loadSummary("college-vogt");

    badgesApi.getUnreadSummary.mockRejectedValueOnce(new Error("offline"));
    await useBadgesStore.getState().loadSummary("college-vogt");

    expect(useBadgesStore.getState().summary).toEqual(SUMMARY);
  });

  it("clears the summary when switching to a different school and the fetch fails", async () => {
    badgesApi.getUnreadSummary.mockResolvedValueOnce(SUMMARY);
    await useBadgesStore.getState().loadSummary("college-vogt");

    badgesApi.getUnreadSummary.mockRejectedValueOnce(new Error("offline"));
    await useBadgesStore.getState().loadSummary("other-school");

    expect(useBadgesStore.getState().summary).toBeNull();
    expect(useBadgesStore.getState().schoolSlug).toBe("other-school");
  });

  it("clear() resets the store", async () => {
    badgesApi.getUnreadSummary.mockResolvedValueOnce(SUMMARY);
    await useBadgesStore.getState().loadSummary("college-vogt");

    useBadgesStore.getState().clear();

    expect(useBadgesStore.getState().summary).toBeNull();
    expect(useBadgesStore.getState().schoolSlug).toBeNull();
  });

  it("synchronise le badge natif de l'icône avec le total non-lu au chargement", async () => {
    badgesApi.getUnreadSummary.mockResolvedValueOnce(SUMMARY);

    await useBadgesStore.getState().loadSummary("college-vogt");

    expect(mockSetBadgeCountAsync).toHaveBeenCalledWith(1);
  });

  it("remet le badge natif de l'icône à zéro sur clear()", async () => {
    badgesApi.getUnreadSummary.mockResolvedValueOnce(SUMMARY);
    await useBadgesStore.getState().loadSummary("college-vogt");

    useBadgesStore.getState().clear();

    expect(mockSetBadgeCountAsync).toHaveBeenCalledWith(0);
  });
});
