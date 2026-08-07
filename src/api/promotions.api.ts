import { apiFetch } from "./client";
import type {
  SetTermReportDecisionPayload,
  TermReportForDecisionRow,
  WaitingEnrollmentRow,
} from "../types/promotions.types";

function buildAdminPath(schoolSlug: string, path: string) {
  return `/schools/${schoolSlug}/admin/${path}`;
}

export const promotionsApi = {
  listTermReportsForDecision(
    schoolSlug: string,
    classId: string,
  ): Promise<TermReportForDecisionRow[]> {
    return apiFetch(
      buildAdminPath(schoolSlug, `promotions/classes/${classId}/term-reports`),
      {},
      true,
    );
  },

  setTermReportDecision(
    schoolSlug: string,
    reportId: string,
    payload: SetTermReportDecisionPayload,
  ): Promise<TermReportForDecisionRow> {
    return apiFetch(
      buildAdminPath(
        schoolSlug,
        `promotions/term-reports/${reportId}/decision`,
      ),
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  listWaitingEnrollments(
    schoolSlug: string,
    params: { schoolYearId: string; academicLevelId?: string },
  ): Promise<WaitingEnrollmentRow[]> {
    const q = new URLSearchParams({ schoolYearId: params.schoolYearId });
    if (params.academicLevelId)
      q.set("academicLevelId", params.academicLevelId);
    return apiFetch(
      buildAdminPath(
        schoolSlug,
        `promotions/waiting-enrollments?${q.toString()}`,
      ),
      {},
      true,
    );
  },

  assignEnrollmentToClass(
    schoolSlug: string,
    enrollmentId: string,
    classId: string,
  ): Promise<{ id: string }> {
    return apiFetch(
      buildAdminPath(
        schoolSlug,
        `promotions/enrollments/${enrollmentId}/assign-class`,
      ),
      { method: "PATCH", body: JSON.stringify({ classId }) },
      true,
    );
  },
};
