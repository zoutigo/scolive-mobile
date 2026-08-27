import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const DISCIPLINE_SELF_TOUR_ID = "discipline-self";

export const DISCIPLINE_SELF_TOUR_TARGETS = {
  tabs: "discipline-self-tour-tabs",
  kpis: "discipline-self-tour-kpis",
  helpToggle: "discipline-self-tour-help-toggle",
} as const;

export const DISCIPLINE_SELF_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: DISCIPLINE_SELF_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.disciplineSelf.step1Title",
    bodyKey: "onboardingTour.disciplineSelf.step1Body",
  },
  {
    targetKey: DISCIPLINE_SELF_TOUR_TARGETS.kpis,
    titleKey: "onboardingTour.disciplineSelf.step2Title",
    bodyKey: "onboardingTour.disciplineSelf.step2Body",
  },
  {
    targetKey: DISCIPLINE_SELF_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.disciplineSelf.step3Title",
    bodyKey: "onboardingTour.disciplineSelf.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
