import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const TEACHER_DISCIPLINE_TOUR_ID = "teacher-discipline";

export const TEACHER_DISCIPLINE_TOUR_TARGETS = {
  tabs: "teacher-discipline-tour-tabs",
  studentFilter: "teacher-discipline-tour-student-filter",
  createFab: "teacher-discipline-tour-create-fab",
  helpToggle: "teacher-discipline-tour-help-toggle",
} as const;

export const TEACHER_DISCIPLINE_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: TEACHER_DISCIPLINE_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.teacherDiscipline.step1Title",
    bodyKey: "onboardingTour.teacherDiscipline.step1Body",
  },
  {
    targetKey: TEACHER_DISCIPLINE_TOUR_TARGETS.studentFilter,
    titleKey: "onboardingTour.teacherDiscipline.step2Title",
    bodyKey: "onboardingTour.teacherDiscipline.step2Body",
  },
  {
    targetKey: TEACHER_DISCIPLINE_TOUR_TARGETS.createFab,
    titleKey: "onboardingTour.teacherDiscipline.step3Title",
    bodyKey: "onboardingTour.teacherDiscipline.step3Body",
  },
  {
    targetKey: TEACHER_DISCIPLINE_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.teacherDiscipline.step4Title",
    bodyKey: "onboardingTour.teacherDiscipline.step4Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
