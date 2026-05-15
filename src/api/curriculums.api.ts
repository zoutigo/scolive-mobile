import { apiFetch } from "./client";
import type {
  CreateAcademicLevelPayload,
  CreateCurriculumPayload,
  CreateTrackPayload,
  CurriculumAcademicLevel,
  CurriculumRow,
  CurriculumSubjectCatalogItem,
  CurriculumSubjectRow,
  CurriculumTrack,
  UpdateAcademicLevelPayload,
  UpdateCurriculumPayload,
  UpdateTrackPayload,
  UpsertCurriculumSubjectPayload,
} from "../types/curriculums.types";

function buildAdminPath(schoolSlug: string, path: string) {
  return `/schools/${schoolSlug}/admin/${path}`;
}

export const curriculumsApi = {
  listAcademicLevels(schoolSlug: string): Promise<CurriculumAcademicLevel[]> {
    return apiFetch(buildAdminPath(schoolSlug, "academic-levels"), {}, true);
  },

  createAcademicLevel(
    schoolSlug: string,
    payload: CreateAcademicLevelPayload,
  ): Promise<CurriculumAcademicLevel> {
    return apiFetch(
      buildAdminPath(schoolSlug, "academic-levels"),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateAcademicLevel(
    schoolSlug: string,
    academicLevelId: string,
    payload: UpdateAcademicLevelPayload,
  ): Promise<CurriculumAcademicLevel> {
    return apiFetch(
      buildAdminPath(schoolSlug, `academic-levels/${academicLevelId}`),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteAcademicLevel(schoolSlug: string, academicLevelId: string) {
    return apiFetch(
      buildAdminPath(schoolSlug, `academic-levels/${academicLevelId}`),
      { method: "DELETE" },
      true,
    );
  },

  listTracks(schoolSlug: string): Promise<CurriculumTrack[]> {
    return apiFetch(buildAdminPath(schoolSlug, "tracks"), {}, true);
  },

  createTrack(
    schoolSlug: string,
    payload: CreateTrackPayload,
  ): Promise<CurriculumTrack> {
    return apiFetch(
      buildAdminPath(schoolSlug, "tracks"),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateTrack(
    schoolSlug: string,
    trackId: string,
    payload: UpdateTrackPayload,
  ): Promise<CurriculumTrack> {
    return apiFetch(
      buildAdminPath(schoolSlug, `tracks/${trackId}`),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteTrack(schoolSlug: string, trackId: string) {
    return apiFetch(
      buildAdminPath(schoolSlug, `tracks/${trackId}`),
      { method: "DELETE" },
      true,
    );
  },

  listCurriculums(schoolSlug: string): Promise<CurriculumRow[]> {
    return apiFetch(buildAdminPath(schoolSlug, "curriculums"), {}, true);
  },

  createCurriculum(
    schoolSlug: string,
    payload: CreateCurriculumPayload,
  ): Promise<CurriculumRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, "curriculums"),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateCurriculum(
    schoolSlug: string,
    curriculumId: string,
    payload: UpdateCurriculumPayload,
  ): Promise<CurriculumRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, `curriculums/${curriculumId}`),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteCurriculum(schoolSlug: string, curriculumId: string) {
    return apiFetch(
      buildAdminPath(schoolSlug, `curriculums/${curriculumId}`),
      { method: "DELETE" },
      true,
    );
  },

  listSubjects(schoolSlug: string): Promise<CurriculumSubjectCatalogItem[]> {
    return apiFetch(buildAdminPath(schoolSlug, "subjects"), {}, true);
  },

  listCurriculumSubjects(
    schoolSlug: string,
    curriculumId: string,
  ): Promise<CurriculumSubjectRow[]> {
    return apiFetch(
      buildAdminPath(schoolSlug, `curriculums/${curriculumId}/subjects`),
      {},
      true,
    );
  },

  upsertCurriculumSubject(
    schoolSlug: string,
    curriculumId: string,
    payload: UpsertCurriculumSubjectPayload,
  ): Promise<CurriculumSubjectRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, `curriculums/${curriculumId}/subjects`),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteCurriculumSubject(
    schoolSlug: string,
    curriculumId: string,
    subjectId: string,
  ) {
    return apiFetch(
      buildAdminPath(
        schoolSlug,
        `curriculums/${curriculumId}/subjects/${subjectId}`,
      ),
      { method: "DELETE" },
      true,
    );
  },
};
