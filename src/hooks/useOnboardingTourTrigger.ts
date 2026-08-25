import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "../store/auth.store";
import {
  useOnboardingTourStore,
  type OnboardingTourStep,
} from "../store/onboarding-tour.store";
import {
  getViewType,
  type ViewType,
} from "../components/navigation/nav-config";

export function useOnboardingTourTrigger(options: {
  tourId: string;
  role: ViewType;
  steps: OnboardingTourStep[];
  /** Desactive le declenchement (ex : cibles du tour absentes dans le mode
   * courant de l'ecran, comme la consultation seule). Defaut : true. */
  enabled?: boolean;
}) {
  const { tourId, role, steps, enabled = true } = options;
  const user = useAuthStore((state) => state.user);
  const startTour = useOnboardingTourStore((state) => state.startTour);
  const isCompleted = useOnboardingTourStore((state) => state.isCompleted);
  const activeTourId = useOnboardingTourStore((state) => state.activeTourId);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      if (!user) return;
      if (user.onboardingHelpEnabled === false) return;
      if (getViewType(user) !== role) return;
      if (isCompleted(role, tourId)) return;
      if (activeTourId) return;

      // InteractionManager.runAfterInteractions is deprecated in favor of
      // requestIdleCallback (React Native provides it as a global polyfill).
      const handle = requestIdleCallback(() => {
        startTour(tourId, role, steps);
      });

      return () => cancelIdleCallback(handle);
    }, [
      enabled,
      user,
      role,
      tourId,
      steps,
      isCompleted,
      activeTourId,
      startTour,
    ]),
  );
}
