import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { NotesTabs } from "../../src/components/notes/NotesTabs";
import type { NotesTabKey } from "../../src/components/notes/NotesTabs";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const onSelect = jest.fn();

beforeEach(() => jest.clearAllMocks());

function renderTabs(activeTab: NotesTabKey = "evaluations") {
  return render(<NotesTabs activeTab={activeTab} onSelect={onSelect} />);
}

// ── Rendu ─────────────────────────────────────────────────────────────────────

describe("Rendu des onglets", () => {
  it("affiche les 4 onglets", () => {
    renderTabs();
    expect(screen.getByTestId("notes-tab-evaluations")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-scores")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-notes")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-council")).toBeTruthy();
  });

  it("affiche les labels en français", () => {
    renderTabs();
    expect(screen.getByText("Évaluations")).toBeTruthy();
    expect(screen.getByText("Saisie notes")).toBeTruthy();
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(screen.getByText("Conseil classe")).toBeTruthy();
  });
});

// ── Sélection ─────────────────────────────────────────────────────────────────

describe("Sélection d'onglet", () => {
  it("appelle onSelect avec 'scores' quand on presse Saisie notes", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("notes-tab-scores"));
    expect(onSelect).toHaveBeenCalledWith("scores");
  });

  it("appelle onSelect avec 'notes' quand on presse Notes", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("notes-tab-notes"));
    expect(onSelect).toHaveBeenCalledWith("notes");
  });

  it("appelle onSelect avec 'council' quand on presse Conseil classe", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("notes-tab-council"));
    expect(onSelect).toHaveBeenCalledWith("council");
  });

  it("appelle onSelect avec 'evaluations' quand on presse Évaluations", () => {
    renderTabs("scores");
    fireEvent.press(screen.getByTestId("notes-tab-evaluations"));
    expect(onSelect).toHaveBeenCalledWith("evaluations");
  });
});
