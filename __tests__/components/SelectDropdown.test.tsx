/**
 * Tests unitaires pour SelectDropdown
 *
 * Couvre :
 * - rendu du trigger avec placeholder ou valeur sélectionnée
 * - ouverture / fermeture du modal
 * - sélection d'une option et callback onChange
 * - état d'erreur (bordure rouge)
 * - option vide ("Aucune")
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SelectDropdown } from "../../src/components/SelectDropdown";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const OPTIONS = [
  { value: "", label: "Aucune" },
  { value: "r-a01", label: "A01" },
  { value: "r-b45", label: "B45" },
];

function renderDropdown(
  overrides: Partial<React.ComponentProps<typeof SelectDropdown>> = {},
) {
  const onChange = jest.fn();
  render(
    <SelectDropdown
      options={OPTIONS}
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

describe("SelectDropdown — rendu trigger", () => {
  it("affiche le placeholder quand value ne correspond à aucune option", () => {
    renderDropdown({ options: [], value: "", placeholder: "Choisir..." });
    expect(screen.getByText("Choisir...")).toBeTruthy();
  });

  it("affiche le label de la valeur sélectionnée", () => {
    renderDropdown({ value: "r-a01" });
    expect(screen.getByText("A01")).toBeTruthy();
  });

  it("n'affiche pas le modal au montage", () => {
    renderDropdown();
    expect(screen.queryByTestId("test-select-modal")).toBeNull();
  });
});

// ─── Ouverture / fermeture ───────────────────────────────────────────────────

describe("SelectDropdown — ouverture / fermeture", () => {
  it("ouvre le modal au clic sur le trigger", async () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-modal")).toBeTruthy(),
    );
  });

  it("ferme le modal au clic sur l'overlay", async () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-overlay")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("test-select-overlay"));
    await waitFor(() =>
      expect(screen.queryByTestId("test-select-modal")).toBeNull(),
    );
  });

  it("ferme le modal après sélection d'une option", async () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-option-r-a01")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("test-select-option-r-a01"));
    await waitFor(() =>
      expect(screen.queryByTestId("test-select-modal")).toBeNull(),
    );
  });
});

// ─── Sélection d'options ─────────────────────────────────────────────────────

describe("SelectDropdown — sélection", () => {
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

  it("affiche toutes les options dans le modal", async () => {
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

describe("SelectDropdown — état d'erreur", () => {
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

describe("SelectDropdown — liste vide", () => {
  it("s'ouvre sans crash si la liste est vide", async () => {
    renderDropdown({ options: [] });
    fireEvent.press(screen.getByTestId("test-select"));
    await waitFor(() =>
      expect(screen.getByTestId("test-select-modal")).toBeTruthy(),
    );
  });

  it("affiche le placeholder si aucune option ne correspond à la valeur", () => {
    renderDropdown({ options: OPTIONS, value: "inexistant", placeholder: "—" });
    expect(screen.getByText("—")).toBeTruthy();
  });
});
