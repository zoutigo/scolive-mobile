import { apiFetch } from "./client";
import type {
  CreateNationalAcademicLevelPayload,
  CreateNationalCurriculumPayload,
  CreateNationalSubjectPayload,
  NationalAcademicLevelRow,
  NationalCurriculumRow,
  NationalCurriculumSubjectRow,
  NationalSubjectRow,
  UpdateNationalAcademicLevelPayload,
  UpdateNationalCurriculumPayload,
  UpdateNationalSubjectPayload,
  UpsertNationalCurriculumSubjectPayload,
} from "../types/platform-catalog.types";

export const platformCatalogApi = {
  listNationalSubjects(): Promise<NationalSubjectRow[]> {
    return apiFetch("/system/subjects", {}, true);
  },

  createNationalSubject(
    payload: CreateNationalSubjectPayload,
  ): Promise<NationalSubjectRow> {
    return apiFetch(
      "/system/subjects",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  updateNationalSubject(
    subjectId: string,
    payload: UpdateNationalSubjectPayload,
  ): Promise<NationalSubjectRow> {
    return apiFetch(
      `/system/subjects/${subjectId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteNationalSubject(subjectId: string) {
    return apiFetch(
      `/system/subjects/${subjectId}`,
      { method: "DELETE" },
      true,
    );
  },

  listNationalAcademicLevels(): Promise<NationalAcademicLevelRow[]> {
    return apiFetch("/system/academic-levels", {}, true);
  },

  createNationalAcademicLevel(
    payload: CreateNationalAcademicLevelPayload,
  ): Promise<NationalAcademicLevelRow> {
    return apiFetch(
      "/system/academic-levels",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  updateNationalAcademicLevel(
    academicLevelId: string,
    payload: UpdateNationalAcademicLevelPayload,
  ): Promise<NationalAcademicLevelRow> {
    return apiFetch(
      `/system/academic-levels/${academicLevelId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteNationalAcademicLevel(academicLevelId: string) {
    return apiFetch(
      `/system/academic-levels/${academicLevelId}`,
      { method: "DELETE" },
      true,
    );
  },

  listNationalCurriculums(): Promise<NationalCurriculumRow[]> {
    return apiFetch("/system/curriculums", {}, true);
  },

  createNationalCurriculum(
    payload: CreateNationalCurriculumPayload,
  ): Promise<NationalCurriculumRow> {
    return apiFetch(
      "/system/curriculums",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  updateNationalCurriculum(
    curriculumId: string,
    payload: UpdateNationalCurriculumPayload,
  ): Promise<NationalCurriculumRow> {
    return apiFetch(
      `/system/curriculums/${curriculumId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteNationalCurriculum(curriculumId: string) {
    return apiFetch(
      `/system/curriculums/${curriculumId}`,
      { method: "DELETE" },
      true,
    );
  },

  listNationalCurriculumSubjects(
    curriculumId: string,
  ): Promise<NationalCurriculumSubjectRow[]> {
    return apiFetch(`/system/curriculums/${curriculumId}/subjects`, {}, true);
  },

  upsertNationalCurriculumSubject(
    curriculumId: string,
    payload: UpsertNationalCurriculumSubjectPayload,
  ): Promise<NationalCurriculumSubjectRow> {
    return apiFetch(
      `/system/curriculums/${curriculumId}/subjects`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteNationalCurriculumSubject(curriculumId: string, subjectId: string) {
    return apiFetch(
      `/system/curriculums/${curriculumId}/subjects/${subjectId}`,
      { method: "DELETE" },
      true,
    );
  },
};
