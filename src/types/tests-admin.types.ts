import type {
  TestCampaignStatus,
  TestCasePriority,
  TestExecutionDetail,
  TestExecutionRow,
} from "./tests.types";

export type AdminSchoolRef = { id: string; name: string; slug: string };

export type AdminCampaignRow = {
  id: string;
  reference: number;
  title: string;
  description: string | null;
  targetVersion: string | null;
  startsAt: string | null;
  dueAt: string | null;
  status: TestCampaignStatus;
  school: AdminSchoolRef | null;
  testCasesCount: number;
};

export type AdminCaseRow = {
  id: string;
  reference: number;
  title: string;
  module: string | null;
  objective?: string | null;
  preconditions?: string | null;
  expectedResult?: string;
  priority: TestCasePriority;
  dueAt: string | null;
  evidenceRequired: boolean;
  recycledAt: string | null;
  audienceRoles: string[];
  executionsCount: number;
};

export type AdminCampaignDetail = AdminCampaignRow & {
  testCases: AdminCaseRow[];
};

export type AdminAssignmentRow = {
  id: string;
  note: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  assignedBy: { id: string; firstName: string; lastName: string };
};

export type AdminTesterRow = {
  id: string;
  fullName: string;
  email: string | null;
  schools: AdminSchoolRef[];
  stats: {
    campaignsCount: number;
    executionsCount: number;
    passedCount: number;
    failedCount: number;
  };
};

export type AdminTestsSynthesis = {
  campaigns: { draft: number; active: number; archived: number; total: number };
  totalCases: number;
  executions: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    successRate: number;
    pendingReview: number;
  };
  testersCount: number;
};

export type AdminTestExecutionRow = TestExecutionRow;
export type AdminTestExecutionDetail = TestExecutionDetail;

export type CreateTestCampaignPayload = {
  title: string;
  description?: string;
  targetVersion?: string;
  startsAt?: string;
  dueAt?: string;
  status?: TestCampaignStatus;
};

export type UpdateTestCampaignPayload = {
  title?: string;
  description?: string | null;
  targetVersion?: string | null;
  startsAt?: string | null;
  dueAt?: string | null;
  status?: TestCampaignStatus;
};

export type CreateTestCasePayload = {
  title: string;
  module?: string;
  objective?: string;
  preconditions?: string;
  expectedResult: string;
  priority?: TestCasePriority;
  evidenceRequired?: boolean;
  dueAt?: string;
};

export type UpdateTestCasePayload = {
  title?: string;
  module?: string | null;
  objective?: string | null;
  preconditions?: string | null;
  expectedResult?: string;
  priority?: TestCasePriority;
  evidenceRequired?: boolean;
  dueAt?: string | null;
};
