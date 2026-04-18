import { create } from "zustand";
import { familyApi } from "../api/family.api";
import type { ParentChild } from "../types/family.types";

interface FamilyState {
  children: ParentChild[];
  isLoading: boolean;
  activeChildId: string | null;
  loadChildren: (schoolSlug: string) => Promise<void>;
  clearChildren: () => void;
  setActiveChild: (
    childId: string | null,
    patch?: Partial<ParentChild>,
  ) => void;
  updateChild: (childId: string, patch: Partial<ParentChild>) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  children: [],
  isLoading: false,
  activeChildId: null,

  async loadChildren(schoolSlug: string) {
    set({ isLoading: true });
    try {
      const payload = await familyApi.getParentMe(schoolSlug);
      set({
        children: (payload.linkedStudents ?? []).map((child) => ({
          ...child,
          classId: child.classId ?? child.currentEnrollment?.class?.id ?? null,
          className:
            child.className ?? child.currentEnrollment?.class?.name ?? null,
        })),
      });
    } catch {
      set({ children: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  clearChildren() {
    set({ children: [], activeChildId: null });
  },

  setActiveChild(childId: string | null, patch?: Partial<ParentChild>) {
    set((state) => {
      if (!childId) {
        return { activeChildId: null };
      }

      const existingIndex = state.children.findIndex(
        (child) => child.id === childId,
      );

      if (existingIndex === -1) {
        return { activeChildId: childId };
      }

      if (!patch) {
        return { activeChildId: childId };
      }

      const nextChildren = [...state.children];
      nextChildren[existingIndex] = {
        ...nextChildren[existingIndex],
        ...patch,
      };

      return { activeChildId: childId, children: nextChildren };
    });
  },

  updateChild(childId: string, patch: Partial<ParentChild>) {
    set((state) => {
      let changed = false;
      const nextChildren = state.children.map((child) => {
        if (child.id !== childId) {
          return child;
        }

        const nextChild = { ...child, ...patch };
        const same = Object.entries(patch).every(
          ([key, value]) =>
            nextChild[key as keyof ParentChild] ===
              child[key as keyof ParentChild] &&
            value === child[key as keyof ParentChild],
        );

        if (same) {
          return child;
        }

        changed = true;
        return nextChild;
      });

      return changed ? { children: nextChildren } : state;
    });
  },
}));
