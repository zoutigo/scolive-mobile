import { create } from "zustand";
import { disciplineApi } from "../api/discipline.api";
import {
  computeDisciplineSummary,
  type DisciplineSummary,
  type ListLifeEventsParams,
  type StudentLifeEvent,
  type StudentLifeEventType,
} from "../types/discipline.types";

// ── État ──────────────────────────────────────────────────────────────────────

interface DisciplineState {
  /** Événements chargés, indexés par studentId pour éviter les rechargements inutiles. */
  eventsMap: Record<string, StudentLifeEvent[]>;
  /** Étudiant actif (pour lequel l'écran est affiché). */
  activeStudentId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  /** Filtre optionnel par type d'événement. */
  typeFilter: StudentLifeEventType | null;

  // ── Getters ─────────────────────────────────────────────────────────────────

  /** Retourne les événements du studentId actif ou du studentId fourni. */
  getEvents: (studentId?: string) => StudentLifeEvent[];
  /** Retourne la synthèse calculée pour le studentId actif ou fourni. */
  getSummary: (studentId?: string) => DisciplineSummary;

  // ── Actions ─────────────────────────────────────────────────────────────────

  setActiveStudent: (studentId: string | null) => void;
  setTypeFilter: (type: StudentLifeEventType | null) => void;

  loadEvents: (
    schoolSlug: string,
    studentId: string,
    params?: ListLifeEventsParams,
  ) => Promise<void>;

  refreshEvents: (
    schoolSlug: string,
    studentId: string,
    params?: ListLifeEventsParams,
  ) => Promise<void>;

  /** Ajoute un événement en tête de liste (après création). */
  addEvent: (studentId: string, event: StudentLifeEvent) => void;

  /** Remplace un événement dans la liste (après mise à jour). */
  updateEvent: (studentId: string, event: StudentLifeEvent) => void;

  /** Retire un événement de la liste (après suppression). */
  removeEvent: (studentId: string, eventId: string) => void;

  /** Remplace intégralement les événements d'un élève. */
  replaceStudentEvents: (studentId: string, events: StudentLifeEvent[]) => void;

  /** Hydrate plusieurs élèves en une seule mise à jour. */
  replaceManyStudentEvents: (
    entries: Array<{ studentId: string; events: StudentLifeEvent[] }>,
  ) => void;

  /** Vide le cache d'un étudiant (force rechargement à la prochaine ouverture). */
  invalidateStudent: (studentId: string) => void;

  reset: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDisciplineStore = create<DisciplineState>((set, get) => ({
  eventsMap: {},
  activeStudentId: null,
  isLoading: false,
  isRefreshing: false,
  typeFilter: null,

  // ── Getters ─────────────────────────────────────────────────────────────────

  getEvents(studentId) {
    const id = studentId ?? get().activeStudentId;
    if (!id) return [];
    return get().eventsMap[id] ?? [];
  },

  getSummary(studentId) {
    return computeDisciplineSummary(get().getEvents(studentId));
  },

  // ── Actions ─────────────────────────────────────────────────────────────────

  setActiveStudent(studentId) {
    set({ activeStudentId: studentId });
  },

  setTypeFilter(type) {
    set({ typeFilter: type });
  },

  async loadEvents(schoolSlug, studentId, params) {
    // Pas de rechargement si déjà en cache (sauf si refresh explicite).
    const cached = get().eventsMap[studentId];
    if (cached !== undefined) return;

    set({ isLoading: true, activeStudentId: studentId });
    try {
      const events = await disciplineApi.list(schoolSlug, studentId, params);
      set((state) => ({
        eventsMap: { ...state.eventsMap, [studentId]: events },
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  async refreshEvents(schoolSlug, studentId, params) {
    set({ isRefreshing: true, activeStudentId: studentId });
    try {
      const events = await disciplineApi.list(schoolSlug, studentId, params);
      set((state) => ({
        eventsMap: { ...state.eventsMap, [studentId]: events },
      }));
    } finally {
      set({ isRefreshing: false });
    }
  },

  addEvent(studentId, event) {
    set((state) => {
      const existing = state.eventsMap[studentId] ?? [];
      // Insère en tête : les événements sont triés par occurredAt DESC.
      return {
        eventsMap: {
          ...state.eventsMap,
          [studentId]: [event, ...existing],
        },
      };
    });
  },

  updateEvent(studentId, event) {
    set((state) => {
      const existing = state.eventsMap[studentId] ?? [];
      return {
        eventsMap: {
          ...state.eventsMap,
          [studentId]: existing.map((e) => (e.id === event.id ? event : e)),
        },
      };
    });
  },

  removeEvent(studentId, eventId) {
    set((state) => {
      const existing = state.eventsMap[studentId] ?? [];
      return {
        eventsMap: {
          ...state.eventsMap,
          [studentId]: existing.filter((e) => e.id !== eventId),
        },
      };
    });
  },

  replaceStudentEvents(studentId, events) {
    set((state) => ({
      eventsMap: {
        ...state.eventsMap,
        [studentId]: events,
      },
    }));
  },

  replaceManyStudentEvents(entries) {
    set((state) => {
      const nextEventsMap = { ...state.eventsMap };
      entries.forEach((entry) => {
        nextEventsMap[entry.studentId] = entry.events;
      });
      return { eventsMap: nextEventsMap };
    });
  },

  invalidateStudent(studentId) {
    set((state) => {
      const rest = { ...state.eventsMap };
      delete rest[studentId];
      return { eventsMap: rest };
    });
  },

  reset() {
    set({
      eventsMap: {},
      activeStudentId: null,
      isLoading: false,
      isRefreshing: false,
      typeFilter: null,
    });
  },
}));
