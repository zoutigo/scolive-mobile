import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const TEACHER_AGENDA_TOUR_ID = "teacher-agenda";

export const TEACHER_AGENDA_TOUR_TARGETS = {
  tabs: "teacher-agenda-tour-tabs",
  modeTabs: "teacher-agenda-tour-mode-tabs",
  navRow: "teacher-agenda-tour-nav-row",
  helpToggle: "teacher-agenda-tour-help-toggle",
} as const;

export const TEACHER_AGENDA_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: TEACHER_AGENDA_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.teacherAgenda.step1Title",
    bodyKey: "onboardingTour.teacherAgenda.step1Body",
  },
  {
    targetKey: TEACHER_AGENDA_TOUR_TARGETS.modeTabs,
    titleKey: "onboardingTour.teacherAgenda.step2Title",
    bodyKey: "onboardingTour.teacherAgenda.step2Body",
  },
  {
    targetKey: TEACHER_AGENDA_TOUR_TARGETS.navRow,
    titleKey: "onboardingTour.teacherAgenda.step3Title",
    bodyKey: "onboardingTour.teacherAgenda.step3Body",
  },
  {
    targetKey: TEACHER_AGENDA_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.teacherAgenda.step4Title",
    bodyKey: "onboardingTour.teacherAgenda.step4Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
