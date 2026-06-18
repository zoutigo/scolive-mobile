import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  TestCampaignDetail,
  TestCampaignSummary,
  TestCaseDetail,
  TestExecutionAttachment,
  TestExecutionStatus,
} from "../types/tests.types";

function normalizeMediaUrl(url: string) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  const match = apiUrl.match(/^https?:\/\/([^:/]+)/);
  const apiHost = match?.[1] ?? "";
  if (apiHost && apiHost !== "localhost") {
    return url.replace(/\blocalhost\b/g, apiHost);
  }
  return url;
}

type AttachmentInput = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

type MultipartResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

function canRetryMultipart(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /network request failed/i.test(error.message || ""))
  );
}

function xhrMultipart(
  url: string,
  formData: FormData,
  token: string | null,
): Promise<MultipartResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "text";
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      const responseText =
        typeof xhr.response === "string"
          ? xhr.response
          : (xhr.responseText ?? "");

      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        async json() {
          return responseText ? JSON.parse(responseText) : {};
        },
        async text() {
          return responseText;
        },
      });
    };

    xhr.onerror = () => {
      reject(new TypeError("Network request failed"));
    };

    xhr.send(formData);
  });
}

async function postMultipart(path: string, formData: FormData) {
  const token = await tokenStorage.getAccessToken();
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    return {
      ok: response.ok,
      status: response.status,
      json: () => response.json(),
      text: () => response.text(),
    } satisfies MultipartResponse;
  } catch (error) {
    if (!canRetryMultipart(error)) {
      throw error;
    }

    return xhrMultipart(url, formData, token);
  }
}

async function throwMultipartError(
  response: MultipartResponse,
  fallback: string,
) {
  const responseText = await response.text().catch(() => "");
  let message = fallback;

  if (responseText) {
    try {
      const parsed = JSON.parse(responseText) as {
        message?: string | string[];
      };
      if (Array.isArray(parsed.message)) {
        message = parsed.message.join(", ");
      } else if (typeof parsed.message === "string" && parsed.message.trim()) {
        message = parsed.message.trim();
      }
    } catch {
      message = responseText;
    }
  }

  throw new Error(message);
}

function normalizeAttachments<
  T extends { attachments?: TestExecutionAttachment[] },
>(value: T) {
  return {
    ...value,
    attachments: (value.attachments ?? []).map((attachment) => ({
      ...attachment,
      url: normalizeMediaUrl(attachment.url),
    })),
  };
}

export const testsApi = {
  listCampaigns(schoolSlug: string): Promise<TestCampaignSummary[]> {
    return apiFetch(`/schools/${schoolSlug}/tests/campaigns`, {}, true);
  },

  getCampaign(
    schoolSlug: string,
    campaignId: string,
  ): Promise<TestCampaignDetail> {
    return apiFetch(
      `/schools/${schoolSlug}/tests/campaigns/${campaignId}`,
      {},
      true,
    );
  },

  async getTestCase(
    schoolSlug: string,
    testCaseId: string,
  ): Promise<TestCaseDetail> {
    const response = await apiFetch<TestCaseDetail>(
      `/schools/${schoolSlug}/tests/cases/${testCaseId}`,
      {},
      true,
    );

    return {
      ...response,
      latestOwnExecution: response.latestOwnExecution
        ? normalizeAttachments(response.latestOwnExecution)
        : null,
      executions: response.executions.map((execution) =>
        normalizeAttachments(execution),
      ),
    };
  },

  async createExecution(
    schoolSlug: string,
    testCaseId: string,
    payload: {
      status: TestExecutionStatus;
      resultText: string;
      comment?: string;
      deviceInfo?: string;
      appVersion?: string;
      attachments?: AttachmentInput[];
    },
  ) {
    const formData = new FormData();
    formData.append("status", payload.status);
    formData.append("resultText", payload.resultText);
    if (payload.comment !== undefined) {
      formData.append("comment", payload.comment);
    }
    if (payload.deviceInfo !== undefined) {
      formData.append("deviceInfo", payload.deviceInfo);
    }
    if (payload.appVersion !== undefined) {
      formData.append("appVersion", payload.appVersion);
    }
    for (const attachment of payload.attachments ?? []) {
      formData.append("attachments", {
        uri: attachment.uri,
        name: attachment.name,
        type: attachment.mimeType,
      } as unknown as Blob);
    }

    const response = await postMultipart(
      `/schools/${schoolSlug}/tests/cases/${testCaseId}/executions`,
      formData,
    );

    if (!response.ok) {
      await throwMultipartError(response, "TEST_EXECUTION_FAILED");
    }

    const data = (await response.json()) as {
      id: string;
      status: TestExecutionStatus;
      resultText: string | null;
      comment: string | null;
      deviceInfo: string | null;
      appVersion: string | null;
      executedAt: string;
      attachments: TestExecutionAttachment[];
    };

    return normalizeAttachments(data);
  },
};
