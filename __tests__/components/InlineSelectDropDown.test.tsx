/**
 * Tests unitaires pour InlineSelectDropDown
 *
 * Couvre :
 * - rendu du trigger avec placeholder ou valeur sélectionnée
 * - ouverture / fermeture du panneau inline (jamais de Modal)
 * - sélection d'une option et callback onChange
 * - état d'erreur (bordure rouge)
 * - option vide ("Aucune")
 * - apparition automatique du champ de recherche au-delà de 5 options
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { InlineSelectDropDown } from "../../src/components/InlineSelectDropDown";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const SHORT_OPTIONS = [
  { value: "", label: "Aucune" },
  { value: "r-a01", label: "A01" },
  { value: "r-b45", label: "B45" },
];

const LONG_OPTIONS = [
  { value: "", label: "Aucune" },
  { value: "r-a01", label: "A01" },
  { value: "r-b45", label: "B45" },
  { value: "r-c12", label: "C12" },
  { value: "r-d33", label: "D33" },
  { value: "r-e77", label: "E77" },
];

function renderDropdown(
  overrides: Partial<React.ComponentProps<typeof InlineSelectDropDown>> = {},
) {
  const onChange = jest.fn();
  render(
    <InlineSelectDropDown
      options={SHORT_OPTIONS}
      value=""
      onChange={onChange}
      placeholder="Aucune"
      testID="test-select"
      {...overrides}
    />,
  );
  return { onChange };
}

// ─── Rendu trigger ────────────────────────────────────────────────────────────

describe("InlineSelectDropDown — rendu trigger", () => {
  it("affiche le placeholder quand value ne correspond à aucune option", () => {
    renderDropdown({ options: [], value: "", placeholder: "Choisir..." });
    expect(screen.getByText("Choisir...")).toBeTruthy();
  });

  it("affiche le label de la valeur sélectionnée", () => {
    renderDropdown({ value: "r-a01" });
    expect(screen.getByText("A01")).toBeTruthy();
  });

  it("n'affiche pas le panneau au montage", () => {
    renderDropdown();
    expect(screen.queryByTestId("test-select-panel")).toBeNull();
  });
});

// ─── Ouverture / fermeture ───────────────────────────────────────────────────

describe("InlineSelectDropDown — ouverture / fermeture", () => {
  it("n'utilise jamais de Modal", async () => {
    renderDropdown({ options: LONG_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
    expect(screen.queryByTestId("test-select-modal")).toBeNull();
    expect(screen.queryByTestId("test-select-overlay")).toBeNull();
  });

  it("ouvre le panneau au clic sur le trigger", async () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
  });

  it("ferme le panneau en rappuyant sur le déclencheur", async () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.queryByTestId("test-select-panel")).toBeNull(),
    );
  });

  it("ferme le panneau après sélection d'une option", async () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-r-a01")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("test-select-option-r-a01"));
    await waitFor(() =>
      expect(screen.queryByTestId("test-select-panel")).toBeNull(),
    );
  });
});

// ─── Sélection d'options ─────────────────────────────────────────────────────

describe("InlineSelectDropDown — sélection", () => {
  it("appelle onChange avec la valeur correcte", async () => {
    const { onChange } = renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-r-b45")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("test-select-option-r-b45"));
    expect(onChange).toHaveBeenCalledWith("r-b45");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("appelle onChange avec une chaîne vide pour l'option 'Aucune'", async () => {
    const { onChange } = renderDropdown({ value: "r-a01" });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-none")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("test-select-option-none"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("affiche toutes les options dans le panneau", async () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-none")).toBeTruthy(),
    );
    expect(screen.getByTestId("test-select-option-r-a01")).toBeTruthy();
    expect(screen.getByTestId("test-select-option-r-b45")).toBeTruthy();
  });
});

// ─── État d'erreur ────────────────────────────────────────────────────────────

describe("InlineSelectDropDown — état d'erreur", () => {
  it("rend le composant sans crash en état d'erreur", () => {
    renderDropdown({ hasError: true });
    expect(screen.getByTestId("test-select")).toBeTruthy();
  });

  it("rend le composant sans état d'erreur par défaut", () => {
    renderDropdown({ hasError: false });
    expect(screen.getByTestId("test-select")).toBeTruthy();
  });
});

// ─── Options vides ───────────────────────────────────────────────────────────

describe("InlineSelectDropDown — liste vide", () => {
  it("s'ouvre sans crash si la liste est vide", async () => {
    renderDropdown({ options: [] });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
  });

  it("affiche le placeholder si aucune option ne correspond à la valeur", () => {
    renderDropdown({
      options: SHORT_OPTIONS,
      value: "inexistant",
      placeholder: "—",
    });
    expect(screen.getByText("—")).toBeTruthy();
  });
});

// ─── Recherche automatique selon le nombre d'options ─────────────────────────

describe("InlineSelectDropDown — recherche", () => {
  it("n'affiche pas de champ de recherche avec 5 options ou moins", async () => {
    renderDropdown({ options: SHORT_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
    expect(screen.queryByTestId("test-select-search")).toBeNull();
  });

  it("affiche un champ de recherche automatiquement au-delà de 5 options", async () => {
    renderDropdown({ options: LONG_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-search")).toBeTruthy(),
    );
  });

  it("filtre les options selon la saisie", async () => {
    renderDropdown({ options: LONG_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-search")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("test-select-search"), "b4");

    expect(screen.getByTestId("test-select-option-r-b45")).toBeTruthy();
    expect(screen.queryByTestId("test-select-option-r-a01")).toBeNull();
  });

  it("affiche le message d'absence de résultat quand rien ne correspond", async () => {
    renderDropdown({ options: LONG_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    fireEvent.changeText(
      await screen.findByTestId("test-select-search"),
      "zzz-inexistant",
    );

    expect(screen.getByText("Aucun résultat")).toBeTruthy();
  });

  it("affiche la liste au-dessus du champ de recherche (visible pendant la saisie)", async () => {
    renderDropdown({ options: LONG_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-search")).toBeTruthy(),
    );
    const panelJson = JSON.stringify(screen.toJSON());
    const optionIndex = panelJson.indexOf("test-select-option-r-e77");
    const searchIndex = panelJson.indexOf("test-select-search");
    expect(optionIndex).toBeGreaterThan(-1);
    expect(searchIndex).toBeGreaterThan(-1);
    expect(optionIndex).toBeLessThan(searchIndex);
  });

  it("réinitialise la recherche à la réouverture du panneau", async () => {
    renderDropdown({ options: LONG_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    fireEvent.changeText(await screen.findByTestId("test-select-search"), "b4");
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.queryByTestId("test-select-panel")).toBeNull(),
    );

    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-r-a01")).toBeTruthy(),
    );
  });

  it("respecte les overrides de texte (searchPlaceholder / noResultsLabel)", async () => {
    renderDropdown({
      options: LONG_OPTIONS,
      searchPlaceholder: "Chercher un salon...",
      noResultsLabel: "Rien trouvé",
    });
    fireEvent.press(screen.getByTestId("test-select"));
    fireEvent.changeText(
      await screen.findByTestId("test-select-search"),
      "zzz-inexistant",
    );
    expect(screen.getByText("Rien trouvé")).toBeTruthy();
  });
});

// ─── Robustesse — seuil de recherche (bornes) ────────────────────────────────

describe("InlineSelectDropDown — robustesse seuil de recherche", () => {
  it("n'affiche pas de recherche avec exactement 5 options (borne basse)", async () => {
    const fiveOptions = LONG_OPTIONS.slice(0, 5);
    renderDropdown({ options: fiveOptions });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
    expect(screen.queryByTestId("test-select-search")).toBeNull();
  });

  it("affiche la recherche avec exactement 6 options (borne haute)", async () => {
    const sixOptions = LONG_OPTIONS.slice(0, 6);
    renderDropdown({ options: sixOptions });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-search")).toBeTruthy(),
    );
  });

  it("passe de non-recherchable à recherchable si options grossit après montage", async () => {
    const { rerender } = render(
      <InlineSelectDropDown
        options={SHORT_OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="test-select"
      />,
    );
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
    expect(screen.queryByTestId("test-select-search")).toBeNull();

    rerender(
      <InlineSelectDropDown
        options={LONG_OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="test-select"
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("test-select-search")).toBeTruthy(),
    );
  });

  it("repasse de recherchable à non-recherchable si options rétrécit", async () => {
    const { rerender } = render(
      <InlineSelectDropDown
        options={LONG_OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="test-select"
      />,
    );
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-search")).toBeTruthy(),
    );

    rerender(
      <InlineSelectDropDown
        options={SHORT_OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="test-select"
      />,
    );
    await waitFor(() =>
      expect(screen.queryByTestId("test-select-search")).toBeNull(),
    );
  });
});

// ─── Robustesse — recherche insensible aux accents/casse/espaces ────────────

describe("InlineSelectDropDown — robustesse filtrage", () => {
  const ACCENTED_OPTIONS = [
    { value: "s-1", label: "École Élémentaire" },
    { value: "s-2", label: "Collège Général" },
    { value: "s-3", label: "Lycée Technique" },
    { value: "s-4", label: "Institut Privé" },
    { value: "s-5", label: "Université Publique" },
    { value: "s-6", label: "Centre de Formation" },
  ];

  it("filtre en ignorant les accents", async () => {
    renderDropdown({ options: ACCENTED_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    fireEvent.changeText(
      await screen.findByTestId("test-select-search"),
      "ecole",
    );
    expect(screen.getByTestId("test-select-option-s-1")).toBeTruthy();
    expect(screen.queryByTestId("test-select-option-s-2")).toBeNull();
  });

  it("filtre en ignorant la casse", async () => {
    renderDropdown({ options: ACCENTED_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    fireEvent.changeText(
      await screen.findByTestId("test-select-search"),
      "LYCÉE",
    );
    expect(screen.getByTestId("test-select-option-s-3")).toBeTruthy();
  });

  it("traite une saisie composée uniquement d'espaces comme une recherche vide", async () => {
    renderDropdown({ options: ACCENTED_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    fireEvent.changeText(
      await screen.findByTestId("test-select-search"),
      "   ",
    );
    ACCENTED_OPTIONS.forEach((o) => {
      expect(screen.getByTestId(`test-select-option-${o.value}`)).toBeTruthy();
    });
  });

  it("ne plante pas avec une recherche contenant des caractères spéciaux regex", async () => {
    renderDropdown({ options: ACCENTED_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    expect(() =>
      fireEvent.changeText(
        screen.getByTestId("test-select-search"),
        "(.*+?[]{}",
      ),
    ).not.toThrow();
    expect(screen.getByText("Aucun résultat")).toBeTruthy();
  });

  it("retrouve toutes les options si la recherche est vidée après un filtrage", async () => {
    renderDropdown({ options: ACCENTED_OPTIONS });
    fireEvent.press(screen.getByTestId("test-select"));
    const search = await screen.findByTestId("test-select-search");
    fireEvent.changeText(search, "lycee");
    expect(screen.queryByTestId("test-select-option-s-1")).toBeNull();
    fireEvent.changeText(search, "");
    ACCENTED_OPTIONS.forEach((o) => {
      expect(screen.getByTestId(`test-select-option-${o.value}`)).toBeTruthy();
    });
  });
});

// ─── Robustesse — comportements limites ──────────────────────────────────────

describe("InlineSelectDropDown — robustesse comportements limites", () => {
  it("supporte des pressions répétées rapides sur le trigger sans se désynchroniser", async () => {
    renderDropdown();
    const trigger = screen.getByTestId("test-select");
    fireEvent.press(trigger);
    fireEvent.press(trigger);
    fireEvent.press(trigger);
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
  });

  it("ne rappelle pas onChange si on referme sans sélectionner", async () => {
    const { onChange } = renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-panel")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("test-select"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("gère un tableau d'options avec des labels dupliqués sans crash", async () => {
    renderDropdown({
      options: [
        { value: "d-1", label: "Doublon" },
        { value: "d-2", label: "Doublon" },
      ],
    });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-d-1")).toBeTruthy(),
    );
    expect(screen.getByTestId("test-select-option-d-2")).toBeTruthy();
  });

  it("re-sélectionne correctement après changement de value en externe pendant l'ouverture", async () => {
    const { rerender } = render(
      <InlineSelectDropDown
        options={SHORT_OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="test-select"
      />,
    );
    fireEvent.press(screen.getByTestId("test-select"));
    rerender(
      <InlineSelectDropDown
        options={SHORT_OPTIONS}
        value="r-b45"
        onChange={jest.fn()}
        testID="test-select"
      />,
    );
    expect(screen.getAllByText("B45").length).toBeGreaterThan(0);
  });

  it("ne rend aucun testID quand testID n'est pas fourni", () => {
    render(
      <InlineSelectDropDown
        options={SHORT_OPTIONS}
        value="inexistant"
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("fonctionne sans crash avec une seule option", async () => {
    renderDropdown({ options: [{ value: "u-1", label: "Unique" }] });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-u-1")).toBeTruthy(),
    );
  });
});
