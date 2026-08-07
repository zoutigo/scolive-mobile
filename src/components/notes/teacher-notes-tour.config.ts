import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const TEACHER_NOTES_TOUR_ID = "teacher-notes";

export const TEACHER_NOTES_TOUR_TARGETS = {
  tabs: "teacher-notes-tour-tabs",
  filterToggle: "teacher-notes-tour-filter-toggle",
  createFab: "teacher-notes-tour-create-fab",
  helpToggle: "teacher-notes-tour-help-toggle",
} as const;

export const TEACHER_NOTES_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: TEACHER_NOTES_TOUR_TARGETS.tabs,
    titleKey: "onboardingTour.teacherNotes.step1Title",
    bodyKey: "onboardingTour.teacherNotes.step1Body",
  },
  {
    targetKey: TEACHER_NOTES_TOUR_TARGETS.filterToggle,
    titleKey: "onboardingTour.teacherNotes.step2Title",
    bodyKey: "onboardingTour.teacherNotes.step2Body",
  },
  {
    targetKey: TEACHER_NOTES_TOUR_TARGETS.createFab,
    titleKey: "onboardingTour.teacherNotes.step3Title",
    bodyKey: "onboardingTour.teacherNotes.step3Body",
  },
  {
    targetKey: TEACHER_NOTES_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.teacherNotes.step4Title",
    bodyKey: "onboardingTour.teacherNotes.step4Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
