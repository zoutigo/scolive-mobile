import { apiFetch } from "./client";
import type {
  CreateHealthCareEventPayload,
  CreateHealthConditionPayload,
  CreateHealthReportPayload,
  HealthConditionsFilters,
  HealthHistoryFilters,
  HealthHistoryItem,
  PaginatedResult,
  SchoolHealthReportItem,
  SchoolHealthReportsFilters,
  SchoolHealthStats,
  SchoolHealthStudentSummary,
  SchoolHealthStudentsFilters,
  StudentHealthCareEvent,
  StudentHealthCondition,
  StudentHealthReport,
  StudentHealthUrgencySummary,
  UpdateHealthCareEventPayload,
  UpdateHealthConditionPayload,
} from "../types/health.types";

export const HEALTH_PAGE_LIMIT = 20;

export interface ListConditionsParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: HealthConditionsFilters;
}

export interface GetHistoryParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: HealthHistoryFilters;
}

export interface ListSchoolStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: SchoolHealthStudentsFilters;
}

export interface ListSchoolReportsParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: SchoolHealthReportsFilters;
}

export interface GetSchoolStatsParams {
  classId?: string;
}

function buildConditionsQuery(params: ListConditionsParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.filters?.type) q.set("type", params.filters.type);
  if (params.filters?.alertLevel)
    q.set("alertLevel", params.filters.alertLevel);
  if (params.filters?.active != null) {
    q.set("active", String(params.filters.active));
  }
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? HEALTH_PAGE_LIMIT));
  return `?${q.toString()}`;
}

function buildHistoryQuery(params: GetHistoryParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.filters?.alertLevel)
    q.set("alertLevel", params.filters.alertLevel);
  if (params.filters?.origin) q.set("origin", params.filters.origin);
  if (params.filters?.reportType)
    q.set("reportType", params.filters.reportType);
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? HEALTH_PAGE_LIMIT));
  return `?${q.toString()}`;
}

function buildSchoolStudentsQuery(params: ListSchoolStudentsParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.filters?.classId) q.set("classId", params.filters.classId);
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? HEALTH_PAGE_LIMIT));
  return `?${q.toString()}`;
}

function buildSchoolReportsQuery(params: ListSchoolReportsParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.filters?.alertLevel)
    q.set("alertLevel", params.filters.alertLevel);
  if (params.filters?.reportType)
    q.set("reportType", params.filters.reportType);
  if (params.filters?.acknowledged != null) {
    q.set("acknowledged", String(params.filters.acknowledged));
  }
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? HEALTH_PAGE_LIMIT));
  return `?${q.toString()}`;
}

export const healthApi = {
  async listSchoolStudents(
    schoolSlug: string,
    params: ListSchoolStudentsParams = {},
  ): Promise<PaginatedResult<SchoolHealthStudentSummary>> {
    const query = buildSchoolStudentsQuery(params);
    return apiFetch<PaginatedResult<SchoolHealthStudentSummary>>(
      `/schools/${schoolSlug}/health/students${query}`,
      {},
      true,
    );
  },

  async listSchoolReports(
    schoolSlug: string,
    params: ListSchoolReportsParams = {},
  ): Promise<PaginatedResult<SchoolHealthReportItem>> {
    const query = buildSchoolReportsQuery(params);
    return apiFetch<PaginatedResult<SchoolHealthReportItem>>(
      `/schools/${schoolSlug}/health/reports${query}`,
      {},
      true,
    );
  },

  async getSchoolStats(
    schoolSlug: string,
    params: GetSchoolStatsParams = {},
  ): Promise<SchoolHealthStats> {
    const q = new URLSearchParams();
    if (params.classId) q.set("classId", params.classId);
    const query = q.toString() ? `?${q.toString()}` : "";
    return apiFetch<SchoolHealthStats>(
      `/schools/${schoolSlug}/health/stats${query}`,
      {},
      true,
    );
  },

  async updateCareEvent(
    schoolSlug: string,
    studentId: string,
    careEventId: string,
    payload: UpdateHealthCareEventPayload,
  ): Promise<StudentHealthCareEvent> {
    return apiFetch<StudentHealthCareEvent>(
      `/schools/${schoolSlug}/students/${studentId}/health/care-events/${careEventId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async listConditions(
    schoolSlug: string,
    studentId: string,
    params: ListConditionsParams = {},
  ): Promise<PaginatedResult<StudentHealthCondition>> {
    const query = buildConditionsQuery(params);
    return apiFetch<PaginatedResult<StudentHealthCondition>>(
      `/schools/${schoolSlug}/students/${studentId}/health/conditions${query}`,
      {},
      true,
    );
  },

  async createCondition(
    schoolSlug: string,
    studentId: string,
    payload: CreateHealthConditionPayload,
  ): Promise<StudentHealthCondition> {
    return apiFetch<StudentHealthCondition>(
      `/schools/${schoolSlug}/students/${studentId}/health/conditions`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateCondition(
    schoolSlug: string,
    studentId: string,
    conditionId: string,
    payload: UpdateHealthConditionPayload,
  ): Promise<StudentHealthCondition> {
    return apiFetch<StudentHealthCondition>(
      `/schools/${schoolSlug}/students/${studentId}/health/conditions/${conditionId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async getHistory(
    schoolSlug: string,
    studentId: string,
    params: GetHistoryParams = {},
  ): Promise<PaginatedResult<HealthHistoryItem>> {
    const query = buildHistoryQuery(params);
    return apiFetch<PaginatedResult<HealthHistoryItem>>(
      `/schools/${schoolSlug}/students/${studentId}/health/history${query}`,
      {},
      true,
    );
  },

  async listCareEvents(
    schoolSlug: string,
    studentId: string,
  ): Promise<StudentHealthCareEvent[]> {
    return apiFetch<StudentHealthCareEvent[]>(
      `/schools/${schoolSlug}/students/${studentId}/health/care-events`,
      {},
      true,
    );
  },

  async createCareEvent(
    schoolSlug: string,
    studentId: string,
    payload: CreateHealthCareEventPayload,
  ): Promise<StudentHealthCareEvent> {
    return apiFetch<StudentHealthCareEvent>(
      `/schools/${schoolSlug}/students/${studentId}/health/care-events`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async listReports(
    schoolSlug: string,
    studentId: string,
  ): Promise<StudentHealthReport[]> {
    return apiFetch<StudentHealthReport[]>(
      `/schools/${schoolSlug}/students/${studentId}/health/reports`,
      {},
      true,
    );
  },

  async createReport(
    schoolSlug: string,
    studentId: string,
    payload: CreateHealthReportPayload,
  ): Promise<StudentHealthReport> {
    return apiFetch<StudentHealthReport>(
      `/schools/${schoolSlug}/students/${studentId}/health/reports`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async acknowledgeReport(
    schoolSlug: string,
    studentId: string,
    reportId: string,
  ): Promise<StudentHealthReport> {
    return apiFetch<StudentHealthReport>(
      `/schools/${schoolSlug}/students/${studentId}/health/reports/${reportId}/acknowledge`,
      { method: "POST" },
      true,
    );
  },

  async getUrgencySummary(
    schoolSlug: string,
    studentId: string,
  ): Promise<StudentHealthUrgencySummary> {
    return apiFetch<StudentHealthUrgencySummary>(
      `/schools/${schoolSlug}/students/${studentId}/health/urgence`,
      {},
      true,
    );
  },
};
