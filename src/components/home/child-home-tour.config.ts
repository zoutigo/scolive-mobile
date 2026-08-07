import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const CHILD_HOME_TOUR_ID = "child-home";

export const CHILD_HOME_TOUR_TARGETS = {
  kpis: "child-home-tour-kpis",
  sections: "child-home-tour-sections",
  helpToggle: "child-home-tour-help-toggle",
} as const;

export const CHILD_HOME_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: CHILD_HOME_TOUR_TARGETS.kpis,
    titleKey: "onboardingTour.childHome.kpisTitle",
    bodyKey: "onboardingTour.childHome.kpisBody",
  },
  {
    targetKey: CHILD_HOME_TOUR_TARGETS.sections,
    titleKey: "onboardingTour.childHome.sectionsTitle",
    bodyKey: "onboardingTour.childHome.sectionsBody",
  },
  {
    targetKey: CHILD_HOME_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.childHome.helpToggleTitle",
    bodyKey: "onboardingTour.childHome.helpToggleBody",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
