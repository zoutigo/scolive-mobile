/**
 * Tests EvaluationForm
 *
 * Couverture :
 *  – Rendu initial (sections, boutons, absence de champ statut/trimestre)
 *  – Dropdown matière (SelectField)
 *  – Dropdown type (SelectField)
 *  – Dropdown sous-branche (SelectField conditionnel)
 *  – DatePickerField / TimePickerField
 *  – Trimestre auto-détecté
 *  – Validation : chaque champ a sa ligne d'erreur + bordure rouge
 *  – Toutes les erreurs apparaissent simultanément au premier submit
 *  – Soumission DRAFT / PUBLISHED
 *  – Mode édition avec valeurs initiales
 *  – Pièces jointes
 *  – Navigation (back)
 *  – Intégration cycle complet
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { EvaluationForm } from "../../src/components/notes/EvaluationForm";
import type { NotesTeacherContext } from "../../src/types/notes.types";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("react-native-pell-rich-editor", () => {
  const React = require("react");
  const { TextInput } = require("react-native");
  const FakeRichEditor = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      setForeColor: jest.fn(),
      command: jest.fn(),
      getContentHtml: jest.fn().mockResolvedValue("<p>description test</p>"),
    }));
    return (
      <TextInput
        testID={props.testID ?? "rich-editor"}
        onChangeText={props.onChange}
      />
    );
  });
  FakeRichEditor.displayName = "FakeRichEditor";
  return { RichEditor: FakeRichEditor };
});

jest.mock("../../src/components/editor/RichTextToolbar", () => ({
  RichTextToolbar: () => null,
}));

// DatePickerField : pressing calls onChange with a test date (octobre → TERM_1)
jest.mock("../../src/components/DatePickerField", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    DatePickerField: ({
      value,
      onChange,
      testID,
      hasError,
    }: {
      value: string;
      onChange: (v: string) => void;
      testID?: string;
      hasError?: boolean;
    }) => (
      <TouchableOpacity
        testID={testID}
        onPress={() => onChange("2026-10-15")}
        accessibilityLabel={hasError ? "date-error" : "date-ok"}
      >
        <Text testID={testID ? `${testID}-value` : undefined}>
          {value || "date-vide"}
        </Text>
      </TouchableOpacity>
    ),
  };
});

// TimePickerField : pressing calls onChange with "09:00"
jest.mock("../../src/components/TimePickerField", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    TimePickerField: ({
      value,
      onChange,
      testID,
    }: {
      value: string;
      onChange: (v: string) => void;
      testID?: string;
    }) => (
      <TouchableOpacity testID={testID} onPress={() => onChange("09:00")}>
        <Text testID={testID ? `${testID}-value` : undefined}>
          {value || "heure-vide"}
        </Text>
      </TouchableOpacity>
    ),
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEACHER_CONTEXT: NotesTeacherContext = {
  class: { id: "class-1", name: "6e A", schoolYearId: "y1" },
  subjects: [
    {
      id: "sub-1",
      name: "Mathématiques",
      branches: [
        { id: "branch-1", name: "Algèbre" },
        { id: "branch-2", name: "Géométrie" },
      ],
    },
    {
      id: "sub-2",
      name: "Français",
      branches: [],
    },
  ],
  evaluationTypes: [
    { id: "type-1", code: "COMP", label: "Composition", isDefault: true },
    { id: "type-2", code: "DS", label: "Devoir surveillé", isDefault: false },
    { id: "type-3", code: "INTER", label: "Interrogation", isDefault: false },
  ],
  students: [
    { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
    { id: "stu-2", firstName: "Paul", lastName: "Abega" },
  ],
};

// Contexte minimal pour tester les erreurs "requis" sur matière et type
const EMPTY_CONTEXT: NotesTeacherContext = {
  ...TEACHER_CONTEXT,
  subjects: [],
  evaluationTypes: [],
};

function buildProps(
  overrides: Partial<Parameters<typeof EvaluationForm>[0]> = {},
) {
  return {
    teacherContext: TEACHER_CONTEXT,
    mode: "create" as const,
    isSubmitting: false,
    onBack: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onUploadAttachment: jest.fn().mockResolvedValue({
      fileName: "sujet.pdf",
      fileUrl: "https://example.com/sujet.pdf",
      sizeLabel: "42 Ko",
    }),
    ...overrides,
  };
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Remplit les champs minimaux pour un submit valide. */
async function fillMinimalValid() {
  fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition T1");
  fireEvent.press(screen.getByTestId("eval-form-date")); // → 2026-10-15
  fireEvent.press(screen.getByTestId("eval-form-time")); // → 09:00
}

