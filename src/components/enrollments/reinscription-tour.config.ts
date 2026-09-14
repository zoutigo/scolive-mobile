import type { OnboardingTourStep } from "../../store/onboarding-tour.store";

export const REINSCRIPTION_TOUR_ID = "reinscription-parent";

export const REINSCRIPTION_TOUR_TARGETS = {
  wallet: "reinscription-tour-wallet",
  children: "reinscription-tour-children",
  reinscribe: "reinscription-tour-reinscribe",
  helpToggle: "reinscription-tour-help-toggle",
} as const;

export const REINSCRIPTION_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: REINSCRIPTION_TOUR_TARGETS.wallet,
    titleKey: "onboardingTour.reinscription.walletTitle",
    bodyKey: "onboardingTour.reinscription.walletBody",
  },
  {
    targetKey: REINSCRIPTION_TOUR_TARGETS.children,
    titleKey: "onboardingTour.reinscription.childrenTitle",
    bodyKey: "onboardingTour.reinscription.childrenBody",
  },
  {
    targetKey: REINSCRIPTION_TOUR_TARGETS.reinscribe,
    titleKey: "onboardingTour.reinscription.reinscribeTitle",
    bodyKey: "onboardingTour.reinscription.reinscribeBody",
  },
  {
    targetKey: REINSCRIPTION_TOUR_TARGETS.helpToggle,
    titleKey: "onboardingTour.reinscription.helpToggleTitle",
    bodyKey: "onboardingTour.reinscription.helpToggleBody",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
