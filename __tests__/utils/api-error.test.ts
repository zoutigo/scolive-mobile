import {
  translateApiMessage,
  extractApiError,
} from "../../src/utils/api-error";

describe("translateApiMessage", () => {
  it("traduit les erreurs de droits connues", () => {
    expect(translateApiMessage("Insufficient role")).toContain("droits");
    expect(
      translateApiMessage(
        "Only class referent teacher can manage timetable for this class",
      ),
    ).toContain("référent");
    expect(
      translateApiMessage(
        "Teacher is not assigned to this class and subject for the school year",
      ),
    ).toContain("affecté");
    expect(
      translateApiMessage("Selected user is not a teacher in this school"),
    ).toContain("enseignant");
  });

  it("traduit les conflits horaires", () => {
    expect(translateApiMessage("Conflicting slot for class")).toContain(
      "classe",
    );
    expect(translateApiMessage("Conflicting slot for teacher")).toContain(
      "enseignant",
    );
    expect(translateApiMessage("Conflicting slot for room")).toContain("salle");
    expect(translateApiMessage("Conflicting occurrence for class")).toContain(
      "classe",
    );
    expect(translateApiMessage("Conflicting occurrence for teacher")).toContain(
      "enseignant",
    );
    expect(translateApiMessage("Conflicting occurrence for room")).toContain(
      "salle",
    );
  });

  it("traduit les erreurs de validation", () => {
    expect(
      translateApiMessage("startMinute must be lower than endMinute"),
    ).toContain("fin");
    expect(translateApiMessage("No fields to update")).toContain(
      "modification",
    );
    expect(translateApiMessage("Class school year mismatch")).toContain(
      "année scolaire",
    );
  });

  it("traduit les erreurs 'not found'", () => {
    expect(translateApiMessage("Class not found")).toContain("introuvable");
    expect(translateApiMessage("Timetable slot not found")).toContain(
      "introuvable",
    );
    expect(translateApiMessage("One-off slot not found")).toContain(
      "introuvable",
    );
  });

  it("retourne le message original si inconnu", () => {
    expect(translateApiMessage("Some unknown error")).toBe(
      "Some unknown error",
    );
  });

  it("retourne le message inchangé s'il est déjà en français", () => {
    const msg = "Votre session a expiré. Veuillez vous reconnecter.";
    expect(translateApiMessage(msg)).toBe(msg);
  });
});

describe("extractApiError", () => {
  it("extrait et traduit le message d'une Error", () => {
    const err = new Error("Insufficient role");
    expect(extractApiError(err)).toContain("droits");
  });

  it("extrait le message d'une Error non répertoriée verbatim", () => {
    const err = new Error("Network timeout");
    expect(extractApiError(err)).toBe("Network timeout");
  });

  it("gère une chaîne brute", () => {
    expect(extractApiError("Conflicting slot for room")).toContain("salle");
  });

  it("retourne un message générique pour undefined", () => {
    expect(extractApiError(undefined)).toBe(
      "Une erreur inattendue est survenue.",
    );
  });

  it("retourne un message générique pour null", () => {
    expect(extractApiError(null)).toBe("Une erreur inattendue est survenue.");
  });

  it("retourne un message générique pour un objet sans message", () => {
    expect(extractApiError({})).toBe("Une erreur inattendue est survenue.");
  });
});
