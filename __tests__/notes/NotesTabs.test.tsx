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
  it("affiche les 3 onglets", () => {
    renderTabs();
    expect(screen.getByTestId("notes-tab-evaluations")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-notes")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-reports")).toBeTruthy();
  });

  it("affiche les labels en français", () => {
    renderTabs();
    expect(screen.getByText("Évaluations")).toBeTruthy();
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(screen.getByText("Bulletins")).toBeTruthy();
  });
});

// ── Sélection ─────────────────────────────────────────────────────────────────

describe("Sélection d'onglet", () => {
  it("appelle onSelect avec 'notes' quand on presse Notes", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("notes-tab-notes"));
    expect(onSelect).toHaveBeenCalledWith("notes");
  });

  it("appelle onSelect avec 'reports' quand on presse Bulletins", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("notes-tab-reports"));
    expect(onSelect).toHaveBeenCalledWith("reports");
  });

  it("appelle onSelect avec 'evaluations' quand on presse Évaluations", () => {
    renderTabs("notes");
    fireEvent.press(screen.getByTestId("notes-tab-evaluations"));
    expect(onSelect).toHaveBeenCalledWith("evaluations");
  });
});

describe("tourTargetId", () => {
  it("rend normalement les onglets quand tourTargetId est fourni (sans casser la sélection)", () => {
    render(
      <NotesTabs
        activeTab="evaluations"
        onSelect={onSelect}
        tourTargetId="teacher-notes-tour-tabs"
      />,
    );
    expect(screen.getByTestId("notes-tab-notes")).toBeTruthy();
    fireEvent.press(screen.getByTestId("notes-tab-notes"));
    expect(onSelect).toHaveBeenCalledWith("notes");
  });
});