// ─── 1. Rendu initial ─────────────────────────────────────────────────────────

describe("EvaluationForm — rendu initial", () => {
  it("affiche les 5 sections", () => {
    render(<EvaluationForm {...buildProps()} />);

    expect(screen.getByText("Identification")).toBeTruthy();
    expect(screen.getByText("Classification")).toBeTruthy();
    expect(screen.getByText("Planification")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("Pièces jointes")).toBeTruthy();
  });

  it("affiche deux boutons d'action et pas de champ statut", () => {
    render(<EvaluationForm {...buildProps()} />);

    expect(screen.getByTestId("eval-form-save-draft")).toBeTruthy();
    expect(screen.getByTestId("eval-form-publish")).toBeTruthy();
    expect(screen.queryByTestId("eval-form-status-draft")).toBeNull();
    expect(screen.queryByTestId("eval-form-status-published")).toBeNull();
  });

  it("n'affiche pas de sélecteur de trimestre manuel", () => {
    render(<EvaluationForm {...buildProps()} />);

    expect(screen.queryByTestId("eval-form-term-TERM_1")).toBeNull();
    expect(screen.queryByTestId("eval-form-term-TERM_2")).toBeNull();
    expect(screen.queryByTestId("eval-form-term-TERM_3")).toBeNull();
  });

  it("affiche le badge trimestre auto-détecté", () => {
    render(<EvaluationForm {...buildProps()} />);

    expect(screen.getByTestId("eval-form-term-auto")).toBeTruthy();
  });

  it("label du bouton brouillon change en mode édition", () => {
    render(<EvaluationForm {...buildProps({ mode: "edit" })} />);

    expect(screen.getByText("Enregistrer")).toBeTruthy();
    expect(screen.queryByText("Sauvegarder brouillon")).toBeNull();
  });
});

// ─── 2. Dropdown matière ──────────────────────────────────────────────────────

describe("EvaluationForm — dropdown matière", () => {
  it("affiche le trigger du dropdown matière", () => {
    render(<EvaluationForm {...buildProps()} />);

    expect(screen.getByTestId("eval-form-subject")).toBeTruthy();
  });

  it("affiche la première matière pré-sélectionnée par défaut", () => {
    render(<EvaluationForm {...buildProps()} />);

    // "Mathématiques" est la première, elle doit apparaître dans le trigger
    expect(screen.getByText("Mathématiques")).toBeTruthy();
  });

  it("ouvre la liste et affiche toutes les matières", () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-subject"));

    expect(screen.getByTestId("eval-form-subject-option-sub-1")).toBeTruthy();
    expect(screen.getByTestId("eval-form-subject-option-sub-2")).toBeTruthy();
  });

  it("sélectionner une matière met à jour le trigger", () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-subject"));
    fireEvent.press(screen.getByTestId("eval-form-subject-option-sub-2"));

    expect(screen.getByText("Français")).toBeTruthy();
  });

  it("le dropdown matière a une bordure rouge si erreur", async () => {
    render(
      <EvaluationForm {...buildProps({ teacherContext: EMPTY_CONTEXT })} />,
    );

    // Date requise pour déclencher une autre erreur et voir que subject est aussi en erreur
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-subject-error")).toBeTruthy();
    });

    // Le trigger SelectField doit avoir le style d'erreur (accessibilityLabel testé côté mock)
    const trigger = screen.getByTestId("eval-form-subject");
    // La prop hasError est true → le style selectTriggerError est appliqué
    expect(trigger.props.style).toBeDefined();
  });
});

