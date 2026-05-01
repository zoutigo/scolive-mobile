import { create } from "zustand";
import type { DisciplineFormInput } from "../types/discipline.types";

export type TeacherClassDisciplineDraft = DisciplineFormInput & {
  studentId: string;
};

type TeacherClassDisciplineDraftState = {
  draftsByClassId: Record<string, TeacherClassDisciplineDraft>;
  getDraft: (classId: string) => TeacherClassDisciplineDraft | null;
  saveDraft: (classId: string, draft: TeacherClassDisciplineDraft) => void;
  clearDraft: (classId: string) => void;
  reset: () => void;
};

function createDefaultDraft(): TeacherClassDisciplineDraft {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    studentId: "",
    type: "ABSENCE",
    occurredAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
    reason: "",
    durationMinutes: "",
    justified: false,
    comment: "",
  };
}

export const useTeacherClassDisciplineDraftStore =
  create<TeacherClassDisciplineDraftState>((set, get) => ({
    draftsByClassId: {},

    getDraft(classId) {
      return get().draftsByClassId[classId] ?? null;
    },

    saveDraft(classId, draft) {
      set((state) => ({
        draftsByClassId: {
          ...state.draftsByClassId,
          [classId]: draft,
        },
      }));
    },

    clearDraft(classId) {
      set((state) => {
        const next = { ...state.draftsByClassId };
        delete next[classId];
        return { draftsByClassId: next };
      });
    },

    reset() {
      set({ draftsByClassId: {} });
    },
  }));

export function getDefaultTeacherClassDisciplineDraft() {
  return createDefaultDraft();
}
