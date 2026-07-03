import type { Router } from "expo-router";

/**
 * Retourne vers l'écran précédent si l'historique le permet,
 * sinon navigue vers l'accueil. Utilisé dans les boutons retour
 * de ModuleHeader pour couvrir les cas d'entrée par deep link
 * sans historique de navigation.
 */
export function moduleBack(
  router: Pick<Router, "canGoBack" | "back" | "navigate">,
): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.navigate("/" as never);
  }
}
