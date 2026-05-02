import { create } from "zustand";
import { notesApi } from "../api/notes.api";
import type {
  EvaluationDetail,
  EvaluationRow,
  NotesClassOptionsResponse,
  NotesTeacherContext,
  StudentNotesResponse,
  StudentNotesTerm,
  TermReport,
  UpsertEvaluationPayload,
  UpsertEvaluationScorePayload,
  UpsertTermReportsPayload,
} from "../types/notes.types";

type NotesState = {
  studentNotes: Record<string, StudentNotesResponse>;
  classOptions: NotesClassOptionsResponse | null;
  teacherContext: NotesTeacherContext | null;
  evaluations: EvaluationRow[];
  evaluationDetails: Record<string, EvaluationDetail>;
  termReports: Record<StudentNotesTerm, TermReport | null>;
  isLoadingStudentNotes: boolean;
  isLoadingClassOptions: boolean;
  isLoadingTeacherContext: boolean;
  isLoadingEvaluations: boolean;
  isLoadingEvaluationDetail: boolean;
  isLoadingTermReports: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  loadStudentNotes: (
    schoolSlug: string,
    studentId: string,
    term?: StudentNotesTerm,
  ) => Promise<StudentNotesResponse>;
  loadClassOptions: (
    schoolSlug: string,
    schoolYearId?: string,
  ) => Promise<NotesClassOptionsResponse>;
  loadTeacherContext: (
    schoolSlug: string,
    classId: string,
  ) => Promise<NotesTeacherContext>;
  loadEvaluations: (
    schoolSlug: string,
    classId: string,
  ) => Promise<EvaluationRow[]>;
  loadEvaluationDetail: (
    schoolSlug: string,
    classId: string,
    evaluationId: string,
  ) => Promise<EvaluationDetail>;
  createEvaluation: (
    schoolSlug: string,
    classId: string,
    payload: UpsertEvaluationPayload,
  ) => Promise<EvaluationRow>;
  updateEvaluation: (
    schoolSlug: string,
    classId: string,
    evaluationId: string,
    payload: Partial<UpsertEvaluationPayload>,
  ) => Promise<EvaluationRow>;
  saveScores: (
    schoolSlug: string,
    classId: string,
    evaluationId: string,
    payload: UpsertEvaluationScorePayload,
  ) => Promise<EvaluationDetail>;
  loadTermReports: (
    schoolSlug: string,
    classId: string,
    term?: StudentNotesTerm,
  ) => Promise<TermReport[]>;
  saveTermReports: (
    schoolSlug: string,
    classId: string,
    term: StudentNotesTerm,
    payload: UpsertTermReportsPayload,
  ) => Promise<TermReport[]>;
  deleteEvaluation: (
    schoolSlug: string,
    classId: string,
    evaluationId: string,
  ) => Promise<void>;
  clearError: () => void;
  reset: () => void;
};

function toMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toTermReportMap(reports: TermReport[]) {
  return reports.reduce<Record<StudentNotesTerm, TermReport | null>>(
    (acc, report) => {
      acc[report.term] = report;
      return acc;
    },
    {
      TERM_1: null,
      TERM_2: null,
      TERM_3: null,
    },
  );
}

