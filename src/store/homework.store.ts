import { create } from "zustand";
import { homeworkApi } from "../api/homework.api";
import type {
  HomeworkCommentPayload,
  HomeworkCompletionPayload,
  HomeworkDetail,
  HomeworkListQuery,
  HomeworkRow,
  UpsertHomeworkPayload,
} from "../types/homework.types";
import { sortHomework, sortHomeworkComments } from "../utils/homework";

type HomeworkState = {
  items: HomeworkRow[];
  details: Record<string, HomeworkDetail>;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  loadHomework: (
    schoolSlug: string,
    classId: string,
    query?: HomeworkListQuery,
  ) => Promise<HomeworkRow[]>;
  loadHomeworkDetail: (
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    studentId?: string,
  ) => Promise<HomeworkDetail>;
  createHomework: (
    schoolSlug: string,
    classId: string,
    payload: UpsertHomeworkPayload,
  ) => Promise<HomeworkRow>;
  updateHomework: (
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    payload: Partial<UpsertHomeworkPayload>,
  ) => Promise<HomeworkRow>;
  deleteHomework: (
    schoolSlug: string,
    classId: string,
    homeworkId: string,
  ) => Promise<void>;
  addComment: (
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    payload: HomeworkCommentPayload,
  ) => Promise<HomeworkDetail>;
  setCompletion: (
    schoolSlug: string,
    classId: string,
    homeworkId: string,
    payload: HomeworkCompletionPayload,
  ) => Promise<HomeworkDetail>;
  clearError: () => void;
  reset: () => void;
};

function toMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function patchRowFromDetail(
  row: HomeworkRow,
  detail: HomeworkDetail,
): HomeworkRow {
  return {
    ...row,
    commentsCount: detail.comments.length,
    myDoneAt: detail.myDoneAt ?? row.myDoneAt ?? null,
    summary: detail.summary ?? row.summary ?? null,
    attachments: detail.attachments,
    contentHtml: detail.contentHtml,
    updatedAt: detail.updatedAt,
  };
}

export const useHomeworkStore = create<HomeworkState>((set) => ({
  items: [],
  details: {},
  isLoadingList: false,
  isLoadingDetail: false,
  isSubmitting: false,
  errorMessage: null,

  async loadHomework(schoolSlug, classId, query) {
    set({ isLoadingList: true, errorMessage: null });
    try {
      const items = await homeworkApi.listClassHomework(
        schoolSlug,
        classId,
        query,
      );
      set({ items: sortHomework(items) });
      return items;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger les homework de la classe.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingList: false });
    }
  },

  async loadHomeworkDetail(schoolSlug, classId, homeworkId, studentId) {
    set({ isLoadingDetail: true, errorMessage: null });
    try {
      const detail = await homeworkApi.getHomeworkDetail(
        schoolSlug,
        classId,
        homeworkId,
        studentId,
      );
      set((state) => ({
        details: {
          ...state.details,
          [homeworkId]: detail,
        },
        items: sortHomework(
          state.items.map((item) =>
            item.id === homeworkId ? patchRowFromDetail(item, detail) : item,
          ),
        ),
      }));
      return detail;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de charger le détail du homework.",
        ),
      });
      throw error;
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  async createHomework(schoolSlug, classId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const created = await homeworkApi.createHomework(
        schoolSlug,
        classId,
        payload,
      );
      set((state) => ({
        items: sortHomework([created, ...state.items]),
      }));
      return created;
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible de créer le homework."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async updateHomework(schoolSlug, classId, homeworkId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const updated = await homeworkApi.updateHomework(
        schoolSlug,
        classId,
        homeworkId,
        payload,
      );
      set((state) => ({
        items: sortHomework(
          state.items.map((item) => (item.id === homeworkId ? updated : item)),
        ),
        details: state.details[homeworkId]
          ? {
              ...state.details,
              [homeworkId]: sortHomeworkComments({
                ...state.details[homeworkId],
                ...updated,
              }),
            }
          : state.details,
      }));
      return updated;
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible de modifier le homework."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async deleteHomework(schoolSlug, classId, homeworkId) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await homeworkApi.deleteHomework(schoolSlug, classId, homeworkId);
      set((state) => {
        const nextDetails = { ...state.details };
        delete nextDetails[homeworkId];
        return {
          items: state.items.filter((item) => item.id !== homeworkId),
          details: nextDetails,
        };
      });
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible de supprimer le homework."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async addComment(schoolSlug, classId, homeworkId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const detail = await homeworkApi.addComment(
        schoolSlug,
        classId,
        homeworkId,
        payload,
      );
      set((state) => ({
        details: {
          ...state.details,
          [homeworkId]: detail,
        },
        items: sortHomework(
          state.items.map((item) =>
            item.id === homeworkId ? patchRowFromDetail(item, detail) : item,
          ),
        ),
      }));
      return detail;
    } catch (error) {
      set({
        errorMessage: toMessage(error, "Impossible d'ajouter le commentaire."),
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async setCompletion(schoolSlug, classId, homeworkId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const detail = await homeworkApi.setCompletion(
        schoolSlug,
        classId,
        homeworkId,
        payload,
      );
      set((state) => ({
        details: {
          ...state.details,
          [homeworkId]: detail,
        },
        items: sortHomework(
          state.items.map((item) =>
            item.id === homeworkId ? patchRowFromDetail(item, detail) : item,
          ),
        ),
      }));
      return detail;
    } catch (error) {
      set({
        errorMessage: toMessage(
          error,
          "Impossible de mettre à jour l'état du homework.",
        ),
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
      items: [],
      details: {},
      isLoadingList: false,
      isLoadingDetail: false,
      isSubmitting: false,
      errorMessage: null,
    });
  },
}));
