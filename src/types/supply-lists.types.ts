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
