import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { DEFAULT_LOCALE, translations } from "../../src/i18n/translations";
import { useLocaleStore } from "../../src/store/locale.store";
import { useAuthStore } from "../../src/store/auth.store";
import { useNotesStore } from "../../src/store/notes.store";
import { StudentNotesPanel } from "../../src/components/notes/ChildNotesScreen";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const PANEL_PROPS = {
  studentId: "student-1",
  schoolSlug: "college-vogt",
};

function setupEmptyPanel() {
  useAuthStore.setState({ schoolSlug: "college-vogt" } as never);
  useNotesStore.setState({
    studentNotes: {},
    isLoadingStudentNotes: false,
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    scoresVersion: 0,
  } as never);
}

describe("Notes — completude des traductions", () => {
  it("a des clés notes.* identiques en fr et en", () => {
    const frKeys = Object.keys(translations.fr).filter((k) =>
      k.startsWith("notes."),
    );
    const enKeys = Object.keys(translations.en).filter((k) =>
      k.startsWith("notes."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });
});

describe("Notes — traduction selon la locale du compte", () => {
  afterEach(() => {
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
  });

  describe("StudentNotesPanel — etat vide", () => {
    it("affiche l'etat vide en francais par defaut", async () => {
      setupEmptyPanel();

      render(<StudentNotesPanel {...PANEL_PROPS} />);

      await waitFor(() => {
        expect(screen.getByText("Aucune note publiée")).toBeTruthy();
      });

      expect(screen.queryByText("No published grade")).toBeNull();
    });

    it("affiche l'etat vide en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupEmptyPanel();

      render(<StudentNotesPanel {...PANEL_PROPS} />);

      await waitFor(() => {
        expect(screen.getByText("No published grade")).toBeTruthy();
      });

      expect(screen.queryByText("Aucune note publiée")).toBeNull();
    });
  });

  describe("StudentNotesPanel — selecteur de trimestre", () => {
    it("affiche les trimestres en francais par defaut", async () => {
      setupEmptyPanel();

      render(<StudentNotesPanel {...PANEL_PROPS} />);

      await waitFor(() => {
        expect(screen.getByText("Trimestre 1")).toBeTruthy();
      });

      expect(screen.queryByText("Term 1")).toBeNull();
    });

    it("affiche les trimestres en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupEmptyPanel();

      render(<StudentNotesPanel {...PANEL_PROPS} />);

      await waitFor(() => {
        expect(screen.getByText("Term 1")).toBeTruthy();
      });

      expect(screen.queryByText("Trimestre 1")).toBeNull();
    });
  });

  describe("StudentNotesPanel — libelles de vue", () => {
    it("affiche les onglets de vue en francais par defaut", async () => {
      setupEmptyPanel();

      render(<StudentNotesPanel {...PANEL_PROPS} />);

      await waitFor(() => {
        expect(screen.getByText("Eval")).toBeTruthy();
        expect(screen.getByText("Moy")).toBeTruthy();
        expect(screen.getByText("Graph")).toBeTruthy();
      });

      expect(screen.queryByText("Avg")).toBeNull();
      expect(screen.queryByText("Chart")).toBeNull();
    });

    it("affiche les onglets de vue en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupEmptyPanel();

      render(<StudentNotesPanel {...PANEL_PROPS} />);

      await waitFor(() => {
        expect(screen.getByText("Eval")).toBeTruthy();
        expect(screen.getByText("Avg")).toBeTruthy();
        expect(screen.getByText("Chart")).toBeTruthy();
      });

      expect(screen.queryByText("Moy")).toBeNull();
      expect(screen.queryByText("Graph")).toBeNull();
    });
  });
});
