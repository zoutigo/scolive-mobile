import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const SCHOOL_SETTINGS_TOUR_ID = "school-settings";

export const SCHOOL_SETTINGS_TOUR_TARGETS = {
  levelsTab: "school-settings-levels-tab",
  firstRow: "school-settings-levels-first-row",
  helpToggle: "school-settings-tour-help-toggle",
} as const;

export const SCHOOL_SETTINGS_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: SCHOOL_SETTINGS_TOUR_TARGETS.levelsTab,
    titleKey: "onboardingTour.schoolSettings.step1Title",
    bodyKey: "onboardingTour.schoolSettings.step1Body",
  },
  {
    targetKey: SCHOOL_SETTINGS_TOUR_TARGETS.firstRow,
    titleKey: "onboardingTour.schoolSettings.step2Title",
    bodyKey: "onboardingTour.schoolSettings.step2Body",
  },
  {
    targetKey: SCHOOL_SETTINGS_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.schoolSettings.step3Title",
    bodyKey: "onboardingTour.schoolSettings.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
