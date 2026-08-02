import type { OnboardingTourStep } from "../../store/onboarding-tour.store";
import {
  BOTTOM_TAB_ACCOUNT_TOUR_TARGET,
  BOTTOM_TAB_MENU_TOUR_TARGET,
} from "../navigation/BottomTabBar";

export const PARENT_LANDING_TOUR_ID = "parent-landing";

// Les cibles "menu" et "compte" vivent dans la barre de navigation globale
// (BottomTabBar), pas dans ParentHome — elles sont montées en même temps
// que l'écran d'accueil parent puisque BottomTabBar fait partie du chrome
// global (AppShell). Seuls "messaging" et "children" sont propres à
// ParentHome.
export const PARENT_LANDING_TOUR_TARGETS = {
  menu: BOTTOM_TAB_MENU_TOUR_TARGET,
  messaging: "parent-landing-tour-messaging",
  children: "parent-landing-tour-children",
  account: BOTTOM_TAB_ACCOUNT_TOUR_TARGET,
} as const;

// Chaque étape reste purement informative (pas d'advanceOnTargetPress) :
// presser la cible réelle (ouvrir le menu, aller en messagerie, ouvrir un
// enfant, aller au compte) navigue hors de l'écran d'accueil et empêcherait
// les étapes suivantes du tour de se monter.
export const PARENT_LANDING_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.menu,
    titleKey: "onboardingTour.parentLanding.step1Title",
    bodyKey: "onboardingTour.parentLanding.step1Body",
  },
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.messaging,
    titleKey: "onboardingTour.parentLanding.step2Title",
    bodyKey: "onboardingTour.parentLanding.step2Body",
  },
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.children,
    titleKey: "onboardingTour.parentLanding.step3Title",
    bodyKey: "onboardingTour.parentLanding.step3Body",
  },
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.account,
    titleKey: "onboardingTour.parentLanding.step4Title",
    bodyKey: "onboardingTour.parentLanding.step4Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
