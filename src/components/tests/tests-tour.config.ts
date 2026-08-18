import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const TESTS_TOUR_ID = "tests";
export const TESTS_TOUR_ROLE = "tester";
export const TESTS_TOUR_FALLBACK_CAMPAIGN_ID = "tests-tour-fallback";

export const TESTS_TOUR_TARGETS = {
  tabs: "tests-tour-tabs",
  campaignAction: "tests-tour-campaign-action",
  helpToggle: "tests-tour-help-toggle",
} as const;

export const TESTS_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: TESTS_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.tests.step1Title",
    bodyKey: "onboardingTour.tests.step1Body",
  },
  {
    targetKey: TESTS_TOUR_TARGETS.campaignAction,
    titleKey: "onboardingTour.tests.step2Title",
    bodyKey: "onboardingTour.tests.step2Body",
  },
  {
    targetKey: TESTS_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.tests.step3Title",
    bodyKey: "onboardingTour.tests.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
