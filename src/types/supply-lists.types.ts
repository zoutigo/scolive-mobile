export type SupplyItemRow = {
  id: string;
  rank: number;
  label: string;
  quantity: number;
  note: string | null;
};

export type ChildSupplyList = {
  targetSchoolYearId: string | null;
  targetSchoolYearLabel?: string;
  items: SupplyItemRow[];
};

export type SupplyListRow = {
  id: string;
  academicLevel: { id: string; label: string; code: string };
  track: { id: string; label: string; code: string } | null;
  schoolYear: { id: string; label: string };
  items: SupplyItemRow[];
};

export type UpsertSupplyListItemPayload = {
  rank: number;
  label: string;
  quantity: number;
  note?: string;
};

export type UpsertSupplyListPayload = {
  schoolYearId: string;
  academicLevelId: string;
  trackId?: string;
  items: UpsertSupplyListItemPayload[];
};
