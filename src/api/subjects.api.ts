import { apiFetch } from "./client";
import type {
  SubjectBranch,
  SubjectBranchPayload,
  SubjectPayload,
  SubjectRow,
} from "../types/subjects.types";

export const subjectsApi = {
  listSubjects(schoolSlug: string): Promise<SubjectRow[]> {
    return apiFetch(`/schools/${schoolSlug}/admin/subjects`, {}, true);
  },

  createSubject(
    schoolSlug: string,
    payload: SubjectPayload,
  ): Promise<SubjectRow> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/subjects`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateSubject(
    schoolSlug: string,
    subjectId: string,
    payload: SubjectPayload,
  ): Promise<SubjectRow> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/subjects/${subjectId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteSubject(schoolSlug: string, subjectId: string) {
    return apiFetch(
      `/schools/${schoolSlug}/admin/subjects/${subjectId}`,
      { method: "DELETE" },
      true,
    );
  },

  createSubjectBranch(
    schoolSlug: string,
    subjectId: string,
    payload: SubjectBranchPayload,
  ): Promise<SubjectBranch> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/subjects/${subjectId}/branches`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateSubjectBranch(
    schoolSlug: string,
    branchId: string,
    payload: SubjectBranchPayload,
  ): Promise<SubjectBranch> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/subjects/branches/${branchId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteSubjectBranch(schoolSlug: string, branchId: string) {
    return apiFetch(
      `/schools/${schoolSlug}/admin/subjects/branches/${branchId}`,
      { method: "DELETE" },
      true,
    );
  },
};