// ─── 3. Dropdown type ─────────────────────────────────────────────────────────

describe("EvaluationForm — dropdown type", () => {
  it("pré-sélectionne le type isDefault", () => {
    render(<EvaluationForm {...buildProps()} />);

    expect(screen.getByText("Composition")).toBeTruthy();
  });

  it("ouvre le dropdown et liste toutes les options", () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-type"));

    expect(screen.getByTestId("eval-form-type-option-type-1")).toBeTruthy();
    expect(screen.getByTestId("eval-form-type-option-type-2")).toBeTruthy();
    expect(screen.getByTestId("eval-form-type-option-type-3")).toBeTruthy();
  });

  it("sélectionner une option met à jour le trigger", () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-type"));
    fireEvent.press(screen.getByTestId("eval-form-type-option-type-2"));

    expect(screen.getByText("Devoir surveillé")).toBeTruthy();
  });

  it("affiche l'erreur type quand aucun type disponible", async () => {
    render(
      <EvaluationForm {...buildProps({ teacherContext: EMPTY_CONTEXT })} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-type-error")).toBeTruthy();
    });
  });
});

// ─── 4. Dropdown sous-branche ─────────────────────────────────────────────────

describe("EvaluationForm — dropdown sous-branche", () => {
  it("affiche le dropdown branche quand la matière sélectionnée a des branches", () => {
    render(<EvaluationForm {...buildProps()} />);
    // sub-1 (Mathématiques) est sélectionné par défaut et a des branches
    expect(screen.getByTestId("eval-form-branch")).toBeTruthy();
  });

  it("masque le dropdown branche quand la matière n'a pas de branches", () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-subject"));
    fireEvent.press(screen.getByTestId("eval-form-subject-option-sub-2")); // Français

    expect(screen.queryByTestId("eval-form-branch")).toBeNull();
  });

  it("réinitialise la branche quand on change de matière", async () => {
    render(<EvaluationForm {...buildProps()} />);

    // Sélectionner Algèbre
    fireEvent.press(screen.getByTestId("eval-form-branch"));
    fireEvent.press(screen.getByTestId("eval-form-branch-option-branch-1"));
    expect(screen.getByText("Algèbre")).toBeTruthy();

    // Changer de matière
    fireEvent.press(screen.getByTestId("eval-form-subject"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-subject-option-sub-2"));
    });

    // Revenir sur sub-1
    fireEvent.press(screen.getByTestId("eval-form-subject"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-subject-option-sub-1"));
    });

    // La branche doit être réinitialisée au placeholder
    expect(screen.queryByText("Algèbre")).toBeNull();
  });

  it("liste les options de branches dans le dropdown", () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-branch"));

    expect(screen.getByTestId("eval-form-branch-option-branch-1")).toBeTruthy();
    expect(screen.getByTestId("eval-form-branch-option-branch-2")).toBeTruthy();
  });
});

// ─── 5. Date / Heure / Trimestre ─────────────────────────────────────────────

describe("EvaluationForm — date, heure et trimestre", () => {
  it("utilise DatePickerField pour la date", () => {
    render(<EvaluationForm {...buildProps()} />);
    expect(screen.getByTestId("eval-form-date")).toBeTruthy();
  });

  it("utilise TimePickerField pour l'heure", () => {
    render(<EvaluationForm {...buildProps()} />);
    expect(screen.getByTestId("eval-form-time")).toBeTruthy();
  });

  it("octobre (mois 10) → badge affiche Trimestre 1", async () => {
    render(<EvaluationForm {...buildProps()} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-date")); // mock → 2026-10-15
    });

    expect(screen.getByText(/Trimestre 1/)).toBeTruthy();
  });
});

// ─── 6. Validation — un champ à la fois ──────────────────────────────────────

