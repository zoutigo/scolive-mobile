import { apiFetch } from "./client";
import type {
  AdminAssignmentRow,
  AdminCampaignDetail,
  AdminCampaignRow,
  AdminCaseDetail,
  AdminCaseRow,
  AdminTestExecutionDetail,
  AdminTestExecutionRow,
  AdminTesterRow,
  AdminTestsSynthesis,
  CreateTestCampaignPayload,
  CreateTestCasePayload,
  UpdateTestCampaignPayload,
  UpdateTestCasePayload,
} from "../types/tests-admin.types";
import type {
  TestCampaignStatus,
  TestExecutionStatus,
} from "../types/tests.types";

type ListCampaignsParams = {
  search?: string;
  status?: TestCampaignStatus | "";
  page?: number;
  limit?: number;
};

type ListTestersParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export type ListAdminExecutionsParams = {
  status?: TestExecutionStatus | "";
  campaignId?: string;
  testerId?: string;
  dateFrom?: string;
  dateTo?: string;
  reviewed?: boolean;
  page?: number;
  limit?: number;
};

export const testsAdminApi = {
  getSynthesis(): Promise<AdminTestsSynthesis> {
    return apiFetch(`/admin/tests/synthesis`, {}, true);
  },

  async listCampaigns(
    params: ListCampaignsParams = {},
  ): Promise<{ items: AdminCampaignRow[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiFetch(`/admin/tests/campaigns?${query.toString()}`, {}, true);
  },

  getCampaign(campaignId: string): Promise<AdminCampaignDetail> {
    return apiFetch(`/admin/tests/campaigns/${campaignId}`, {}, true);
  },

  createCampaign(
    payload: CreateTestCampaignPayload,
  ): Promise<AdminCampaignRow> {
    return apiFetch(
      `/admin/tests/campaigns`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  updateCampaign(
    campaignId: string,
    payload: UpdateTestCampaignPayload,
  ): Promise<AdminCampaignRow> {
    return apiFetch(
      `/admin/tests/campaigns/${campaignId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteCampaign(campaignId: string): Promise<void> {
    return apiFetch(
      `/admin/tests/campaigns/${campaignId}`,
      { method: "DELETE" },
      true,
    );
  },

  createCase(
    campaignId: string,
    payload: CreateTestCasePayload,
  ): Promise<AdminCaseRow> {
    return apiFetch(
      `/admin/tests/campaigns/${campaignId}/cases`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  getCase(testCaseId: string): Promise<AdminCaseDetail> {
    return apiFetch(`/admin/tests/cases/${testCaseId}`, {}, true);
  },

  recycleCase(testCaseId: string): Promise<void> {
    return apiFetch(
      `/admin/tests/cases/${testCaseId}/recycle`,
      { method: "POST" },
      true,
    );
  },

  updateCase(
    testCaseId: string,
    payload: UpdateTestCasePayload,
  ): Promise<AdminCaseRow> {
    return apiFetch(
      `/admin/tests/cases/${testCaseId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteCase(testCaseId: string): Promise<void> {
    return apiFetch(
      `/admin/tests/cases/${testCaseId}`,
      { method: "DELETE" },
      true,
    );
  },

  async listTesters(
    params: ListTestersParams = {},
  ): Promise<{ items: AdminTesterRow[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiFetch(`/admin/tests/testers?${query.toString()}`, {}, true);
  },

  listAssignments(campaignId: string): Promise<AdminAssignmentRow[]> {
    return apiFetch(
      `/admin/tests/campaigns/${campaignId}/assignments`,
      {},
      true,
    );
  },

  assignCampaign(
    campaignId: string,
    payload: { testerId: string; note?: string },
  ): Promise<AdminAssignmentRow> {
    return apiFetch(
      `/admin/tests/campaigns/${campaignId}/assignments`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  unassignCampaign(assignmentId: string): Promise<void> {
    return apiFetch(
      `/admin/tests/assignments/${assignmentId}`,
      { method: "DELETE" },
      true,
    );
  },

  async listExecutions(
    params: ListAdminExecutionsParams = {},
  ): Promise<{ items: AdminTestExecutionRow[] }> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.campaignId) query.set("campaignId", params.campaignId);
    if (params.testerId) query.set("testerId", params.testerId);
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo) query.set("dateTo", params.dateTo);
    if (params.reviewed !== undefined)
      query.set("reviewed", String(params.reviewed));
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiFetch(`/admin/tests/executions?${query.toString()}`, {}, true);
  },

  getExecution(executionId: string): Promise<AdminTestExecutionDetail> {
    return apiFetch(`/admin/tests/executions/${executionId}`, {}, true);
  },

  reviewExecution(
    executionId: string,
    payload: { reviewed: boolean; note?: string },
  ): Promise<AdminTestExecutionRow> {
    return apiFetch(
      `/admin/tests/executions/${executionId}/review`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },
};
