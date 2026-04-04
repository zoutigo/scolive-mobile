/**
 * Tests composant — FolderTabs
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { FolderTabs } from "../../src/components/messaging/FolderTabs";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const onSelect = jest.fn();

beforeEach(() => jest.clearAllMocks());

function renderTabs(
  activeFolder: "inbox" | "sent" | "drafts" | "archive" = "inbox",
  unreadCount = 0,
) {
  return render(
    <FolderTabs
      activeFolder={activeFolder}
      unreadCount={unreadCount}
      onSelect={onSelect}
    />,
  );
}

// ── Rendu ─────────────────────────────────────────────────────────────────────

describe("Rendu des onglets", () => {
  it("affiche les 4 dossiers", () => {
    renderTabs();
    expect(screen.getByTestId("folder-tab-inbox")).toBeTruthy();
    expect(screen.getByTestId("folder-tab-sent")).toBeTruthy();
    expect(screen.getByTestId("folder-tab-drafts")).toBeTruthy();
    expect(screen.getByTestId("folder-tab-archive")).toBeTruthy();
  });

  it("affiche les labels en français", () => {
    renderTabs();
    expect(screen.getByText("Réception")).toBeTruthy();
    expect(screen.getByText("Envoyés")).toBeTruthy();
    expect(screen.getByText("Brouillons")).toBeTruthy();
    expect(screen.getByText("Archives")).toBeTruthy();
  });
});

// ── Badge non-lu ──────────────────────────────────────────────────────────────

describe("Badge non-lu", () => {
  it("affiche le badge quand unreadCount > 0 sur l'onglet inbox", () => {
    renderTabs("inbox", 5);
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("n'affiche pas le badge quand unreadCount = 0", () => {
    renderTabs("inbox", 0);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("affiche 99+ quand le nombre dépasse 99", () => {
    renderTabs("inbox", 150);
    expect(screen.getByText("99+")).toBeTruthy();
  });

  it("n'affiche pas le badge sur les autres onglets", () => {
    renderTabs("sent", 5);
    expect(screen.queryByTestId("folder-badge-sent")).toBeNull();
    expect(screen.queryByTestId("folder-badge-inbox")).toBeTruthy();
  });
});

// ── Interaction ───────────────────────────────────────────────────────────────

describe("Sélection d'onglet", () => {
  it("appelle onSelect avec 'sent' quand on presse l'onglet Envoyés", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("folder-tab-sent"));
    expect(onSelect).toHaveBeenCalledWith("sent");
  });

  it("appelle onSelect avec 'drafts'", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("folder-tab-drafts"));
    expect(onSelect).toHaveBeenCalledWith("drafts");
  });

  it("appelle onSelect avec 'archive'", () => {
    renderTabs();
    fireEvent.press(screen.getByTestId("folder-tab-archive"));
    expect(onSelect).toHaveBeenCalledWith("archive");
  });

  it("appelle onSelect avec 'inbox'", () => {
    renderTabs("sent");
    fireEvent.press(screen.getByTestId("folder-tab-inbox"));
    expect(onSelect).toHaveBeenCalledWith("inbox");
  });
});