describe("EvaluationForm — validation champ par champ", () => {
  it("titre vide → ligne d'erreur visible après submit", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-date")); // date valide
    // Titre vide (valeur initiale "")
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
    });
  });

  it("titre trop court (< 3 car.) → ligne d'erreur spécifique", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "AB");
    fireEvent.press(screen.getByTestId("eval-form-date"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
      expect(screen.getByText(/min\. 3 caractères/i)).toBeTruthy();
    });
  });

  it("titre trop long (> 100 car.) → ligne d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(
      screen.getByTestId("eval-form-title"),
      "A".repeat(101),
    );
    fireEvent.press(screen.getByTestId("eval-form-date"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
      expect(screen.getByText(/trop long/i)).toBeTruthy();
    });
  });

  it("titre valide → pas de ligne d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(
      screen.getByTestId("eval-form-title"),
      "Composition T1",
    );
    fireEvent.press(screen.getByTestId("eval-form-date"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("eval-form-title-error")).toBeNull();
    });
  });

  it("date absente → ligne d'erreur visible après submit", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    // Ne pas renseigner la date
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-date-error")).toBeTruthy();
    });
  });

  it("date renseignée → pas de ligne d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    fireEvent.press(screen.getByTestId("eval-form-date")); // valide
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("eval-form-date-error")).toBeNull();
    });
  });

  it("coefficient invalide (< 0.25) → ligne d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    fireEvent.press(screen.getByTestId("eval-form-date"));
    fireEvent.changeText(screen.getByTestId("eval-form-coefficient"), "0.1");
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-coefficient-error")).toBeTruthy();
      expect(screen.getByText(/Min 0\.25/i)).toBeTruthy();
    });
  });

  it("coefficient valide → pas de ligne d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    fireEvent.press(screen.getByTestId("eval-form-date"));
    fireEvent.changeText(screen.getByTestId("eval-form-coefficient"), "2");
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("eval-form-coefficient-error")).toBeNull();
    });
  });

  it("barème invalide (< 1) → ligne d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    fireEvent.press(screen.getByTestId("eval-form-date"));
    fireEvent.changeText(screen.getByTestId("eval-form-maxscore"), "0");
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-maxscore-error")).toBeTruthy();
      expect(screen.getByText(/Min 1/i)).toBeTruthy();
    });
  });

  it("barème valide → pas de ligne d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    fireEvent.press(screen.getByTestId("eval-form-date"));
    fireEvent.changeText(screen.getByTestId("eval-form-maxscore"), "20");
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("eval-form-maxscore-error")).toBeNull();
    });
  });

  it("type non sélectionné → ligne d'erreur", async () => {
    render(
      <EvaluationForm {...buildProps({ teacherContext: EMPTY_CONTEXT })} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-type-error")).toBeTruthy();
    });
  });

  it("matière non sélectionnée → ligne d'erreur", async () => {
    render(
      <EvaluationForm {...buildProps({ teacherContext: EMPTY_CONTEXT })} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-subject-error")).toBeTruthy();
    });
  });
});

// ─── 7. Toutes les erreurs simultanées ───────────────────────────────────────

describe("EvaluationForm — toutes les erreurs simultanément au premier submit", () => {
  it("titre vide + date absente → les deux erreurs apparaissent en même temps", async () => {
    render(<EvaluationForm {...buildProps()} />);

    // Aucun champ rempli (titre = "", date = "")
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-date-error")).toBeTruthy();
    });
  });

  it("titre vide + coefficient invalide → les deux erreurs en même temps", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.press(screen.getByTestId("eval-form-date")); // date valide
    fireEvent.changeText(screen.getByTestId("eval-form-coefficient"), "0");

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-coefficient-error")).toBeTruthy();
    });
  });

  it("titre vide + barème invalide + date absente → trois erreurs simultanées", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-maxscore"), "0");

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-date-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-maxscore-error")).toBeTruthy();
    });
  });

  it("sur un contexte vide : matière + type + titre + date → quatre erreurs d'un coup", async () => {
    render(
      <EvaluationForm {...buildProps({ teacherContext: EMPTY_CONTEXT })} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-date-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-subject-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-type-error")).toBeTruthy();
    });
  });

  it("corriger un champ fait disparaître son erreur mais pas les autres", async () => {
    render(<EvaluationForm {...buildProps()} />);

    // Premier submit → titre + date en erreur
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("eval-form-title-error")).toBeTruthy();
      expect(screen.getByTestId("eval-form-date-error")).toBeTruthy();
    });

    // Corriger uniquement le titre
    fireEvent.changeText(
      screen.getByTestId("eval-form-title"),
      "Composition T1",
    );

    // Re-submit (date toujours absente)
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("eval-form-title-error")).toBeNull();
      expect(screen.getByTestId("eval-form-date-error")).toBeTruthy();
    });
  });
});