export const useNotesStore = create<NotesState>((set) => ({
  studentNotes: {},
  classOptions: null,
  teacherContext: null,
  evaluations: [],
  evaluationDetails: {},
  termReports: {
    TERM_1: null,
    TERM_2: null,
    TERM_3: null,
  },
  isLoadingStudentNotes: false,
  isLoadingClassOptions: false,
  isLoadingTeacherContext: false,
  isLoadingEvaluations: false,
  isLoadingEvaluationDetail: false,
  isLoadingTermReports: false,
  isSubmitting: false,
  errorMessage: null,

  async loadStudentNotes(schoolSlug, studentId, term) {
    set({ isLoadingStudentNotes: true, errorMessage: null });
    try {
      const payload = await notesApi.listStudentNotes(
        schoolSlug,
        studentId,
        term,
      );
      set((state) => ({
        studentNotes: { ...state.studentNotes, [studentId]: payload },
      }));
      return payload;
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible de charger les notes."),
      });
      throw error;
    } finally {
      set({ isLoadingStudentNotes: false });
    }
  },

  async loadClassOptions(schoolSlug, schoolYearId) {
    set({ isLoadingClassOptions: true, errorMessage: null });
    try {
      const payload = await notesApi.getClassOptions(schoolSlug, schoolYearId);
      set({ classOptions: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger la liste des classes.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingClassOptions: false });
    }
  },

  async loadTeacherContext(schoolSlug, classId) {
    set({ isLoadingTeacherContext: true, errorMessage: null });
    try {
      const payload = await notesApi.getTeacherContext(schoolSlug, classId);
      set({ teacherContext: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger le contexte du cahier de notes.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingTeacherContext: false });
    }
  },

  async loadEvaluations(schoolSlug, classId) {
    set({ isLoadingEvaluations: true, errorMessage: null });
    try {
      const payload = await notesApi.listClassEvaluations(schoolSlug, classId);
      set({ evaluations: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger les évaluations de la classe.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingEvaluations: false });
    }
  },

  async loadEvaluationDetail(schoolSlug, classId, evaluationId) {
    set({ isLoadingEvaluationDetail: true, errorMessage: null });
    try {
      const payload = await notesApi.getEvaluation(
        schoolSlug,
        classId,
        evaluationId,
      );
      set((state) => ({
        evaluationDetails: {
          ...state.evaluationDetails,
          [evaluationId]: payload,
        },
      }));
      return payload;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger le détail de l'évaluation.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingEvaluationDetail: false });
    }
  },

  async createEvaluation(schoolSlug, classId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const created = await notesApi.createEvaluation(
        schoolSlug,
        classId,
        payload,
      );
      set((state) => ({
        evaluations: [created, ...state.evaluations],
      }));
      return created;
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible de créer l'évaluation."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async updateEvaluation(schoolSlug, classId, evaluationId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const updated = await notesApi.updateEvaluation(
        schoolSlug,
        classId,
        evaluationId,
        payload,
      );
      set((state) => ({
        evaluations: state.evaluations.map((entry) =>
          entry.id === evaluationId ? { ...entry, ...updated } : entry,
        ),
        evaluationDetails: state.evaluationDetails[evaluationId]
          ? {
              ...state.evaluationDetails,
              [evaluationId]: {
                ...state.evaluationDetails[evaluationId],
                ...updated,
              },
            }
          : state.evaluationDetails,
      }));
      return updated;
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible de modifier l'évaluation."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async saveScores(schoolSlug, classId, evaluationId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const detail = await notesApi.saveScores(
        schoolSlug,
        classId,
        evaluationId,
        payload,
      );
      set((state) => ({
        evaluationDetails: {
          ...state.evaluationDetails,
          [evaluationId]: detail,
        },
      }));
      return detail;
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible d'enregistrer les notes."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async loadTermReports(schoolSlug, classId, term) {
    set({ isLoadingTermReports: true, errorMessage: null });
    try {
      const reports = await notesApi.listTermReports(schoolSlug, classId, term);
      set((state) => ({
        termReports: {
          ...state.termReports,
          ...toTermReportMap(reports),
        },
      }));
      return reports;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger les appréciations de période.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingTermReports: false });
    }
  },

  async saveTermReports(schoolSlug, classId, term, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const reports = await notesApi.upsertTermReports(
        schoolSlug,
        classId,
        term,
        payload,
      );
      set((state) => ({
        termReports: {
          ...state.termReports,
          ...toTermReportMap(reports),
        },
      }));
      return reports;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible d'enregistrer les appréciations.",
        ),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async deleteEvaluation(schoolSlug, classId, evaluationId) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await notesApi.deleteEvaluation(schoolSlug, classId, evaluationId);
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [evaluationId]: _, ...restDetails } = state.evaluationDetails;
        return {
          evaluations: state.evaluations.filter((e) => e.id !== evaluationId),
          evaluationDetails: restDetails,
        };
      });
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible de supprimer l'évaluation."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearError() {
    set({ errorMessage: null });
  },

  reset() {
    set({
      studentNotes: {},
      classOptions: null,
      teacherContext: null,
      evaluations: [],
      evaluationDetails: {},
      termReports: {
        TERM_1: null,
        TERM_2: null,
        TERM_3: null,
      },
      isLoadingStudentNotes: false,
      isLoadingClassOptions: false,
      isLoadingTeacherContext: false,
      isLoadingEvaluations: false,
      isLoadingEvaluationDetail: false,
      isLoadingTermReports: false,
      isSubmitting: false,
      errorMessage: null,
    });
  },
}));
