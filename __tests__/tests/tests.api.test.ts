import { testsApi } from "../../src/api/tests.api";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("test-token"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

let xhrScenario = {
  status: 204,
  responseText: "",
  networkError: false,
};
const mockXhrOpen = jest.fn();
const mockXhrSetRequestHeader = jest.fn();
const mockXhrSend = jest.fn(function send(this: {
  onload?: () => void;
  onerror?: () => void;
  status: number;
  response: string;
  responseText: string;
}) {
  if (xhrScenario.networkError) {
    this.onerror?.();
    return;
  }

  this.status = xhrScenario.status;
  this.response = xhrScenario.responseText;
  this.responseText = xhrScenario.responseText;
  this.onload?.();
});

global.XMLHttpRequest = jest.fn(() => ({
  open: mockXhrOpen,
  setRequestHeader: mockXhrSetRequestHeader,
  send: mockXhrSend,
  status: 0,
  response: "",
  responseText: "",
  onload: undefined,
  onerror: undefined,
})) as unknown as typeof XMLHttpRequest;

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001/api";
  xhrScenario = {
    status: 204,
    responseText: "",
    networkError: false,
  };
});

describe("testsApi.listCampaigns()", () => {
  it("calls the campaigns endpoint with auth", async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    await testsApi.listCampaigns();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/tests/campaigns"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("does not scope the request to any school (tests are global)", async () => {
    mockFetch.mockResolvedValueOnce(okJson([]));
    await testsApi.listCampaigns();

    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("/schools/");
  });
});

describe("testsApi.getTestCase()", () => {
  it("normalizes attachment URLs in the test execution history", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        id: "case-1",
        title: "Inbox",
        module: "Messagerie",
        objective: null,
        preconditions: null,
        steps: [],
        expectedResult: "Open inbox",
        orderIndex: 0,
        priority: "HIGH",
        evidenceRequired: false,
        dueAt: null,
        campaign: {
          id: "camp-1",
          title: "Campaign",
          dueAt: null,
          targetVersion: null,
        },
        audienceRoles: [],
        latestOwnExecution: {
          id: "exec-1",
          status: "FAILED",
          resultText: "Issue",
          comment: null,
          deviceInfo: null,
          appVersion: null,
          executedAt: "2026-06-17T10:00:00.000Z",
          createdAt: "2026-06-17T10:00:00.000Z",
          user: { id: "u1", fullName: "Valery MBELE" },
          attachments: [
            {
              id: "att-1",
              fileName: "capture.png",
              url: "http://localhost:9000/tests/capture.png",
              mimeType: "image/png",
              sizeBytes: 1234,
            },
          ],
        },
        executionSummary: {
          totalExecutions: 1,
          passed: 0,
          failed: 1,
          blocked: 0,
        },
        completedByUsers: [],
        executions: [],
      }),
    );

    const result = await testsApi.getTestCase("case-1");
    expect(result.latestOwnExecution?.attachments[0].url).toBe(
      "http://10.0.2.2:9000/tests/capture.png",
    );
  });
});

describe("testsApi.createExecution()", () => {
  it("sends the execution as multipart data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: "exec-1",
          status: "PASSED",
          resultText: "Ok",
          comment: null,
          deviceInfo: "android",
          appVersion: "1.0.0",
          executedAt: "2026-06-17T10:00:00.000Z",
          attachments: [],
        }),
    });

    await testsApi.createExecution("case-1", {
      status: "PASSED",
      resultText: "Ok",
      attachments: [
        {
          uri: "file:///capture.png",
          name: "capture.png",
          mimeType: "image/png",
        },
      ],
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/tests/cases/case-1/executions");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });
});
