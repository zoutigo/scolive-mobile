import type { OnboardingTourStep } from "../../store/onboarding-tour.store";
import {
  BOTTOM_TAB_ACCOUNT_TOUR_TARGET,
  BOTTOM_TAB_MENU_TOUR_TARGET,
} from "../navigation/BottomTabBar";

export const PARENT_LANDING_TOUR_ID = "parent-landing";

// Ce tour est entièrement centré sur le menu de navigation (aside/drawer),
// jamais sur le contenu de la landing page elle-même : "menu" et "compte"
// vivent dans la barre de navigation globale (BottomTabBar), "drawerMessaging"
// et "drawerChild" vivent dans le contenu du drawer (AppDrawer) — tous montés
// en même temps que l'écran d'accueil parent puisqu'ils font partie du chrome
// global (AppShell), jamais dans ParentHome.
export const PARENT_LANDING_TOUR_TARGETS = {
  menu: BOTTOM_TAB_MENU_TOUR_TARGET,
  drawerMessaging: "parent-landing-tour-drawer-messaging",
  drawerChild: "parent-landing-tour-drawer-child",
  account: BOTTOM_TAB_ACCOUNT_TOUR_TARGET,
  helpButton: "parent-landing-tour-help-button",
} as const;

// Étape 1 : presser l'icône menu ouvre réellement le drawer (action utile),
// donc advanceOnTargetPress — évite que le tooltip reste bloqué en étape 1
// pendant que le drawer s'ouvre par-dessus (bug corrigé ici).
// Étape 2 : purement informative — presser "Messagerie" fermerait le drawer
// et naviguerait hors de l'écran, ce qui masquerait la cible de l'étape 3
// (qui vit dans ce même drawer).
// Étape 3 : presser la ligne accordéon d'un enfant ne fait que la déplier
// (action réelle, sans fermer le drawer ni naviguer), donc advanceOnTargetPress.
// Étape 4 : informative — le drawer est refermé automatiquement (AppShell)
// avant cette étape pour laisser l'icône compte du bas visible.
// Étape 5 : bouton d'aide toujours disponible sur la landing (rappel de ce
// tour) — purement informative, comme le pilote ChildTimetableScreen ;
// porte le finishLabelKey (dernière étape), pas l'étape compte.
export const PARENT_LANDING_TOUR_STEPS: OnboardingTourStep[] = [
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.menu,
    titleKey: "onboardingTour.parentLanding.step1Title",
    bodyKey: "onboardingTour.parentLanding.step1Body",
    advanceOnTargetPress: true,
  },
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.drawerMessaging,
    titleKey: "onboardingTour.parentLanding.step2Title",
    bodyKey: "onboardingTour.parentLanding.step2Body",
  },
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.drawerChild,
    titleKey: "onboardingTour.parentLanding.step3Title",
    bodyKey: "onboardingTour.parentLanding.step3Body",
    advanceOnTargetPress: true,
  },
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.account,
    titleKey: "onboardingTour.parentLanding.step4Title",
    bodyKey: "onboardingTour.parentLanding.step4Body",
  },
  {
    targetKey: PARENT_LANDING_TOUR_TARGETS.helpButton,
    titleKey: "onboardingTour.parentLanding.step5Title",
    bodyKey: "onboardingTour.parentLanding.step5Body",
    finishLabelKey: "onboardingTour.common.gotIt",
  },
];
