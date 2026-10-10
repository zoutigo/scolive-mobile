import { useAuthStore } from "../store/auth.store";

/**
 * Vrai quand l'utilisateur connecté est en lecture seule dans l'école (élève
 * exclu, ou parent dont tous les enfants sont exclus). Les écrans s'en servent
 * pour masquer ou désactiver leurs actions d'écriture ; le serveur reste
 * l'autorité (403 SCHOOL_MEMBER_READ_ONLY).
 */
export function useSchoolReadOnly(): boolean {
  const user = useAuthStore((state) => state.user);
  return user?.schoolReadOnly === true;
}
