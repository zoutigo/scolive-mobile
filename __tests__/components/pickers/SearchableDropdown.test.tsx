/**
 * Tests composant — SearchableDropdown
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { SearchableDropdown } from "../../../src/components/pickers/SearchableDropdown";
import type { SearchableDropdownItem } from "../../../src/components/pickers/SearchableDropdown";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const ITEMS: SearchableDropdownItem[] = [
  { id: "1", label: "Mbarga François", sublabel: "Enseignant" },
  { id: "2", label: "MBELE Valery", sublabel: "Enseignant" },
];

function renderDropdown(
  overrides: Partial<Parameters<typeof SearchableDropdown>[0]> = {},
) {
  const onSearchChange = jest.fn();
  const onSelect = jest.fn();
  const onLoadMore = jest.fn();
  const utils = render(
    <SearchableDropdown
      value={null}
      items={ITEMS}
      searchValue=""
      onSearchChange={onSearchChange}
      onSelect={onSelect}
      onLoadMore={onLoadMore}
      placeholder="Choisir un utilisateur"
      searchPlaceholder="Rechercher..."
      emptyLabel="Aucun résultat"
      title="Utilisateurs"
      testIDPrefix="user-picker"
      {...overrides}
    />,
  );
  return { ...utils, onSearchChange, onSelect, onLoadMore };
}

describe("SearchableDropdown", () => {
  it("affiche le placeholder tant qu'aucune valeur n'est sélectionnée", () => {
    renderDropdown();
    expect(screen.getByText("Choisir un utilisateur")).toBeTruthy();
  });

  it("affiche le label de la valeur sélectionnée", () => {
    renderDropdown({ value: ITEMS[0] });
    expect(screen.getByText("Mbarga François")).toBeTruthy();
  });

  it("ouvre le modal au tap sur le trigger et liste les items", () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("user-picker-trigger"));
    expect(screen.getByTestId("user-picker-item-1")).toBeTruthy();
    expect(screen.getByTestId("user-picker-item-2")).toBeTruthy();
  });

  it("relaie la saisie de recherche via onSearchChange", () => {
    const { onSearchChange } = renderDropdown();
    fireEvent.press(screen.getByTestId("user-picker-trigger"));
    fireEvent.changeText(screen.getByTestId("user-picker-search-input"), "Val");
    expect(onSearchChange).toHaveBeenCalledWith("Val");
  });

  it("sélectionne un item et ferme le modal", () => {
    const { onSelect } = renderDropdown();
    fireEvent.press(screen.getByTestId("user-picker-trigger"));
    fireEvent.press(screen.getByTestId("user-picker-item-2"));
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1]);
    expect(screen.queryByTestId("user-picker-item-1")).toBeNull();
  });

  it("affiche le message vide quand la liste est vide", () => {
    renderDropdown({ items: [] });
    fireEvent.press(screen.getByTestId("user-picker-trigger"));
    expect(screen.getByText("Aucun résultat")).toBeTruthy();
  });

  it("ne s'ouvre pas quand disabled=true", () => {
    renderDropdown({ disabled: true });
    fireEvent.press(screen.getByTestId("user-picker-trigger"));
    expect(screen.queryByTestId("user-picker-item-1")).toBeNull();
  });

  it("déclenche onLoadMore via onEndReached quand hasMore=true", () => {
    const { onLoadMore } = renderDropdown({ hasMore: true });
    fireEvent.press(screen.getByTestId("user-picker-trigger"));
    fireEvent(screen.getByTestId("user-picker-list"), "onEndReached", {
      distanceFromEnd: 0,
    });
    expect(onLoadMore).toHaveBeenCalled();
  });
});
