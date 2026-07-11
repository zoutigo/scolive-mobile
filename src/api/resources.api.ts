import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  ListAdminResourcesQuery,
  ListAdminSubmissionsResult,
  ResourceAttachment,
  ResourceCatalog,
  ResourceDetail,
  ResourceListQuery,
  ResourceListResult,
  ResourcePart,
  ResourceRow,
  ResourceSchoolOption,
  ResourceSubmission,
  SaveSubmissionDraftPayload,
  UpsertResourcePayload,
} from "../types/resources.types";

function toQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
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
    headers: { ...(await authHeaders()) },
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

export const resourcesApi = {
  listResources(query: ResourceListQuery): Promise<ResourceListResult> {
    return apiFetch(
      `/resources${toQuery({
        kind: query.kind,
        academicLevelId: query.academicLevelId,
        subjectId: query.subjectId,
        examType: query.examType,
        sequence: query.sequence,
        schoolId: query.schoolId,
        academicYearLabel: query.academicYearLabel,
        search: query.search,
        page: query.page,
        limit: query.limit,
      })}`,
      {},
      true,
    );
  },

  listFavorites(): Promise<ResourceRow[]> {
    return apiFetch(`/resources/favorites`, {}, true);
  },

  listMyResources(kind?: string): Promise<ResourceListResult> {
    return apiFetch(`/resources/mine${toQuery({ kind })}`, {}, true);
  },

  getCatalog(): Promise<ResourceCatalog> {
    return apiFetch(`/resources/catalog`, {}, true);
  },

  listSchoolsWithResources(): Promise<ResourceSchoolOption[]> {
    return apiFetch(`/resources/schools`, {}, true);
  },

  getResource(resourceId: string): Promise<ResourceDetail> {
    return apiFetch(`/resources/${resourceId}`, {}, true);
  },

  createResource(payload: UpsertResourcePayload): Promise<ResourceDetail> {
    return apiFetch(
      `/resources`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  updateResource(
    resourceId: string,
    payload: Partial<UpsertResourcePayload>,
  ): Promise<ResourceDetail> {
    return apiFetch(
      `/resources/${resourceId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  listSubmissions(
    resourceId: string,
    part: ResourcePart,
  ): Promise<ResourceSubmission[]> {
    return apiFetch(
      `/resources/${resourceId}/submissions${toQuery({ part })}`,
      {},
      true,
    );
  },

  saveSubmissionDraft(
    resourceId: string,
    part: ResourcePart,
    payload: SaveSubmissionDraftPayload,
  ): Promise<ResourceSubmission> {
    return apiFetch(
      `/resources/${resourceId}/${part}/submissions`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  submitSubmission(
    resourceId: string,
    submissionId: string,
  ): Promise<ResourceSubmission> {
    return apiFetch(
      `/resources/${resourceId}/submissions/${submissionId}/submit`,
      { method: "PATCH" },
      true,
    );
  },

  favoriteResource(resourceId: string): Promise<{ favorite: boolean }> {
    return apiFetch(
      `/resources/${resourceId}/favorite`,
      { method: "POST" },
      true,
    );
  },

  unfavoriteResource(resourceId: string): Promise<{ favorite: boolean }> {
    return apiFetch(
      `/resources/${resourceId}/favorite`,
      { method: "DELETE" },
      true,
    );
  },

  async uploadAttachment(file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }): Promise<ResourceAttachment> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/resources/uploads/attachment`,
      formData,
    );

    if (!response.ok) {
      await parseMultipartError(response, "RESOURCE_ATTACHMENT_UPLOAD_FAILED");
    }

    const payload = (await response.json()) as {
      url?: string | null;
      fileUrl?: string | null;
      fileName?: string | null;
      mimeType?: string | null;
      sizeLabel?: string | null;
    };
    // Reconstruct a clean object rather than spreading `payload`: the media
    // service response also carries size/width/height, and the create/update
    // endpoint rejects unknown attachment properties (forbidNonWhitelisted).
    return {
      fileName: payload.fileName ?? file.fileName,
      fileUrl: payload.fileUrl ?? payload.url ?? null,
      mimeType: payload.mimeType ?? file.mimeType,
      sizeLabel: payload.sizeLabel ?? null,
    };
  },

  async uploadInlineImage(file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/resources/uploads/inline-image`,
      formData,
    );

    if (!response.ok) {
      await parseMultipartError(
        response,
        "RESOURCE_INLINE_IMAGE_UPLOAD_FAILED",
      );
    }

    return (await response.json()) as { url: string };
  },
};

export const resourcesAdminApi = {
  listAdminSubmissions(
    query: ListAdminResourcesQuery,
  ): Promise<ListAdminSubmissionsResult> {
    return apiFetch(
      `/admin/resources/submissions${toQuery({
        kind: query.kind,
        part: query.part,
        status: query.status,
        page: query.page,
        limit: query.limit,
      })}`,
      {},
      true,
    );
  },

  updateSubmissionContent(
    submissionId: string,
    payload: SaveSubmissionDraftPayload,
  ): Promise<ResourceSubmission> {
    return apiFetch(
      `/admin/resources/submissions/${submissionId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  approveSubmission(submissionId: string): Promise<ResourceDetail> {
    return apiFetch(
      `/admin/resources/submissions/${submissionId}/approve`,
      { method: "PATCH" },
      true,
    );
  },

  rejectSubmission(
    submissionId: string,
    reason?: string,
  ): Promise<ResourceSubmission> {
    return apiFetch(
      `/admin/resources/submissions/${submissionId}/reject`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
      true,
    );
  },

  revokeSubmission(submissionId: string): Promise<ResourceDetail> {
    return apiFetch(
      `/admin/resources/submissions/${submissionId}/revoke`,
      { method: "PATCH" },
      true,
    );
  },
};
