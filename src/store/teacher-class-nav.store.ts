import { create } from "zustand";
import { teacherClassNavApi } from "../api/teacher-class-nav.api";
import type { TimetableClassOptionsResponse } from "../types/timetable.types";

type TeacherClassNavState = {
  classOptions: TimetableClassOptionsResponse | null;
  isLoadingClassOptions: boolean;
  errorMessage: string | null;
  loadClassOptions: (
    schoolSlug: string,
    schoolYearId?: string,
  ) => Promise<TimetableClassOptionsResponse>;
  clearError: () => void;
  reset: () => void;
};

function toMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const useTeacherClassNavStore = create<TeacherClassNavState>((set) => ({
  classOptions: null,
  isLoadingClassOptions: false,
  errorMessage: null,

  async loadClassOptions(schoolSlug, schoolYearId) {
    set({ isLoadingClassOptions: true, errorMessage: null });
    try {
      const payload = await teacherClassNavApi.getClassOptions(
        schoolSlug,
        schoolYearId,
      );
      set({ classOptions: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger les classes enseignant.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingClassOptions: false });
    }
  },

  clearError() {
    set({ errorMessage: null });
  },

  reset() {
    set({
      classOptions: null,
      isLoadingClassOptions: false,
      errorMessage: null,
    });
  },
}));
