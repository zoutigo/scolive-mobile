export type TestCampaignStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type TestCasePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TestExecutionStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "BLOCKED"
  | "SKIPPED";

export type TestCampaignSummary = {
  id: string;
  title: string;
  description: string | null;
  targetVersion: string | null;
  startsAt: string | null;
  dueAt: string | null;
  status: TestCampaignStatus;
  summary: {
    totalCases: number;
    completedCases: number;
    totalExecutions: number;
  };
};

export type TestCampaignDetail = {
  id: string;
  title: string;
  description: string | null;
  targetVersion: string | null;
  startsAt: string | null;
  dueAt: string | null;
  status: TestCampaignStatus;
  summary: {
    totalCases: number;
    completedCases: number;
  };
  testCases: Array<{
    id: string;
    title: string;
    module: string | null;
    expectedResult: string;
    priority: TestCasePriority;
    dueAt: string | null;
    evidenceRequired: boolean;
    totalExecutions: number;
    latestExecution: {
      id: string;
      status: TestExecutionStatus;
      executedAt: string;
    } | null;
  }>;
};

export type TestExecutionAttachment = {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type TestExecutionItem = {
  id: string;
  status: TestExecutionStatus;
  resultText: string | null;
  comment: string | null;
  deviceInfo: string | null;
  appVersion: string | null;
  executedAt: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
  };
  attachments: TestExecutionAttachment[];
};

export type TestExecutionRow = {
  id: string;
  status: TestExecutionStatus;
  resultText: string | null;
  comment: string | null;
  executedAt: string;
  adminReviewedAt: string | null;
  adminReviewNote: string | null;
  user: { id: string; fullName: string };
  adminReviewedBy: { id: string; fullName: string } | null;
  testCase: { id: string; title: string };
  campaign: { id: string; title: string };
};

export type TestExecutionDetail = TestExecutionRow & {
  deviceInfo: string | null;
  appVersion: string | null;
  createdAt: string;
  attachments: TestExecutionAttachment[];
};

export type TestCaseDetail = {
  id: string;
  title: string;
  module: string | null;
  objective: string | null;
  preconditions: string | null;
  steps: string[];
  expectedResult: string;
  orderIndex: number;
  priority: TestCasePriority;
  evidenceRequired: boolean;
  dueAt: string | null;
  campaign: {
    id: string;
    title: string;
    dueAt: string | null;
    targetVersion: string | null;
  };
  audienceRoles: string[];
  latestOwnExecution: TestExecutionItem | null;
  executionSummary: {
    totalExecutions: number;
    passed: number;
    failed: number;
    blocked: number;
  };
  completedByUsers: Array<{
    userId: string;
    fullName: string;
    status: TestExecutionStatus;
    executedAt: string;
  }>;
  executions: TestExecutionItem[];
};
