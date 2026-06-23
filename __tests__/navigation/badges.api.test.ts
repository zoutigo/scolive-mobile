import { badgesApi } from "../../src/api/badges.api";

jest.mock("../../src/api/client", () => {
  const actual = jest.requireActual("../../src/api/client");
  return {
    ...actual,
    apiFetch: jest.fn(),
  };
});

const { apiFetch } = jest.requireMock("../../src/api/client") as {
  apiFetch: jest.Mock;
};

describe("badgesApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches the aggregated unread summary for the school", async () => {
    const summary = {
      messagesUnread: 1,
      feedUnread: 2,
      ticketsNeedingResponse: 0,
      ticketsUnreadReplies: 0,
      children: [],
      teacherClasses: [],
      total: 3,
    };
    apiFetch.mockResolvedValueOnce(summary);

    const result = await badgesApi.getUnreadSummary("college-vogt");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/me/unread-summary",
      {},
      true,
    );
    expect(result).toEqual(summary);
  });

  it("sends scope and scopeRefId when marking a badge as read", async () => {
    apiFetch.mockResolvedValueOnce({ ok: true });

    await badgesApi.markRead("college-vogt", "DISCIPLINE", "child-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/me/read-markers",
      {
        method: "PATCH",
        body: JSON.stringify({ scope: "DISCIPLINE", scopeRefId: "child-1" }),
      },
      true,
    );
  });

  it("omits scopeRefId for FEED, letting the server resolve the school id", async () => {
    apiFetch.mockResolvedValueOnce({ ok: true });

    await badgesApi.markRead("college-vogt", "FEED");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/me/read-markers",
      {
        method: "PATCH",
        body: JSON.stringify({ scope: "FEED" }),
      },
      true,
    );
  });
});
