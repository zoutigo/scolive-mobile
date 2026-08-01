import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const SITE_CONTENT_TOUR_ID = "site-content";

export const SITE_CONTENT_TOUR_TARGETS = {
  tabs: "site-content-tour-tabs",
  selectors: "site-content-tour-selectors",
  newDraft: "site-content-tour-new-draft",
} as const;

export const SITE_CONTENT_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.siteContent.step1Title",
    bodyKey: "onboardingTour.siteContent.step1Body",
    advanceOnTargetPress: true,
  },
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.selectors,
    titleKey: "onboardingTour.siteContent.step2Title",
    bodyKey: "onboardingTour.siteContent.step2Body",
  },
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.newDraft,
    titleKey: "onboardingTour.siteContent.step3Title",
    bodyKey: "onboardingTour.siteContent.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
