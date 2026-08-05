export type PromotionDecision = "PROMOTED" | "REPEATED" | "LEFT";

export type TermReportForDecisionRow = {
  id: string;
  student: { id: string; firstName: string; lastName: string };
  decision: PromotionDecision | null;
  nextAcademicLevel: { id: string; label: string } | null;
  nextTrack: { id: string; label: string } | null;
};

export type SetTermReportDecisionPayload = {
  decision: PromotionDecision;
  nextAcademicLevelId?: string;
  nextTrackId?: string;
};

export type WaitingEnrollmentRow = {
  id: string;
  student: { id: string; firstName: string; lastName: string };
  academicLevel: { id: string; label: string } | null;
  track: { id: string; label: string } | null;
};
