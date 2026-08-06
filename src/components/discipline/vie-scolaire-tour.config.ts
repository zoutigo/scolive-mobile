import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const VIE_SCOLAIRE_TOUR_ID = "vie-scolaire";

export const VIE_SCOLAIRE_TOUR_TARGETS = {
  tabs: "vie-scolaire-tour-tabs",
  kpis: "vie-scolaire-tour-kpis",
  helpToggle: "vie-scolaire-tour-help-toggle",
} as const;

export const VIE_SCOLAIRE_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: VIE_SCOLAIRE_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.vieScolaire.step1Title",
    bodyKey: "onboardingTour.vieScolaire.step1Body",
  },
  {
    targetKey: VIE_SCOLAIRE_TOUR_TARGETS.kpis,
    titleKey: "onboardingTour.vieScolaire.step2Title",
    bodyKey: "onboardingTour.vieScolaire.step2Body",
  },
  {
    targetKey: VIE_SCOLAIRE_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.vieScolaire.step3Title",
    bodyKey: "onboardingTour.vieScolaire.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
