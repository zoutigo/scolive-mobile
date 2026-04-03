import { create } from "zustand";
import { familyApi } from "../api/family.api";
import type { ParentChild } from "../types/family.types";

interface FamilyState {
  children: ParentChild[];
  isLoading: boolean;
  loadChildren: (schoolSlug: string) => Promise<void>;
  clearChildren: () => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  children: [],
  isLoading: false,

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
    set({ children: [] });
  },
}));
