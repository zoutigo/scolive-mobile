import { create } from "zustand";
import { timetableApi } from "../api/timetable.api";
import type {
  ClassTimetableContextResponse,
  ClassTimetableResponse,
  MyTimetableResponse,
  TimetableClassOptionsResponse,
  UpsertCalendarEventInput,
  UpsertOneOffSlotInput,
  UpsertRecurringSlotInput,
} from "../types/timetable.types";

type TimetableState = {
  myTimetable: MyTimetableResponse | null;
  classOptions: TimetableClassOptionsResponse | null;
  classContext: ClassTimetableContextResponse | null;
  classTimetable: ClassTimetableResponse | null;
  isLoadingMyTimetable: boolean;
  isLoadingClassOptions: boolean;
  isLoadingClassContext: boolean;
  isLoadingClassTimetable: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  loadMyTimetable: (
    schoolSlug: string,
    input?: {
      childId?: string;
      schoolYearId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) => Promise<MyTimetableResponse>;
  loadClassOptions: (
    schoolSlug: string,
    schoolYearId?: string,
  ) => Promise<TimetableClassOptionsResponse>;
  loadClassContext: (
    schoolSlug: string,
    classId: string,
    schoolYearId?: string,
  ) => Promise<ClassTimetableContextResponse>;
  loadClassTimetable: (
    schoolSlug: string,
    classId: string,
    input?: {
      schoolYearId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) => Promise<ClassTimetableResponse>;
  createRecurringSlot: (
    schoolSlug: string,
    classId: string,
    payload: UpsertRecurringSlotInput,
  ) => Promise<void>;
  updateRecurringSlot: (
    schoolSlug: string,
    slotId: string,
    payload: Partial<UpsertRecurringSlotInput>,
  ) => Promise<void>;
  deleteRecurringSlot: (schoolSlug: string, slotId: string) => Promise<void>;
  createOneOffSlot: (
    schoolSlug: string,
    classId: string,
    payload: UpsertOneOffSlotInput,
  ) => Promise<void>;
  updateOneOffSlot: (
    schoolSlug: string,
    oneOffSlotId: string,
    payload: Partial<UpsertOneOffSlotInput>,
  ) => Promise<void>;
  deleteOneOffSlot: (schoolSlug: string, oneOffSlotId: string) => Promise<void>;
  createCalendarEvent: (
    schoolSlug: string,
    payload: UpsertCalendarEventInput,
  ) => Promise<void>;
  updateCalendarEvent: (
    schoolSlug: string,
    eventId: string,
    payload: Partial<UpsertCalendarEventInput>,
  ) => Promise<void>;
  deleteCalendarEvent: (schoolSlug: string, eventId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
};

export const useTimetableStore = create<TimetableState>((set) => ({
  myTimetable: null,
  classOptions: null,
  classContext: null,
  classTimetable: null,
  isLoadingMyTimetable: false,
  isLoadingClassOptions: false,
  isLoadingClassContext: false,
  isLoadingClassTimetable: false,
  isSubmitting: false,
  errorMessage: null,

  async loadMyTimetable(schoolSlug, input) {
    set({ isLoadingMyTimetable: true, errorMessage: null });
    try {
      const payload = await timetableApi.getMyTimetable(schoolSlug, input);
      set({ myTimetable: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "Impossible de charger l'emploi du temps.",
      });
      throw error;
    } finally {
      set({ isLoadingMyTimetable: false });
    }
  },

  async loadClassOptions(schoolSlug, schoolYearId) {
    set({ isLoadingClassOptions: true, errorMessage: null });
    try {
      const payload = await timetableApi.getClassOptions(
        schoolSlug,
        schoolYearId,
      );
      set({ classOptions: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "Impossible de charger les classes.",
      });
      throw error;
    } finally {
      set({ isLoadingClassOptions: false });
    }
  },

  async loadClassContext(schoolSlug, classId, schoolYearId) {
    set({ isLoadingClassContext: true, errorMessage: null });
    try {
      const payload = await timetableApi.getClassContext(
        schoolSlug,
        classId,
        schoolYearId,
      );
      set({ classContext: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "Impossible de charger le contexte de classe.",
      });
      throw error;
    } finally {
      set({ isLoadingClassContext: false });
    }
  },

  async loadClassTimetable(schoolSlug, classId, input) {
    set({ isLoadingClassTimetable: true, errorMessage: null });
    try {
      const payload = await timetableApi.getClassTimetable(
        schoolSlug,
        classId,
        input,
      );
      set({ classTimetable: payload });
      return payload;
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "Impossible de charger l'agenda de classe.",
      });
      throw error;
    } finally {
      set({ isLoadingClassTimetable: false });
    }
  },

  async createRecurringSlot(schoolSlug, classId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.createRecurringSlot(schoolSlug, classId, payload);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Création impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async updateRecurringSlot(schoolSlug, slotId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.updateRecurringSlot(schoolSlug, slotId, payload);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Modification impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async deleteRecurringSlot(schoolSlug, slotId) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.deleteRecurringSlot(schoolSlug, slotId);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Suppression impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async createOneOffSlot(schoolSlug, classId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.createOneOffSlot(schoolSlug, classId, payload);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Création impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async updateOneOffSlot(schoolSlug, oneOffSlotId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.updateOneOffSlot(schoolSlug, oneOffSlotId, payload);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Modification impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async deleteOneOffSlot(schoolSlug, oneOffSlotId) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.deleteOneOffSlot(schoolSlug, oneOffSlotId);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Suppression impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async createCalendarEvent(schoolSlug, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.createCalendarEvent(schoolSlug, payload);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Création impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async updateCalendarEvent(schoolSlug, eventId, payload) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.updateCalendarEvent(schoolSlug, eventId, payload);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Modification impossible.",
      });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  async deleteCalendarEvent(schoolSlug, eventId) {
    set({ isSubmitting: true, errorMessage: null });
    try {
      await timetableApi.deleteCalendarEvent(schoolSlug, eventId);
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Suppression impossible.",
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
      myTimetable: null,
      classOptions: null,
      classContext: null,
      classTimetable: null,
      isLoadingMyTimetable: false,
      isLoadingClassOptions: false,
      isLoadingClassContext: false,
      isLoadingClassTimetable: false,
      isSubmitting: false,
      errorMessage: null,
    });
  },
}));
