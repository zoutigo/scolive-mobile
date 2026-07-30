import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ONBOARDING_TOUR_STORAGE_KEY = "scolive-onboarding-tour";
export const ONBOARDING_TOUR_MAX_STEPS = 5;

export type OnboardingTourStep = {
  targetKey: string;
  titleKey: string;
  bodyKey: string;
};

export type TargetLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function buildTourCompletionKey(role: string, tourId: string): string {
  return `${role}:${tourId}`;
}

type OnboardingTourState = {
  completedTours: Record<string, boolean>;
  activeTourId: string | null;
  activeRole: string | null;
  steps: OnboardingTourStep[];
  stepIndex: number;
  targetLayout: TargetLayout | null;

  isCompleted: (role: string, tourId: string) => boolean;
  startTour: (
    tourId: string,
    role: string,
    steps: OnboardingTourStep[],
  ) => void;
  next: () => void;
  skip: () => void;
  finish: () => void;
  setTargetLayout: (layout: TargetLayout | null) => void;
};

export const useOnboardingTourStore = create<OnboardingTourState>()(
  persist(
    (set, get) => ({
      completedTours: {},
      activeTourId: null,
      activeRole: null,
      steps: [],
      stepIndex: 0,
      targetLayout: null,

      isCompleted: (role, tourId) =>
        !!get().completedTours[buildTourCompletionKey(role, tourId)],

      startTour: (tourId, role, steps) => {
        if (steps.length === 0) return;
        set({
          activeTourId: tourId,
          activeRole: role,
          steps: steps.slice(0, ONBOARDING_TOUR_MAX_STEPS),
          stepIndex: 0,
          targetLayout: null,
        });
      },

      next: () => {
        const { stepIndex, steps } = get();
        if (stepIndex >= steps.length - 1) {
          get().finish();
          return;
        }
        set({ stepIndex: stepIndex + 1, targetLayout: null });
      },

      skip: () => {
        get().finish();
      },

      finish: () => {
        const { activeTourId, activeRole, completedTours } = get();
        if (!activeTourId || !activeRole) {
          set({
            activeTourId: null,
            activeRole: null,
            steps: [],
            stepIndex: 0,
            targetLayout: null,
          });
          return;
        }
        set({
          completedTours: {
            ...completedTours,
            [buildTourCompletionKey(activeRole, activeTourId)]: true,
          },
          activeTourId: null,
          activeRole: null,
          steps: [],
          stepIndex: 0,
          targetLayout: null,
        });
      },

      setTargetLayout: (layout) => set({ targetLayout: layout }),
    }),
    {
      name: ONBOARDING_TOUR_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ completedTours: state.completedTours }),
    },
  ),
);
