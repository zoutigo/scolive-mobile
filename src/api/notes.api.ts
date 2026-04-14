import { apiFetch, BASE_URL, tokenStorage } from "./client";
import { buildTimetableClassOptions } from "../utils/timetable";
import type {
  EvaluationAttachmentDraft,
  EvaluationDetail,
  EvaluationRow,
  NotesClassOptionsContext,
  NotesClassOptionsResponse,
  NotesTeacherContext,
  StudentNotesResponse,
  StudentNotesTerm,
  TermReport,
  UpsertEvaluationPayload,
  UpsertEvaluationScorePayload,
  UpsertTermReportsPayload,
} from "../types/notes.types";

function toQuery(params: Record<string, string | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, value);
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export class NotesMultipartError extends Error {
  statusCode?: number;
  responseBody?: string;
  constructor(
    message: string,
    options?: { statusCode?: number; responseBody?: string },
  ) {
    super(message);
    this.name = "NotesMultipartError";
    this.statusCode = options?.statusCode;
    this.responseBody = options?.responseBody;
  }
}

type MultipartResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

async function postMultipart(
  path: string,
  formData: FormData,
): Promise<MultipartResponse> {
  const token = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json(),
    text: () => response.text(),
  };
}

async function throwMultipartError(
  response: MultipartResponse,
  fallbackMessage: string,
): Promise<never> {
  const responseText = await response.text().catch(() => "");
  let message = fallbackMessage;

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

  throw new NotesMultipartError(message, {
    statusCode: response.status,
    responseBody: responseText,
  });
}

export const notesApi = {
  listStudentNotes(
    schoolSlug: string,
    studentId: string,
    term?: StudentNotesTerm,
  ): Promise<StudentNotesResponse> {
    return apiFetch(
      `/schools/${schoolSlug}/students/${studentId}/notes${toQuery({ term })}`,
      {},
      true,
    );
  },

  async getClassOptions(
    schoolSlug: string,
    schoolYearId?: string,
  ): Promise<NotesClassOptionsResponse> {
    const payload = await apiFetch<NotesClassOptionsContext>(
      `/schools/${schoolSlug}/student-grades/context${toQuery({ schoolYearId })}`,
      {},
      true,
    );

    return {
      schoolYears: payload.schoolYears,
      selectedSchoolYearId: payload.selectedSchoolYearId,
      classes: buildTimetableClassOptions(payload),
    };
  },

  getTeacherContext(
    schoolSlug: string,
    classId: string,
  ): Promise<NotesTeacherContext> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/evaluations/context`,
      {},
      true,
    );
  },

  listClassEvaluations(
    schoolSlug: string,
    classId: string,
  ): Promise<EvaluationRow[]> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/evaluations`,
      {},
      true,
    );
  },

  createEvaluation(
    schoolSlug: string,
    classId: string,
    payload: UpsertEvaluationPayload,
  ): Promise<EvaluationRow> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/evaluations`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  getEvaluation(
    schoolSlug: string,
    classId: string,
    evaluationId: string,
  ): Promise<EvaluationDetail> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/evaluations/${evaluationId}`,
      {},
      true,
    );
  },

  updateEvaluation(
    schoolSlug: string,
    classId: string,
    evaluationId: string,
    payload: Partial<UpsertEvaluationPayload>,
  ): Promise<EvaluationRow> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/evaluations/${evaluationId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  saveScores(
    schoolSlug: string,
    classId: string,
    evaluationId: string,
    payload: UpsertEvaluationScorePayload,
  ): Promise<EvaluationDetail> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/evaluations/${evaluationId}/scores`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  listTermReports(
    schoolSlug: string,
    classId: string,
    term?: StudentNotesTerm,
  ): Promise<TermReport[]> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/term-reports${toQuery({ term })}`,
      {},
      true,
    );
  },

  upsertTermReports(
    schoolSlug: string,
    classId: string,
    term: StudentNotesTerm,
    payload: UpsertTermReportsPayload,
  ): Promise<TermReport[]> {
    return apiFetch(
      `/schools/${schoolSlug}/classes/${classId}/term-reports/${term}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  async uploadAttachment(
    schoolSlug: string,
    file: {
      uri: string;
      mimeType: string;
      fileName: string;
    },
  ): Promise<EvaluationAttachmentDraft> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/schools/${schoolSlug}/evaluations/uploads/attachment`,
      formData,
    );

    if (!response.ok) {
      await throwMultipartError(response, "UPLOAD_ATTACHMENT_FAILED");
    }

    const payload = (await response.json()) as {
      url?: string;
      fileUrl?: string;
      mimeType?: string;
      sizeLabel?: string;
      fileName?: string;
    };

    return {
      fileName: payload.fileName ?? file.fileName,
      fileUrl: payload.fileUrl ?? payload.url ?? null,
      mimeType: payload.mimeType ?? file.mimeType,
      sizeLabel: payload.sizeLabel ?? null,
    };
  },
};
