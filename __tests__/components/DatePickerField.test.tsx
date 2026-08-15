/**
 * Tests pour DatePickerField
 *
 * Couvre :
 * - rendu du trigger (placeholder, date formatée, disabled)
 * - structure de la grille : lignes de 7 cellules exactes (régression bug flexWrap)
 * - positionnement correct des jours dans la grille (lun. 29 juin 2026 → colonne 0)
 * - sélection d'une date et confirmation (onChange)
 * - annulation sans changement
 * - date pré-sélectionnée à l'ouverture
 * - navigation entre mois
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { DatePickerField } from "../../src/components/DatePickerField";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

// Helpers

function renderPicker(
  overrides: Partial<React.ComponentProps<typeof DatePickerField>> = {},
) {
  const onChange = jest.fn();
  render(
    <DatePickerField value="" onChange={onChange} testID="dp" {...overrides} />,
  );
  return { onChange };
}

async function openPicker(
  overrides: Partial<React.ComponentProps<typeof DatePickerField>> = {},
) {
  const { onChange } = renderPicker(overrides);
  fireEvent.press(screen.getByTestId("dp"));
  await waitFor(() => expect(screen.getByTestId("dp-modal")).toBeTruthy());
  return { onChange };
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

describe("DatePickerField — trigger", () => {
  it("affiche le placeholder quand value est vide", () => {
    renderPicker({ placeholder: "Choisir une date" });
    expect(screen.getByText("Choisir une date")).toBeTruthy();
  });

  it("affiche la date formatée quand value est définie", () => {
    renderPicker({ value: "2026-06-29" });
    // "lun. 29 juin 2026" attendu (fr-FR, weekday short)
    expect(screen.getByText(/29 juin 2026/)).toBeTruthy();
  });

  it("n'ouvre pas la modal si disabled", async () => {
    renderPicker({ disabled: true });
    fireEvent.press(screen.getByTestId("dp"));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId("dp-modal")).toBeNull();
  });

  it("n'affiche pas le modal au montage", () => {
    renderPicker();
    expect(screen.queryByTestId("dp-modal")).toBeNull();
  });
});

// ─── Structure de la grille ───────────────────────────────────────────────────
// Les lignes ont des testID dp-row-N, les cellules dp-day-YYYY-MM-DD.
// On utilise within() pour vérifier l'appartenance d'un jour à une ligne.

describe("DatePickerField — structure de la grille (juin 2026)", () => {
  beforeEach(async () => {
    await openPicker({ value: "2026-06-29" });
  });

  it("toutes les lignes ont exactement 7 cellules", () => {
    // La grille de juin 2026 (leading=0) a 5 lignes
    for (let r = 0; r < 5; r++) {
      const row = screen.getByTestId(`dp-row-${r}`);
      expect(row.children).toHaveLength(7);
    }
  });

  it("toutes les dates de juin sont accessibles (1 à 30)", () => {
    for (let day = 1; day <= 30; day++) {
      const iso = `2026-06-${String(day).padStart(2, "0")}`;
      expect(screen.getByTestId(`dp-day-${iso}`)).toBeTruthy();
    }
  });

  it("june 29 (lundi) et june 30 (mardi) sont dans la même ligne", () => {
    // June 2026 : leading=0, row 4 = jours 29-30
    const row4 = screen.getByTestId("dp-row-4");
    expect(within(row4).getByTestId("dp-day-2026-06-29")).toBeTruthy();
    expect(within(row4).getByTestId("dp-day-2026-06-30")).toBeTruthy();
  });

  it("june 28 (dimanche) est dans la ligne précédant june 29 (lundi)", () => {
    const row3 = screen.getByTestId("dp-row-3");
    const row4 = screen.getByTestId("dp-row-4");
    expect(within(row3).getByTestId("dp-day-2026-06-28")).toBeTruthy();
    expect(within(row4).getByTestId("dp-day-2026-06-29")).toBeTruthy();
    // June 28 n'est pas dans row4
    expect(within(row4).queryByTestId("dp-day-2026-06-28")).toBeNull();
  });

  it("june 1 (lundi) et june 7 (dimanche) sont dans la même ligne", () => {
    const row0 = screen.getByTestId("dp-row-0");
    expect(within(row0).getByTestId("dp-day-2026-06-01")).toBeTruthy();
    expect(within(row0).getByTestId("dp-day-2026-06-07")).toBeTruthy();
  });

  it("june 7 (dimanche) et june 8 (lundi) sont dans des lignes différentes", () => {
    const row0 = screen.getByTestId("dp-row-0");
    const row1 = screen.getByTestId("dp-row-1");
    expect(within(row0).getByTestId("dp-day-2026-06-07")).toBeTruthy();
    expect(within(row1).getByTestId("dp-day-2026-06-08")).toBeTruthy();
    expect(within(row1).queryByTestId("dp-day-2026-06-07")).toBeNull();
  });

  it("june 1 est dans la première cellule de la ligne 0 (pas de nulls avant)", () => {
    // June 1 = lundi → leading=0, cellule index 0
    const row0 = screen.getByTestId("dp-row-0");
    expect(row0.children[0].props.testID).toBe("dp-day-2026-06-01");
  });

  it("june 29 est dans la première cellule de la ligne 4 (colonne lundi)", () => {
    const row4 = screen.getByTestId("dp-row-4");
    expect(row4.children[0].props.testID).toBe("dp-day-2026-06-29");
  });
});

// ─── Régression : mois avec leading nulls (octobre 2025, débute mercredi) ─────

describe("DatePickerField — structure de la grille (octobre 2025)", () => {
  beforeEach(async () => {
    await openPicker({ value: "2025-10-15" });
  });

  it("chaque ligne a exactement 7 cellules", () => {
    // Oct 2025 : leading=2, 5 lignes + 1 ligne partielle = 6 lignes max
    const row0 = screen.getByTestId("dp-row-0");
    expect(row0.children).toHaveLength(7);
    const row1 = screen.getByTestId("dp-row-1");
    expect(row1.children).toHaveLength(7);
  });

  it("oct 1 (mercredi) est dans la 3ème cellule de la ligne 0 (index 2)", () => {
    // Oct 1 = mercredi → leading=2, index 2 dans row 0
    const row0 = screen.getByTestId("dp-row-0");
    expect(row0.children[2].props.testID).toBe("dp-day-2025-10-01");
  });

  it("oct 5 (dimanche) est dans la 7ème cellule de sa ligne (index 6)", () => {
    const row0 = screen.getByTestId("dp-row-0");
    expect(row0.children[6].props.testID).toBe("dp-day-2025-10-05");
  });

  it("oct 5 (dimanche) et oct 6 (lundi) sont dans des lignes différentes", () => {
    const row0 = screen.getByTestId("dp-row-0");
    const row1 = screen.getByTestId("dp-row-1");
    expect(within(row0).getByTestId("dp-day-2025-10-05")).toBeTruthy();
    expect(within(row1).getByTestId("dp-day-2025-10-06")).toBeTruthy();
    expect(within(row0).queryByTestId("dp-day-2025-10-06")).toBeNull();
  });
});

// ─── Sélection et confirmation ────────────────────────────────────────────────

describe("DatePickerField — sélection et confirmation", () => {
  it("confirme une date sélectionnée et appelle onChange", async () => {
    const { onChange } = await openPicker({ value: "2026-06-29" });
    fireEvent.press(screen.getByTestId("dp-day-2026-06-15"));
    fireEvent.press(screen.getByTestId("dp-confirm"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("2026-06-15"));
  });

  it("annuler ne déclenche pas onChange", async () => {
    const { onChange } = await openPicker({ value: "2026-06-29" });
    fireEvent.press(screen.getByTestId("dp-day-2026-06-15"));
    fireEvent.press(screen.getByTestId("dp-cancel"));
    await waitFor(() => expect(screen.queryByTestId("dp-modal")).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("la date déjà sélectionnée est pré-choisie à l'ouverture", async () => {
    await openPicker({ value: "2026-06-29" });
    // La preview affiche la date sélectionnée
    expect(screen.getByTestId("dp-preview")).toBeTruthy();
    expect(screen.getByTestId("dp-preview").props.children).toMatch(/29/);
  });

  it("confirmer avec la date initiale appelle onChange avec la même valeur", async () => {
    const { onChange } = await openPicker({ value: "2026-06-29" });
    // Aucune nouvelle sélection — on confirme la date déjà choisie
    fireEvent.press(screen.getByTestId("dp-confirm"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("2026-06-29"));
  });
});

// ─── Navigation entre mois ────────────────────────────────────────────────────

describe("DatePickerField — navigation entre mois", () => {
  it("le mois suivant affiche les jours du mois suivant", async () => {
    await openPicker({ value: "2026-06-15" });
    // Aller à juillet
    fireEvent.press(screen.getByTestId("dp-next-month"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-day-2026-07-01")).toBeTruthy(),
    );
    // Juin ne doit plus être visible
    expect(screen.queryByTestId("dp-day-2026-06-15")).toBeNull();
  });

  it("le mois précédent affiche les jours du mois précédent", async () => {
    await openPicker({ value: "2026-06-15" });
    // Aller à mai
    fireEvent.press(screen.getByTestId("dp-prev-month"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-day-2026-05-01")).toBeTruthy(),
    );
    expect(screen.queryByTestId("dp-day-2026-06-15")).toBeNull();
  });

  it("les lignes du mois suivant ont aussi 7 cellules exactement", async () => {
    await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-next-month"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-day-2026-07-01")).toBeTruthy(),
    );
    // Juillet 2026 commence un mercredi (leading=2) → la ligne 0 a bien 7 cellules
    const row0 = screen.getByTestId("dp-row-0");
    expect(row0.children).toHaveLength(7);
  });
});

// ─── Sélecteur rapide année / mois (remonter 18 ans en arrière) ──────────────

describe("DatePickerField — sélecteur d'année", () => {
  it("appuyer sur le libellé du mois ouvre la grille des années", async () => {
    await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    // La grille des jours n'est plus affichée
    expect(screen.queryByTestId("dp-day-2026-06-15")).toBeNull();
  });

  it("la pagination des années permet de reculer par paquets de 12 ans (18 ans en 2 clics)", async () => {
    await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-prev-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2014")).toBeTruthy(),
    );
    expect(screen.getByTestId("dp-year-2008")).toBeTruthy();
  });

  it("sélectionner une année ouvre la grille des mois de cette année", async () => {
    await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-prev-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2008")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-year-2008"));
    await waitFor(() => expect(screen.getByTestId("dp-month-0")).toBeTruthy());
    expect(screen.getByText("2008")).toBeTruthy();
  });

  it("sélectionner un mois ouvre la grille des jours du mois choisi", async () => {
    await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-prev-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2008")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-year-2008"));
    await waitFor(() => expect(screen.getByTestId("dp-month-2")).toBeTruthy());
    // mars (index 2)
    fireEvent.press(screen.getByTestId("dp-month-2"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-day-2008-03-01")).toBeTruthy(),
    );
  });

  it("permet de sélectionner et confirmer une date née 18 ans plus tôt via année → mois → jour", async () => {
    const { onChange } = await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-prev-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2008")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-year-2008"));
    await waitFor(() => expect(screen.getByTestId("dp-month-8")).toBeTruthy());
    fireEvent.press(screen.getByTestId("dp-month-8")); // septembre
    await waitFor(() =>
      expect(screen.getByTestId("dp-day-2008-09-10")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-day-2008-09-10"));
    fireEvent.press(screen.getByTestId("dp-confirm"));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("2008-09-10"));
  });

  it("depuis la grille des mois, le libellé de l'année rouvre la grille des années", async () => {
    await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-year-2026"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-open-years-from-months")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-open-years-from-months"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
  });

  it("les flèches prev/next année depuis la grille des mois changent d'année", async () => {
    await openPicker({ value: "2026-06-15" });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-year-2026"));
    await waitFor(() => expect(screen.getByText("2026")).toBeTruthy());
    fireEvent.press(screen.getByTestId("dp-prev-year"));
    await waitFor(() => expect(screen.getByText("2025")).toBeTruthy());
  });

  it("réouvrir le picker réinitialise le mode sur la grille des jours", async () => {
    const onChange = jest.fn();
    const { unmount } = render(
      <DatePickerField value="2026-06-15" onChange={onChange} testID="dp" />,
    );
    fireEvent.press(screen.getByTestId("dp"));
    await waitFor(() => expect(screen.getByTestId("dp-modal")).toBeTruthy());
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2026")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-cancel"));
    await waitFor(() => expect(screen.queryByTestId("dp-modal")).toBeNull());

    fireEvent.press(screen.getByTestId("dp"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-day-2026-06-15")).toBeTruthy(),
    );
    unmount();
  });
});

// ─── Bornes minimumDate / maximumDate ─────────────────────────────────────────

describe("DatePickerField — bornes minimumDate / maximumDate", () => {
  it("désactive les jours postérieurs à maximumDate", async () => {
    await openPicker({
      value: "2026-06-15",
      maximumDate: new Date(2026, 5, 10),
    });
    const dayAfterMax = screen.getByTestId("dp-day-2026-06-15");
    expect(dayAfterMax.props.accessibilityState?.disabled).toBe(true);
  });

  it("n'affecte pas les jours antérieurs ou égaux à maximumDate", async () => {
    await openPicker({
      value: "2026-06-15",
      maximumDate: new Date(2026, 5, 10),
    });
    const dayBeforeMax = screen.getByTestId("dp-day-2026-06-05");
    expect(dayBeforeMax.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("désactive les années postérieures à maximumDate dans la grille des années", async () => {
    await openPicker({
      value: "2020-06-15",
      maximumDate: new Date(2020, 5, 10),
    });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2021")).toBeTruthy(),
    );
    expect(
      screen.getByTestId("dp-year-2021").props.accessibilityState?.disabled,
    ).toBe(true);
    expect(
      screen.getByTestId("dp-year-2020").props.accessibilityState?.disabled,
    ).toBeFalsy();
  });

  it("désactive les mois postérieurs à maximumDate dans la grille des mois de l'année courante", async () => {
    await openPicker({
      value: "2020-06-15",
      maximumDate: new Date(2020, 5, 10),
    });
    fireEvent.press(screen.getByTestId("dp-open-years"));
    await waitFor(() =>
      expect(screen.getByTestId("dp-year-2020")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("dp-year-2020"));
    await waitFor(() => expect(screen.getByTestId("dp-month-6")).toBeTruthy());
    // juillet (index 6) est après juin (maximumDate) → désactivé
    expect(
      screen.getByTestId("dp-month-6").props.accessibilityState?.disabled,
    ).toBe(true);
    // mai (index 4) reste sélectionnable
    expect(
      screen.getByTestId("dp-month-4").props.accessibilityState?.disabled,
    ).toBeFalsy();
  });
});
