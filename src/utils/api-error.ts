/**
 * Utilitaires pour la gestion des erreurs renvoyées par l'API.
 *
 * Le backend (NestJS) lève des exceptions avec des messages en anglais.
 * Ce fichier centralise leur traduction en français et l'extraction du
 * message depuis une valeur `unknown` capturée dans un catch.
 */

const ERROR_TRANSLATIONS: Record<string, string> = {
  // Droits d'accès
  "Insufficient role":
    "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  "Only class referent teacher can manage timetable for this class":
    "Seul l'enseignant référent de cette classe peut modifier les séries de créneaux.",
  "Teacher can only manage one-off slots they are assigned to":
    "Vous pouvez uniquement modifier les créneaux isolés dont vous êtes l'enseignant.",
  "Selected user is not a teacher in this school":
    "L'utilisateur sélectionné n'est pas enseignant dans cet établissement.",
  "Teacher is not assigned to this class and subject for the school year":
    "L'enseignant n'est pas affecté à cette classe et cette matière pour l'année scolaire en cours.",
  "Subject is not allowed for this class":
    "Cette matière n'est pas autorisée pour cette classe.",
  "Class has no curriculum": "Cette classe n'a pas de programme défini.",
  "Subject is not in class curriculum":
    "Cette matière ne fait pas partie du programme de la classe.",

  // Conflits horaires
  "Conflicting slot for class":
    "Conflit horaire : la classe a déjà un cours sur ce créneau.",
  "Conflicting slot for teacher":
    "Conflit horaire : l'enseignant est déjà occupé sur ce créneau.",
  "Conflicting slot for room":
    "Conflit horaire : la salle est déjà occupée sur ce créneau.",
  "Conflicting occurrence for class":
    "Conflit horaire : la classe a déjà un cours prévu à cette date et heure.",
  "Conflicting occurrence for teacher":
    "Conflit horaire : l'enseignant est déjà prévu sur un autre cours à cette date et heure.",
  "Conflicting occurrence for room":
    "Conflit horaire : la salle est déjà occupée à cette date et heure.",

  // Données introuvables
  "Class not found": "Classe introuvable.",
  "Timetable slot not found": "Créneau introuvable.",
  "One-off slot not found": "Créneau ponctuel introuvable.",
  "Slot exception not found": "Exception de créneau introuvable.",
  "Student enrollment not found": "Inscription élève introuvable.",
  "Student profile not found": "Profil élève introuvable.",
  "Subject not found": "Matière introuvable.",
  "School year not found": "Année scolaire introuvable.",

  // Validation
  "startMinute must be lower than endMinute":
    "L'heure de fin doit être après l'heure de début.",
  "No fields to update": "Aucune modification à enregistrer.",
  "Class school year mismatch":
    "La classe ne correspond pas à l'année scolaire indiquée.",
  "Invalid colorHex": "Code couleur invalide.",

  // Session
  "Votre session a expiré. Veuillez vous reconnecter.":
    "Votre session a expiré. Veuillez vous reconnecter.",
};

/**
 * Traduit un message d'erreur backend anglais en français.
 * Si le message n'est pas reconnu, le retourne tel quel.
 */
export function translateApiMessage(message: string): string {
  return ERROR_TRANSLATIONS[message] ?? message;
}

/**
 * Extrait et traduit le message d'une erreur capturée dans un catch.
 * Gère les `Error` standards et les chaînes brutes.
 */
export function extractApiError(err: unknown): string {
  if (err instanceof Error && err.message) {
    return translateApiMessage(err.message);
  }
  if (typeof err === "string" && err) {
    return translateApiMessage(err);
  }
  return "Une erreur inattendue est survenue.";
}
