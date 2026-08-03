import { apiFetch } from "./client";
import type {
  CreateHealthCareEventPayload,
  CreateHealthConditionPayload,
  CreateHealthReportPayload,
  StudentHealthCareEvent,
  StudentHealthCondition,
  StudentHealthReport,
  StudentHealthUrgencySummary,
} from "../types/health.types";

export const healthApi = {
  async listConditions(
    schoolSlug: string,
    studentId: string,
  ): Promise<StudentHealthCondition[]> {
    return apiFetch<StudentHealthCondition[]>(
      `/schools/${schoolSlug}/students/${studentId}/health/conditions`,
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
