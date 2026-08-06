import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const CHILD_NOTES_TOUR_ID = "child-notes";

export const CHILD_NOTES_TOUR_TARGETS = {
  tabs: "child-notes-tour-tabs",
  filters: "child-notes-tour-filters",
  helpToggle: "child-notes-tour-help-toggle",
} as const;

export const CHILD_NOTES_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: CHILD_NOTES_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.childNotes.tabsTitle",
    bodyKey: "onboardingTour.childNotes.tabsBody",
  },
  {
    targetKey: CHILD_NOTES_TOUR_TARGETS.filters,
    titleKey: "onboardingTour.childNotes.filtersTitle",
    bodyKey: "onboardingTour.childNotes.filtersBody",
  },
  {
    targetKey: CHILD_NOTES_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.childNotes.helpToggleTitle",
    bodyKey: "onboardingTour.childNotes.helpToggleBody",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
