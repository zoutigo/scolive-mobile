import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const MESSAGES_TOUR_ID = "messages";

export const MESSAGES_TOUR_TARGETS = {
  folderTabs: "messages-tour-folder-tabs",
  compose: "messages-tour-compose",
  helpToggle: "messages-tour-help-toggle",
} as const;

export const MESSAGES_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: MESSAGES_TOUR_TARGETS.folderTabs,
    titleKey: "onboardingTour.messages.step1Title",
    bodyKey: "onboardingTour.messages.step1Body",
  },
  {
    targetKey: MESSAGES_TOUR_TARGETS.compose,
    titleKey: "onboardingTour.messages.step2Title",
    bodyKey: "onboardingTour.messages.step2Body",
  },
  {
    targetKey: MESSAGES_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.messages.step3Title",
    bodyKey: "onboardingTour.messages.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
