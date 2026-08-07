import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const TEACHER_HOME_TOUR_ID = "teacher-home";

export const TEACHER_HOME_TOUR_TARGETS = {
  classesGrid: "teacher-home-tour-classes-grid",
  evaluationsLink: "teacher-home-tour-evaluations-link",
  helpButton: "teacher-home-tour-help-button",
} as const;

export const TEACHER_HOME_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: TEACHER_HOME_TOUR_TARGETS.classesGrid,
    titleKey: "onboardingTour.teacherHome.step1Title",
    bodyKey: "onboardingTour.teacherHome.step1Body",
  },
  {
    targetKey: TEACHER_HOME_TOUR_TARGETS.evaluationsLink,
    titleKey: "onboardingTour.teacherHome.step2Title",
    bodyKey: "onboardingTour.teacherHome.step2Body",
  },
  {
    targetKey: TEACHER_HOME_TOUR_TARGETS.helpButton,
    titleKey: "onboardingTour.teacherHome.step3Title",
    bodyKey: "onboardingTour.teacherHome.step3Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
