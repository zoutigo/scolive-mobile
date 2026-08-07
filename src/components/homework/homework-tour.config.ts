import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const HOMEWORK_TOUR_ID = "homework";

export const HOMEWORK_TOUR_TARGETS = {
  tabs: "homework-tour-tabs",
  card: "homework-tour-card",
  markDone: "homework-tour-mark-done",
  helpToggle: "homework-tour-help-toggle",
} as const;

export const HOMEWORK_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: HOMEWORK_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.homework.step1Title",
    bodyKey: "onboardingTour.homework.step1Body",
  },
  {
    targetKey: HOMEWORK_TOUR_TARGETS.card,
    titleKey: "onboardingTour.homework.step2Title",
    bodyKey: "onboardingTour.homework.step2Body",
  },
  {
    targetKey: HOMEWORK_TOUR_TARGETS.markDone,
    titleKey: "onboardingTour.homework.step3Title",
    bodyKey: "onboardingTour.homework.step3Body",
  },
  {
    targetKey: HOMEWORK_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.homework.step4Title",
    bodyKey: "onboardingTour.homework.step4Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
