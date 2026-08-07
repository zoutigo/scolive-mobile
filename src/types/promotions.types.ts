export type PromotionDecision = "PROMOTED" | "REPEATED" | "LEFT";

export type TermReportForDecisionRow = {
  id: string;
  student: { id: string; firstName: string; lastName: string };
  decision: PromotionDecision | null;
  nextAcademicLevel: { id: string; label: string } | null;
  nextTrack: { id: string; label: string } | null;
  termAverages: {
    TERM_1: number | null;
    TERM_2: number | null;
    TERM_3: number | null;
  };
  yearlyAverage: number | null;
  rank: number | null;
  classSize: number | null;
  currentAcademicLevel: { id: string; order: number | null } | null;
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
