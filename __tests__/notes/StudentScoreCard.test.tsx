import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StudentScoreCard } from "../../src/components/notes/StudentScoreCard";
import type { EvaluationStudentScore } from "../../src/types/notes.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const STUDENT_NO_SCORE: EvaluationStudentScore = {
  id: "stu-1",
  firstName: "Lisa",
  lastName: "Ntamack",
  score: null,
  scoreStatus: "NOT_GRADED",
  comment: null,
};

const STUDENT_WITH_SCORE: EvaluationStudentScore = {
  id: "stu-2",
  firstName: "Paul",
  lastName: "Abega",
  score: 15,
  scoreStatus: "ENTERED",
  comment: "Bien",
};

const STUDENT_ABSENT: EvaluationStudentScore = {
  id: "stu-3",
  firstName: "Marie",
  lastName: "Dupont",
  score: null,
  scoreStatus: "ABSENT",
  comment: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSave() {
  return jest.fn().mockResolvedValue(undefined);
}

function makeFailingSave() {
  return jest.fn().mockRejectedValue(new Error("Serveur indisponible"));
}

// ─── Rendu ────────────────────────────────────────────────────────────────────

describe("Rendu initial", () => {
  it("affiche le nom de l'élève", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.getByTestId("scores-student-name-stu-1")).toHaveTextContent(
      "Ntamack Lisa",
    );
  });

  it("affiche le bouton statut avec la valeur par défaut Non noté", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.getByTestId("scores-status-btn-stu-1")).toHaveTextContent(
      "Non noté",
    );
  });

  it("affiche le bouton statut Noté pour un élève déjà noté", () => {
    render(
      <StudentScoreCard
        student={STUDENT_WITH_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.getByTestId("scores-status-btn-stu-2")).toHaveTextContent(
      "Noté",
    );
  });

  it("affiche le bouton statut Absent pour un élève absent", () => {
    render(
      <StudentScoreCard
        student={STUDENT_ABSENT}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.getByTestId("scores-status-btn-stu-3")).toHaveTextContent(
      "Absent",
    );
  });
});

// ─── Mode vue vs mode édition ─────────────────────────────────────────────────

describe("Mode vue / édition", () => {
  it("affiche le score en texte et le bouton Modifier quand la note existe", () => {
    render(
      <StudentScoreCard
        student={STUDENT_WITH_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.getByTestId("scores-score-display-stu-2")).toHaveTextContent(
      "15/20",
    );
    expect(screen.getByTestId("scores-submit-stu-2")).toHaveTextContent(
      "Modifier",
    );
    expect(screen.queryByTestId("scores-note-stu-2")).toBeNull();
  });

  it("affiche l'input note et le bouton Enregistrer quand la note n'existe pas", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    // Statut NOT_GRADED → input note caché (affiché seulement si ENTERED)
    expect(screen.queryByTestId("scores-note-stu-1")).toBeNull();
    expect(screen.getByTestId("scores-submit-stu-1")).toHaveTextContent(
      "Enregistrer",
    );
  });

  it("passe en mode édition au clic sur Modifier", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_WITH_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-submit-stu-2"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-2")).toBeTruthy(),
    );
    expect(screen.getByTestId("scores-submit-stu-2")).toHaveTextContent(
      "Enregistrer",
    );
  });

  it("affiche l'input note quand le statut passe à Noté (depuis Non noté)", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    // Ouvre le modal statut
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    await waitFor(() =>
      expect(
        screen.getByTestId("scores-status-option-stu-1-ENTERED"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));

    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );
  });
});

// ─── Modal statut ─────────────────────────────────────────────────────────────

describe("Dropdown statut", () => {
  it("ouvre le modal au clic sur le bouton statut (mode édition)", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    expect(
      screen.getByTestId("scores-status-option-stu-1-NOT_GRADED"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("scores-status-option-stu-1-ENTERED"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("scores-status-option-stu-1-ABSENT"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("scores-status-option-stu-1-EXCUSED"),
    ).toBeTruthy();
  });

  it("met à jour le statut et ferme le modal", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ABSENT"));

    await waitFor(() =>
      expect(screen.getByTestId("scores-status-btn-stu-1")).toHaveTextContent(
        "Absent",
      ),
    );
  });

  it("efface la note lors du passage de Noté à Non noté", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    // Passe en Noté
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByTestId("scores-note-stu-1"), "12");

    // Repasse en Non noté
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(
      screen.getByTestId("scores-status-option-stu-1-NOT_GRADED"),
    );

    // L'input note disparaît
    await waitFor(() =>
      expect(screen.queryByTestId("scores-note-stu-1")).toBeNull(),
    );
  });
});

// ─── Toggle commentaire ───────────────────────────────────────────────────────

describe("Toggle commentaire", () => {
  it("ouvre le champ commentaire au clic sur l'icône", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.queryByTestId("scores-comment-stu-1")).toBeNull();
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    expect(screen.getByTestId("scores-comment-stu-1")).toBeTruthy();
  });

  it("ferme le champ commentaire au second clic", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    expect(screen.queryByTestId("scores-comment-stu-1")).toBeNull();
  });

  it("affiche le commentaire existant à l'ouverture", () => {
    render(
      <StudentScoreCard
        student={STUDENT_WITH_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-2"));
    expect(screen.getByTestId("scores-comment-stu-2")).toHaveDisplayValue(
      "Bien",
    );
  });
});

// ─── Soumission et validation Zod ─────────────────────────────────────────────

