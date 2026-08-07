import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const SITE_CONTENT_TOUR_ID = "site-content";

export const SITE_CONTENT_TOUR_TARGETS = {
  tabs: "site-content-tour-tabs",
  contactEdit: "site-content-tour-contact-edit",
  selectors: "site-content-tour-selectors",
  newDraft: "site-content-tour-new-draft",
  helpToggle: "site-content-tour-help-toggle",
} as const;

export const SITE_CONTENT_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.siteContent.step1Title",
    bodyKey: "onboardingTour.siteContent.step1Body",
    advanceOnTargetPress: true,
  },
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.contactEdit,
    titleKey: "onboardingTour.siteContent.step2Title",
    bodyKey: "onboardingTour.siteContent.step2Body",
  },
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.selectors,
    titleKey: "onboardingTour.siteContent.step3Title",
    bodyKey: "onboardingTour.siteContent.step3Body",
  },
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.newDraft,
    titleKey: "onboardingTour.siteContent.step4Title",
    bodyKey: "onboardingTour.siteContent.step4Body",
  },
  {
    targetKey: SITE_CONTENT_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.siteContent.step5Title",
    bodyKey: "onboardingTour.siteContent.step5Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
