import { create } from "zustand";
import { familyApi } from "../api/family.api";
import type { ParentChild } from "../types/family.types";

interface FamilyState {
  children: ParentChild[];
  isLoading: boolean;
  activeChildId: string | null;
  loadChildren: (schoolSlug: string) => Promise<void>;
  clearChildren: () => void;
  setActiveChild: (childId: string | null) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  children: [],
  isLoading: false,
  activeChildId: null,

  async loadChildren(schoolSlug: string) {
    set({ isLoading: true });
    try {
      const payload = await familyApi.getParentMe(schoolSlug);
      set({ children: payload.linkedStudents ?? [] });
    } catch {
      set({ children: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  clearChildren() {
    set({ children: [], activeChildId: null });
  },

  setActiveChild(childId: string | null) {
    set({ activeChildId: childId });
  },
}));