describe("Soumission", () => {
  it("appelle onSave avec les valeurs correctes pour statut Non noté", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={save}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(save).toHaveBeenCalledWith({
      studentId: "stu-1",
      score: null,
      status: "NOT_GRADED",
      comment: null,
    });
  });

  it("appelle onSave avec score et commentaire renseignés", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={save}
      />,
    );
    // Sélectionne statut Noté
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("scores-note-stu-1"), "17");

    // Ouvre et renseigne le commentaire
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    fireEvent.changeText(
      screen.getByTestId("scores-comment-stu-1"),
      "Excellent travail",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledWith({
      studentId: "stu-1",
      score: 17,
      status: "ENTERED",
      comment: "Excellent travail",
    });
  });

  it("passe en mode vue après une sauvegarde réussie", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    // Passe en Noté + saisit une note
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByTestId("scores-note-stu-1"), "14");

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("scores-submit-stu-1")).toHaveTextContent(
        "Modifier",
      ),
    );
  });

  it("reste en mode édition si la sauvegarde échoue", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeFailingSave()}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId("scores-submit-stu-1")).toHaveTextContent(
      "Enregistrer",
    );
  });
});

// ─── Validation Zod ───────────────────────────────────────────────────────────

describe("Validation Zod — erreurs affichées sous les champs", () => {
  it("affiche l'erreur 'note requise' si statut Noté et champ vide", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={save}
      />,
    );
    // Sélectionne statut Noté
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );

    // Soumet sans saisir de note
    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("scores-score-error-stu-1")).toHaveTextContent(
        "La note est requise",
      ),
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("affiche l'erreur si la note dépasse le barème", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={save}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("scores-note-stu-1"), "25");

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("scores-score-error-stu-1")).toHaveTextContent(
        "Note supérieure au barème (/20)",
      ),
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("affiche l'erreur si la note est une valeur invalide", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={save}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("scores-note-stu-1"), "abc");

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("scores-score-error-stu-1")).toHaveTextContent(
        "Valeur invalide (nombre ≥ 0)",
      ),
    );
    expect(save).not.toHaveBeenCalled();
  });

  it("n'affiche pas d'erreur si la note est valide et dans le barème", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={save}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("scores-note-stu-1"), "18");

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByTestId("scores-score-error-stu-1")).toBeNull();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("efface l'erreur de note quand le statut repasse à Non noté", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    // Provoque l'erreur "note requise"
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(screen.getByTestId("scores-status-option-stu-1-ENTERED"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-note-stu-1")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(screen.getByTestId("scores-score-error-stu-1")).toBeTruthy(),
    );

    // Repasse en Non noté → efface l'erreur et cache le champ
    fireEvent.press(screen.getByTestId("scores-status-btn-stu-1"));
    fireEvent.press(
      screen.getByTestId("scores-status-option-stu-1-NOT_GRADED"),
    );

    await waitFor(() =>
      expect(screen.queryByTestId("scores-score-error-stu-1")).toBeNull(),
    );
  });
});

// ─── testID personnalisé ──────────────────────────────────────────────────────

describe("testID", () => {
  it("applique un testID personnalisé sur la card", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
        testID="custom-card-id"
      />,
    );
    expect(screen.getByTestId("custom-card-id")).toBeTruthy();
  });
});

// ─── Submit commentaire séparé ───────────────────────────────────────────────

describe("Submit commentaire", () => {
  it("affiche le bouton Enregistrer le commentaire dans la section commentaire", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-submit-comment-stu-1")).toBeTruthy(),
    );
    expect(screen.getByTestId("scores-submit-comment-stu-1")).toHaveTextContent(
      "Enregistrer le commentaire",
    );
  });

  it("referme la section commentaire après le submit du commentaire", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-comment-stu-1")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-comment-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.queryByTestId("scores-comment-stu-1")).toBeNull(),
    );
  });

  it("appelle onSave depuis le submit commentaire avec le bon payload", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={save}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-comment-stu-1")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("scores-comment-stu-1"),
      "Bonne participation",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-comment-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "stu-1",
        comment: "Bonne participation",
        status: "NOT_GRADED",
        score: null,
      }),
    );
  });

  it("ne referme pas la section si le submit commentaire échoue", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeFailingSave()}
      />,
    );
    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-comment-stu-1")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-comment-stu-1"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("scores-comment-stu-1")).toBeTruthy();
  });
});

// ─── Indicateur commentaire ───────────────────────────────────────────────────

describe("Indicateur commentaire", () => {
  it("affiche l'indicateur si le commentaire initial est non vide", () => {
    render(
      <StudentScoreCard
        student={STUDENT_WITH_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.getByTestId("scores-comment-indicator-stu-2")).toBeTruthy();
  });

  it("n'affiche pas l'indicateur si le commentaire initial est vide", () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.queryByTestId("scores-comment-indicator-stu-1")).toBeNull();
  });

  it("affiche l'indicateur après saisie d'un commentaire", async () => {
    render(
      <StudentScoreCard
        student={STUDENT_NO_SCORE}
        maxScore={20}
        onSave={makeSave()}
      />,
    );
    expect(screen.queryByTestId("scores-comment-indicator-stu-1")).toBeNull();

    fireEvent.press(screen.getByTestId("scores-toggle-comment-stu-1"));
    await waitFor(() =>
      expect(screen.getByTestId("scores-comment-stu-1")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("scores-comment-stu-1"),
      "Un commentaire",
    );

    await waitFor(() =>
      expect(screen.getByTestId("scores-comment-indicator-stu-1")).toBeTruthy(),
    );
  });
});

// ─── Appel avec un seul studentId ────────────────────────────────────────────

describe("Payload envoyé à onSave", () => {
  it("inclut exactement le studentId de la carte et non pas d'autres", async () => {
    const save = makeSave();
    render(
      <StudentScoreCard student={STUDENT_ABSENT} maxScore={20} onSave={save} />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-3"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: "stu-3" }),
    );
  });
});
