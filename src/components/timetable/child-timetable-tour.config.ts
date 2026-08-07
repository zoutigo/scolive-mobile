import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const CHILD_TIMETABLE_TOUR_ID = "child-timetable";

export const CHILD_TIMETABLE_TOUR_TARGETS = {
  modeTabs: "child-timetable-tour-mode-tabs",
  navRow: "child-timetable-tour-nav-row",
  dayList: "child-timetable-tour-day-list",
  helpToggle: "child-timetable-tour-help-toggle",
} as const;

export const CHILD_TIMETABLE_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: CHILD_TIMETABLE_TOUR_TARGETS.modeTabs,
    titleKey: "onboardingTour.childTimetable.step1Title",
    bodyKey: "onboardingTour.childTimetable.step1Body",
  },
  {
    targetKey: CHILD_TIMETABLE_TOUR_TARGETS.navRow,
    titleKey: "onboardingTour.childTimetable.step2Title",
    bodyKey: "onboardingTour.childTimetable.step2Body",
  },
  {
    targetKey: CHILD_TIMETABLE_TOUR_TARGETS.dayList,
    titleKey: "onboardingTour.childTimetable.step3Title",
    bodyKey: "onboardingTour.childTimetable.step3Body",
  },
  {
    targetKey: CHILD_TIMETABLE_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.childTimetable.step4Title",
    bodyKey: "onboardingTour.childTimetable.step4Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
