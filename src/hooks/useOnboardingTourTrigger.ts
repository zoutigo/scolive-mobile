import { useCallback } from "react";
import { InteractionManager } from "react-native";
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
}) {
  const { tourId, role, steps } = options;
  const user = useAuthStore((state) => state.user);
  const startTour = useOnboardingTourStore((state) => state.startTour);
  const isCompleted = useOnboardingTourStore((state) => state.isCompleted);
  const activeTourId = useOnboardingTourStore((state) => state.activeTourId);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      if (user.onboardingHelpEnabled === false) return;
      if (getViewType(user) !== role) return;
      if (isCompleted(role, tourId)) return;
      if (activeTourId) return;

      const handle = InteractionManager.runAfterInteractions(() => {
        startTour(tourId, role, steps);
      });

      return () => handle.cancel();
    }, [user, role, tourId, steps, isCompleted, activeTourId, startTour]),
  );
}
