import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  HomeworkAttachment,
  HomeworkComment,
  HomeworkCommentPayload,
  HomeworkCompletionPayload,
  HomeworkDetail,
  HomeworkListQuery,
  HomeworkRow,
  UpsertHomeworkPayload,
} from "../types/homework.types";
import { sortHomeworkComments } from "../utils/homework";

function toQuery(params: Record<string, string | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    query.set(key, value);
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function authHeaders() {
  const token = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function postMultipart(path: string, formData: FormData) {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(await authHeaders()),
    },
    body: formData,
  });
}

async function parseMultipartError(
  response: Response,
  fallback: string,
): Promise<never> {
  const payload = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(payload?.message)
    ? payload.message.join(", ")
    : typeof payload?.message === "string"
      ? payload.message
      : fallback;
  throw new Error(message);
}

function normalizeAttachment(
  attachment: HomeworkAttachment & {
    url?: string | null;
    fileUrl?: string | null;
  },
): HomeworkAttachment {
  return {
    ...attachment,
    fileUrl: attachment.fileUrl ?? attachment.url ?? null,
  };
}

function normalizeRow(row: HomeworkRow): HomeworkRow {
  return {
    ...row,
    attachments: (row.attachments ?? []).map(normalizeAttachment),
  };
}

function normalizeComment(comment: HomeworkComment): HomeworkComment {
  return {
    ...comment,
    body: comment.body ?? "",
  };
}

function normalizeDetail(detail: HomeworkDetail): HomeworkDetail {
  return sortHomeworkComments({
    ...detail,
    attachments: (detail.attachments ?? []).map(normalizeAttachment),
    comments: (detail.comments ?? []).map(normalizeComment),
    completionStatuses: detail.completionStatuses ?? [],
  });
}

export const homeworkApi = {
  async listClassHomework(
    schoolSlug: string,
    classId: string,
    query: HomeworkListQuery = {},
  ): Promise<HomeworkRow[]> {
    const payload = await apiFetch<HomeworkRow[]>(
      `/schools/${schoolSlug}/classes/${classId}/homework${toQuery({
        fromDate: query.fromDate,
        toDate: query.toDate,
        studentId: query.studentId,
      })}`,
      {},
      true,
    );
    return payload.map(normalizeRow);
  },

  async getHomeworkDetail(
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    studentId?: string,
  ): Promise<HomeworkDetail> {
    const payload = await apiFetch<HomeworkDetail>(
      `/schools/${schoolSlug}/classes/${classId}/homework/${homeworkId}${toQuery(
        {
          studentId,
        },
      )}`,
      {},
      true,
    );
    return normalizeDetail(payload);
  },

  async createHomework(
    schoolSlug: string,
    classId: string,
    payload: UpsertHomeworkPayload,
  ): Promise<HomeworkRow> {
    const created = await apiFetch<HomeworkRow>(
      `/schools/${schoolSlug}/classes/${classId}/homework`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
    return normalizeRow(created);
  },

  async updateHomework(
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    payload: Partial<UpsertHomeworkPayload>,
  ): Promise<HomeworkRow> {
    const updated = await apiFetch<HomeworkRow>(
      `/schools/${schoolSlug}/classes/${classId}/homework/${homeworkId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
    return normalizeRow(updated);
  },

  deleteHomework(
    schoolSlug: string,
    classId: string,
    homeworkId: string,
  ): Promise<void> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/homework/${homeworkId}`,
      { method: "DELETE" },
      true,
    );
  },

  async addComment(
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    payload: HomeworkCommentPayload,
  ): Promise<HomeworkDetail> {
    const updated = await apiFetch<HomeworkDetail>(
      `/schools/${schoolSlug}/classes/${classId}/homework/${homeworkId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
    return normalizeDetail(updated);
  },

  async setCompletion(
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    payload: HomeworkCompletionPayload,
  ): Promise<HomeworkDetail> {
    const updated = await apiFetch<HomeworkDetail>(
      `/schools/${schoolSlug}/classes/${classId}/homework/${homeworkId}/completion`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
    return normalizeDetail(updated);
  },

  async uploadAttachment(
    schoolSlug: string,
    file: {
      uri: string;
      mimeType: string;
      fileName: string;
    },
  ): Promise<HomeworkAttachment> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/schools/${schoolSlug}/homework/uploads/attachment`,
      formData,
    );

    if (!response.ok) {
      await parseMultipartError(response, "HOMEWORK_ATTACHMENT_UPLOAD_FAILED");
    }

    const payload = (await response.json()) as HomeworkAttachment & {
      url?: string | null;
      fileUrl?: string | null;
    };
    return normalizeAttachment({
      ...payload,
      fileName: payload.fileName ?? file.fileName,
      mimeType: payload.mimeType ?? file.mimeType,
    });
  },

  async uploadInlineImage(
    schoolSlug: string,
    file: {
      uri: string;
      mimeType: string;
      fileName: string;
    },
  ): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/schools/${schoolSlug}/homework/uploads/inline-image`,
      formData,
    );

    if (!response.ok) {
      await parseMultipartError(
        response,
        "HOMEWORK_INLINE_IMAGE_UPLOAD_FAILED",
      );
    }

    return (await response.json()) as { url: string };
  },
};