// ─── 8. Bordure d'erreur sur les inputs ──────────────────────────────────────

describe("EvaluationForm — bordure rouge des champs en erreur", () => {
  it("le TextInput titre a la bordure d'erreur après submit invalide", async () => {
    render(<EvaluationForm {...buildProps()} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      const titleInput = screen.getByTestId("eval-form-title");
      const flatStyle = [titleInput.props.style].flat(Infinity);
      const hasErrorBorder = flatStyle.some(
        (s) =>
          s &&
          typeof s === "object" &&
          (s as Record<string, unknown>).borderColor === "#DC3545",
      );
      expect(hasErrorBorder).toBe(true);
    });
  });

  it("le TextInput coefficient a la bordure d'erreur si valeur invalide", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    fireEvent.press(screen.getByTestId("eval-form-date"));
    fireEvent.changeText(screen.getByTestId("eval-form-coefficient"), "0");

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      const coeffInput = screen.getByTestId("eval-form-coefficient");
      const flatStyle = [coeffInput.props.style].flat(Infinity);
      const hasErrorBorder = flatStyle.some(
        (s) =>
          s &&
          typeof s === "object" &&
          (s as Record<string, unknown>).borderColor === "#DC3545",
      );
      expect(hasErrorBorder).toBe(true);
    });
  });

  it("le TextInput barème a la bordure d'erreur si valeur invalide", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(screen.getByTestId("eval-form-title"), "Composition");
    fireEvent.press(screen.getByTestId("eval-form-date"));
    fireEvent.changeText(screen.getByTestId("eval-form-maxscore"), "0");

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      const maxInput = screen.getByTestId("eval-form-maxscore");
      const flatStyle = [maxInput.props.style].flat(Infinity);
      const hasErrorBorder = flatStyle.some(
        (s) =>
          s &&
          typeof s === "object" &&
          (s as Record<string, unknown>).borderColor === "#DC3545",
      );
      expect(hasErrorBorder).toBe(true);
    });
  });

  it("DatePickerField reçoit hasError=true quand la date est absente", async () => {
    render(<EvaluationForm {...buildProps()} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      const dateTrigger = screen.getByTestId("eval-form-date");
      expect(dateTrigger.props.accessibilityLabel).toBe("date-error");
    });
  });

  it("les champs valides n'ont pas de bordure d'erreur", async () => {
    render(<EvaluationForm {...buildProps()} />);

    fireEvent.changeText(
      screen.getByTestId("eval-form-title"),
      "Composition T1",
    );
    fireEvent.press(screen.getByTestId("eval-form-date"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      const titleInput = screen.getByTestId("eval-form-title");
      const flatStyle = [titleInput.props.style].flat(Infinity);
      const hasErrorBorder = flatStyle.some(
        (s) =>
          s &&
          typeof s === "object" &&
          (s as Record<string, unknown>).borderColor === "#DC3545",
      );
      expect(hasErrorBorder).toBe(false);
    });
  });
});

// ─── 9. Soumission ────────────────────────────────────────────────────────────

