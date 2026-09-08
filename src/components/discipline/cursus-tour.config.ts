import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const CURSUS_TOUR_ID = "cursus";

export const CURSUS_TOUR_TARGETS = {
  filters: "cursus-tour-filters",
  kpis: "cursus-tour-kpis",
  helpToggle: "cursus-tour-help-toggle",
} as const;

export const CURSUS_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: CURSUS_TOUR_TARGETS.filters,
    titleKey: "onboardingTour.cursus.step1Title",
    bodyKey: "onboardingTour.cursus.step1Body",
  },
  {
    targetKey: CURSUS_TOUR_TARGETS.kpis,
    titleKey: "onboardingTour.cursus.step2Title",
    bodyKey: "onboardingTour.cursus.step2Body",
  },
  {
    targetKey: CURSUS_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.cursus.step3Title",
    bodyKey: "onboardingTour.cursus.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
