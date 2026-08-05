import { useCallback, useEffect, useState } from "react";
import { timetableApi } from "../api/timetable.api";
import { useAuthStore } from "../store/auth.store";

export type SelfStudentContext = {
  studentId: string;
  firstName: string;
  lastName: string;
  classId: string;
  className: string;
};

/**
 * Résout l'identité "élève connecté" (son propre studentId + sa classe
 * courante) via `/timetable/me` sans `childId`, déjà self-capable côté API
 * pour le rôle STUDENT. Utilisé par les écrans self (Vie scolaire, Vie de
 * classe, Notes, Devoirs) qui ont besoin de cette identité pour appeler des
 * endpoints scopés par studentId/classId, à la différence de l'écran Emploi
 * du temps qui se résout lui-même sans dépendre de ce hook.
 */
/**
 * `enabled` (défaut `true`) permet aux composants "duaux" (parent/self dans
 * le même écran) de ne déclencher cette résolution que lorsqu'ils sont
 * effectivement en mode self — évite un appel réseau superflu, et surtout
 * non-mocké, quand l'écran est monté en mode parent avec un childId connu.
 */
export function useSelfStudentContext(enabled = true) {
  const { schoolSlug } = useAuthStore();
  const [context, setContext] = useState<SelfStudentContext | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolSlug || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const timetable = await timetableApi.getMyTimetable(schoolSlug, {});
      setContext({
        studentId: timetable.student.id,
        firstName: timetable.student.firstName,
        lastName: timetable.student.lastName,
        classId: timetable.class.id,
        className: timetable.class.name,
      });
    } catch {
      setError("self-context-load-failed");
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...context, isLoading: enabled && isLoading, error, refresh: load };
}