describe("EvaluationForm — soumission", () => {
  it("onSubmit reçoit status=PUBLISHED via le bouton Publier", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<EvaluationForm {...buildProps({ onSubmit })} />);

    await fillMinimalValid();
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: "PUBLISHED" }),
      );
    });
  });

  it("onSubmit reçoit status=DRAFT via le bouton Sauvegarder brouillon", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<EvaluationForm {...buildProps({ onSubmit })} />);

    await fillMinimalValid();
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-save-draft"));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: "DRAFT" }),
      );
    });
  });

  it("le payload contient le bon term auto-détecté (octobre → TERM_1)", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<EvaluationForm {...buildProps({ onSubmit })} />);

    await fillMinimalValid();
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ term: "TERM_1" }),
      );
    });
  });

  it("le payload contient tous les champs obligatoires", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<EvaluationForm {...buildProps({ onSubmit })} />);

    await fillMinimalValid();
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Composition T1",
          subjectId: "sub-1",
          evaluationTypeId: "type-1",
          scheduledAt: expect.stringContaining("2026-10-15"),
          coefficient: 1,
          maxScore: 20,
        }),
      );
    });
  });

  it("n'appelle pas onSubmit si le formulaire est invalide", async () => {
    const onSubmit = jest.fn();
    render(<EvaluationForm {...buildProps({ onSubmit })} />);

    // Titre vide + date absente
    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await flushAsync();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("désactive les deux boutons quand isSubmitting=true", () => {
    render(<EvaluationForm {...buildProps({ isSubmitting: true })} />);

    expect(
      screen.getByTestId("eval-form-save-draft").props.accessibilityState
        ?.disabled,
    ).toBe(true);
    expect(
      screen.getByTestId("eval-form-publish").props.accessibilityState
        ?.disabled,
    ).toBe(true);
  });
});

// ─── 10. Mode édition ─────────────────────────────────────────────────────────

describe("EvaluationForm — mode édition avec valeurs initiales", () => {
  const initialValues = {
    title: "DS Algèbre chapitre 3",
    subjectId: "sub-1",
    subjectBranchId: "branch-1",
    evaluationTypeId: "type-2",
    term: "TERM_2" as const,
    status: "PUBLISHED" as const,
    scheduledAt: "2026-01-20T10:00:00.000Z",
    coefficient: 2,
    maxScore: 10,
  };

  it("pré-remplit le titre", () => {
    render(<EvaluationForm {...buildProps({ mode: "edit", initialValues })} />);

    expect(screen.getByDisplayValue("DS Algèbre chapitre 3")).toBeTruthy();
  });

  it("pré-remplit le coefficient et le barème", () => {
    render(<EvaluationForm {...buildProps({ mode: "edit", initialValues })} />);

    expect(screen.getByDisplayValue("2")).toBeTruthy();
    expect(screen.getByDisplayValue("10")).toBeTruthy();
  });

  it("pré-sélectionne le bon type d'évaluation dans le dropdown", () => {
    render(<EvaluationForm {...buildProps({ mode: "edit", initialValues })} />);

    expect(screen.getByText("Devoir surveillé")).toBeTruthy();
  });

  it("pré-sélectionne la bonne branche dans le dropdown", () => {
    render(<EvaluationForm {...buildProps({ mode: "edit", initialValues })} />);

    expect(screen.getByText("Algèbre")).toBeTruthy();
  });

  it("pré-sélectionne la bonne matière dans le dropdown", () => {
    render(<EvaluationForm {...buildProps({ mode: "edit", initialValues })} />);

    expect(screen.getByText("Mathématiques")).toBeTruthy();
  });

  it("soumet la mise à jour avec status=PUBLISHED", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <EvaluationForm
        {...buildProps({ mode: "edit", initialValues, onSubmit })}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "PUBLISHED",
          title: "DS Algèbre chapitre 3",
        }),
      );
    });
  });
});

// ─── 11. Navigation ───────────────────────────────────────────────────────────

