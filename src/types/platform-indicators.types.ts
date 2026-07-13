export type ResourceApprovalIndicators = {
  withoutStatement: number;
  withoutCorrection: number;
  statementsToApprove: number;
  correctionsToApprove: number;
};

export type PlatformIndicators = {
  schoolsCount: number;
  usersCount: number;
  studentsCount: number;
  teachersCount: number;
  gradesCount: number;
  adminsCount: number;
  schoolAdminsCount: number;
  resources: {
    assessments: ResourceApprovalIndicators;
    exams: ResourceApprovalIndicators;
  };
};