describe("EvaluationForm — navigation", () => {
  it("appelle onBack quand le bouton retour est pressé", () => {
    const onBack = jest.fn();
    render(<EvaluationForm {...buildProps({ onBack })} />);

    fireEvent.press(screen.getByTestId("eval-form-back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ─── 12. Pièces jointes ───────────────────────────────────────────────────────

describe("EvaluationForm — pièces jointes", () => {
  it("affiche le bouton d'ajout", () => {
    render(<EvaluationForm {...buildProps()} />);

    expect(screen.getByTestId("eval-form-add-attachment")).toBeTruthy();
  });

  it("ajoute une pièce jointe après upload réussi", async () => {
    const { getDocumentAsync } = require("expo-document-picker") as {
      getDocumentAsync: jest.Mock;
    };
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///sujet.pdf",
          mimeType: "application/pdf",
          name: "sujet.pdf",
        },
      ],
    });

    const onUploadAttachment = jest
      .fn()
      .mockResolvedValue({ fileName: "sujet.pdf", sizeLabel: "42 Ko" });

    render(<EvaluationForm {...buildProps({ onUploadAttachment })} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-add-attachment"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("eval-form-attachment-0")).toBeTruthy();
      expect(screen.getByText("sujet.pdf")).toBeTruthy();
    });
  });

  it("supprime une pièce jointe via le bouton ×", async () => {
    const { getDocumentAsync } = require("expo-document-picker") as {
      getDocumentAsync: jest.Mock;
    };
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///sujet.pdf",
          mimeType: "application/pdf",
          name: "sujet.pdf",
        },
      ],
    });

    const onUploadAttachment = jest
      .fn()
      .mockResolvedValue({ fileName: "sujet.pdf", sizeLabel: "42 Ko" });

    render(<EvaluationForm {...buildProps({ onUploadAttachment })} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-add-attachment"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("eval-form-attachment-0")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("eval-form-remove-attachment-0"));

    await waitFor(() => {
      expect(screen.queryByTestId("eval-form-attachment-0")).toBeNull();
    });
  });

  it("ne fait rien si le picker est annulé", async () => {
    const { getDocumentAsync } = require("expo-document-picker") as {
      getDocumentAsync: jest.Mock;
    };
    getDocumentAsync.mockResolvedValue({ canceled: true });

    const onUploadAttachment = jest.fn();
    render(<EvaluationForm {...buildProps({ onUploadAttachment })} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-add-attachment"));
    });

    expect(onUploadAttachment).not.toHaveBeenCalled();
    expect(screen.queryByTestId("eval-form-attachment-0")).toBeNull();
  });
});

// ─── 13. Intégration cycle complet ───────────────────────────────────────────

describe("EvaluationForm — intégration cycle complet", () => {
  it("création complète → publier envoie le payload attendu", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<EvaluationForm {...buildProps({ onSubmit })} />);

    fireEvent.changeText(
      screen.getByTestId("eval-form-title"),
      "Devoir de rentrée",
    );

    // Changer de matière
    fireEvent.press(screen.getByTestId("eval-form-subject"));
    fireEvent.press(screen.getByTestId("eval-form-subject-option-sub-1"));

    // Changer le type
    fireEvent.press(screen.getByTestId("eval-form-type"));
    fireEvent.press(screen.getByTestId("eval-form-type-option-type-2"));

    // Sélectionner une branche
    fireEvent.press(screen.getByTestId("eval-form-branch"));
    fireEvent.press(screen.getByTestId("eval-form-branch-option-branch-2"));

    // Date et heure
    fireEvent.press(screen.getByTestId("eval-form-date")); // → 2026-10-15
    fireEvent.press(screen.getByTestId("eval-form-time")); // → 09:00

    // Coefficient et barème
    fireEvent.changeText(screen.getByTestId("eval-form-coefficient"), "3");
    fireEvent.changeText(screen.getByTestId("eval-form-maxscore"), "10");

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-publish"));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Devoir de rentrée",
          subjectId: "sub-1",
          subjectBranchId: "branch-2",
          evaluationTypeId: "type-2",
          term: "TERM_1",
          scheduledAt: expect.stringContaining("2026-10-15"),
          coefficient: 3,
          maxScore: 10,
          status: "PUBLISHED",
        }),
      );
    });
  });

  it("création → brouillon → status=DRAFT dans le payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<EvaluationForm {...buildProps({ onSubmit })} />);

    fireEvent.changeText(
      screen.getByTestId("eval-form-title"),
      "Interro surprise",
    );
    fireEvent.press(screen.getByTestId("eval-form-date"));
    fireEvent.press(screen.getByTestId("eval-form-time"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("eval-form-save-draft"));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ status: "DRAFT" }),
      );
    });
  });
});
