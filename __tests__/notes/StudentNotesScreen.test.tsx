import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StudentNotesScreen } from "../../src/components/notes/StudentNotesScreen";
import { colors } from "../../src/theme";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useNotesStore } from "../../src/store/notes.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

function openNotesFilters() {
  fireEvent.press(screen.getByTestId("child-notes-filter-toggle"));
}

function applyNotesFilters() {
  fireEvent.press(screen.getByTestId("child-notes-filter-apply"));
}

function selectNotesViewViaPanel(view: string) {
  openNotesFilters();
  fireEvent.press(screen.getByTestId(`child-notes-filter-view-${view}`));
  applyNotesFilters();
}

function selectNotesTermViaPanel(term: string) {
  openNotesFilters();
  fireEvent.press(screen.getByTestId(`child-notes-filter-term-${term}`));
  applyNotesFilters();
}

describe("StudentNotesScreen", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDrawer.mockReturnValue({
      openDrawer: mockOpenDrawer,
      closeDrawer: jest.fn(),
      openDrawerForClass: jest.fn(),
      isDrawerOpen: false,
    });
    useAuthStore.setState({
      schoolSlug: "college-vogt",
    } as never);
    useFamilyStore.setState({
      children: [{ id: "child-1", firstName: "Lisa", lastName: "Ntamack" }],
      activeChildId: "child-1",
      isLoading: false,
    });
    useNotesStore.setState({
      studentNotes: {
        "child-1": [
          {
            term: "TERM_1",
            label: "Trimestre 1",
            councilLabel: "6e A • Conseil du 12 avril",
            generatedAtLabel: "Données publiées le 12/04/2026",
            generalAverage: {
              student: 13.5,
              class: 12.2,
              min: 7,
              max: 18,
            },
            sequences: [],
            subjects: [
              {
                id: "math",
                subjectLabel: "Mathématiques",
                teachers: [],
                coefficient: 4,
                studentAverage: 14,
                classAverage: 11.5,
                classMin: 6,
                classMax: 17,
                rank: 1,
                classSize: 24,
                appreciation: "Bonne régularité.",
                evaluations: [
                  {
                    id: "eval-1",
                    label: "Interro 1",
                    score: 15,
                    maxScore: 20,
                    weight: 1,
                    recordedAt: "12/04/2026",
                    status: "ENTERED",
                  },
                ],
              },
              {
                id: "geo",
                subjectLabel: "Géographie",
                teachers: [],
                coefficient: 2,
                studentAverage: 11.01,
                classAverage: 12.13,
                classMin: 9.5,
                classMax: 15,
                appreciation: "Repères à consolider.",
                evaluations: [
                  {
                    id: "eval-geo-1",
                    label: "Carte",
                    score: 9.5,
                    maxScore: 20,
                    weight: 1,
                    recordedAt: "14/04/2026",
                    status: "ENTERED",
                  },
                ],
              },
            ],
          },
        ],
      },
      isLoadingStudentNotes: false,
      errorMessage: null,
      loadStudentNotes: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
    } as never);
  });

  it("affiche la vue notes de l'enfant", () => {
    render(<StudentNotesScreen />);

    expect(screen.getByTestId("child-notes-header")).toBeTruthy();
    expect(screen.getByText("Évaluations et moyennes")).toBeTruthy();
    expect(screen.getByText("Lisa Ntamack • 6e A")).toBeTruthy();
    expect(screen.getByTestId("child-notes-filter-summary")).toHaveTextContent(
      "Trimestre 1",
      { exact: false },
    );
    expect(screen.getByText("MATHÉMATIQUES")).toBeTruthy();
  });

  it("redirige le retour vers l'accueil de l'enfant actif", () => {
    render(<StudentNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("ouvre et ferme la modale d'aide depuis le menu du header", () => {
    render(<StudentNotesScreen />);

    expect(screen.queryByTestId("child-notes-help-modal-title")).toBeNull();

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("child-notes-help-menu-item"));

    expect(
      screen.getByTestId("child-notes-help-modal-title"),
    ).toHaveTextContent("Notes");
    expect(screen.getByText("Deux onglets")).toBeOnTheScreen();
    expect(screen.getByText("Filtrer les résultats")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("child-notes-help-modal-close"));
    expect(screen.queryByTestId("child-notes-help-modal-title")).toBeNull();
  });

  it("change de trimestre via le panneau de filtres", () => {
    useNotesStore.setState({
      studentNotes: {
        "child-1": [
          {
            term: "TERM_1",
            label: "Trimestre 1",
            councilLabel: "6e A • Conseil du 12 avril",
            generatedAtLabel: "Données publiées le 12/04/2026",
            generalAverage: { student: 13.5, class: 12.2, min: 7, max: 18 },
            sequences: [],
            subjects: [],
          },
          {
            term: "TERM_2",
            label: "Trimestre 2",
            councilLabel: "6e A • Conseil du 20 janvier",
            generatedAtLabel: "Données publiées le 20/01/2026",
            generalAverage: { student: 12, class: 11, min: 5, max: 17 },
            sequences: [],
            subjects: [
              {
                id: "term-2-math",
                subjectLabel: "Mathématiques",
                teachers: [],
                coefficient: 4,
                studentAverage: 12,
                classAverage: 11,
                classMin: 5,
                classMax: 17,
                appreciation: null,
                evaluations: [],
              },
            ],
          },
        ],
      },
      isLoadingStudentNotes: false,
      errorMessage: null,
      loadStudentNotes: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
    } as never);

    render(<StudentNotesScreen />);

    selectNotesTermViaPanel("TERM_2");

    expect(screen.getByTestId("child-notes-filter-summary")).toHaveTextContent(
      "Trimestre 2",
      { exact: false },
    );
    expect(
      screen.getByTestId("child-notes-subject-row-term-2-math"),
    ).toBeTruthy();
  });

  it("selectionne au premier affichage le trimestre courant et la vue eval", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-13T10:00:00Z"));

    useNotesStore.setState({
      studentNotes: {
        "child-1": [
          {
            term: "TERM_1",
            label: "Trimestre 1",
            councilLabel: "6e A • Conseil du 12 avril",
            generatedAtLabel: "Données publiées le 12/04/2026",
            generalAverage: {
              student: 13.5,
              class: 12.2,
              min: 7,
              max: 18,
            },
            sequences: [],
            subjects: [],
          },
          {
            term: "TERM_3",
            label: "Trimestre 3",
            councilLabel: "6e A • Conseil du 13 avril",
            generatedAtLabel: "Données publiées le 13/04/2026",
            generalAverage: {
              student: 14.1,
              class: 12.8,
              min: 8,
              max: 18,
            },
            sequences: [],
            subjects: [
              {
                id: "term-3-math",
                subjectLabel: "Mathématiques",
                teachers: [],
                coefficient: 4,
                studentAverage: 14.1,
                classAverage: 12.8,
                classMin: 8,
                classMax: 18,
                appreciation: "Solide.",
                evaluations: [
                  {
                    id: "eval-term-3",
                    label: "Compo finale",
                    score: 16,
                    maxScore: 20,
                    weight: 1,
                    recordedAt: "13/04/2026",
                    status: "ENTERED",
                  },
                ],
              },
            ],
          },
        ],
      },
    } as never);

    render(<StudentNotesScreen />);

    expect(screen.getByTestId("child-notes-filter-summary")).toHaveTextContent(
      "Trimestre 3",
      { exact: false },
    );

    openNotesFilters();
    const activeTerm = screen.getByTestId("child-notes-filter-term-TERM_3");
    const activeView = screen.getByTestId(
      "child-notes-filter-view-evaluations",
    );
    const activeTermStyle = StyleSheet.flatten(activeTerm.props.style);
    const activeViewStyle = StyleSheet.flatten(activeView.props.style);

    expect(activeTermStyle.backgroundColor).toBe(colors.accentTeal);
    expect(activeViewStyle.backgroundColor).toBe(colors.accentTeal);
  });

  it("affiche une entete concise avec le nom et la classe", () => {
    render(<StudentNotesScreen />);

    expect(screen.queryByText("Evaluations et moyennes de l'eleve")).toBeNull();
    expect(screen.getByText("Évaluations et moyennes")).toBeTruthy();
    expect(screen.getByText("Lisa Ntamack • 6e A")).toBeTruthy();
  });

  it("verrouille le gabarit compact et pleine largeur du header", () => {
    render(<StudentNotesScreen />);

    const header = screen.getByTestId("child-notes-header");
    const title = screen.getByTestId("child-notes-header-title");
    const subtitle = screen.getByTestId("child-notes-header-subtitle");

    const headerStyle = StyleSheet.flatten(header.props.style);
    const titleStyle = StyleSheet.flatten(title.props.style);
    const subtitleStyle = StyleSheet.flatten(subtitle.props.style);

    expect(headerStyle.backgroundColor).toBe(colors.primary);
    expect(headerStyle.paddingHorizontal).toBe(20);
    expect(headerStyle.paddingVertical).toBe(10);
    expect(titleStyle.fontWeight).toBe("600");
    expect(titleStyle.fontSize).toBe(19);
    expect(subtitleStyle.fontSize).toBe(11);
  });

  it("distingue visuellement les puces actives/inactives du panneau de filtres", () => {
    render(<StudentNotesScreen />);

    openNotesFilters();

    const activeTerm = screen.getByTestId("child-notes-filter-term-TERM_1");
    const activeView = screen.getByTestId(
      "child-notes-filter-view-evaluations",
    );
    const inactiveView = screen.getByTestId("child-notes-filter-view-averages");

    const activeTermStyle = StyleSheet.flatten(activeTerm.props.style);
    const activeViewStyle = StyleSheet.flatten(activeView.props.style);
    const inactiveViewStyle = StyleSheet.flatten(inactiveView.props.style);

    expect(activeTermStyle.backgroundColor).toBe(colors.accentTeal);
    expect(activeViewStyle.backgroundColor).toBe(colors.accentTeal);
    expect(inactiveViewStyle.backgroundColor).toBe(colors.background);
    expect(inactiveViewStyle.borderColor).toBe(colors.border);
  });

  it("le bouton Appliquer a une couleur distincte des puces actives", () => {
    render(<StudentNotesScreen />);

    openNotesFilters();

    const activeTerm = screen.getByTestId("child-notes-filter-term-TERM_1");
    const applyButton = screen.getByTestId("child-notes-filter-apply");

    const activeTermStyle = StyleSheet.flatten(activeTerm.props.style);
    const applyStyle = StyleSheet.flatten(applyButton.props.style);

    expect(applyStyle.backgroundColor).toBe(colors.primary);
    expect(applyStyle.backgroundColor).not.toBe(
      activeTermStyle.backgroundColor,
    );
  });

  it("ouvre le détail d'une évaluation", () => {
    render(<StudentNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-evaluation-eval-1"));

    expect(screen.getByText("Détail de l'évaluation")).toBeTruthy();
    expect(screen.getAllByText("Interro 1").length).toBeGreaterThan(0);
  });

  it("applique la couleur de vigilance aux notes faibles comme sur le web", () => {
    render(<StudentNotesScreen />);

    const weakScore = screen.getByTestId("score-value-eval-geo-1");
    const weakScoreStyle = StyleSheet.flatten(weakScore.props.style);

    expect(weakScoreStyle.color).toBe(colors.notification);
    expect(screen.getByText("9,50")).toBeTruthy();
  });

  it("alterne legerement le fond des matieres pour faciliter la lecture", () => {
    render(<StudentNotesScreen />);

    const firstRow = screen.getByTestId("child-notes-subject-row-math");
    const secondRow = screen.getByTestId("child-notes-subject-row-geo");

    const firstRowStyle = StyleSheet.flatten(firstRow.props.style);
    const secondRowStyle = StyleSheet.flatten(secondRow.props.style);

    expect(firstRowStyle.backgroundColor).toBeUndefined();
    expect(secondRowStyle.backgroundColor).toBe("#fffaf4");
  });

  it("affiche le bloc bulletin de période et les données publiées dans l'onglet Bulletins", () => {
    render(<StudentNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-tab-reports"));

    expect(screen.getByTestId("notes-period-hero")).toBeTruthy();
    expect(screen.getByText("BULLETIN DE PÉRIODE")).toBeTruthy();
    expect(screen.getByText("DONNÉES PUBLIÉES")).toBeTruthy();
    expect(screen.getByText("Données publiées le 12/04/2026")).toBeTruthy();
  });

  it("affiche les cartes de synthèse du bulletin dans l'onglet Bulletins", () => {
    render(<StudentNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-tab-reports"));

    expect(screen.getByTestId("notes-period-stat-student-avg")).toBeTruthy();
    expect(screen.getByTestId("notes-period-stat-class-avg")).toBeTruthy();
    expect(screen.getByTestId("notes-period-stat-best-subject")).toBeTruthy();
    expect(screen.getByTestId("notes-period-stat-watch-subject")).toBeTruthy();
  });

  it("affiche la vue moyennes proche du tableau web mobile", () => {
    render(<StudentNotesScreen />);

    selectNotesViewViaPanel("averages");

    expect(screen.getByTestId("child-notes-averages-board")).toBeTruthy();
    expect(screen.getByTestId("child-notes-average-math")).toBeTruthy();
    expect(screen.getByText("Classe : 11,50")).toBeTruthy();
    expect(screen.getByText("Min : 6")).toBeTruthy();
    expect(screen.getByText("Max : 17")).toBeTruthy();
    expect(
      screen.getByTestId("child-notes-average-progress-math"),
    ).toBeTruthy();
    expect(screen.getByText("Bonne régularité.")).toBeTruthy();
  });

  it("affiche les panneaux graphiques de comparaison et radar", () => {
    render(<StudentNotesScreen />);

    selectNotesViewViaPanel("charts");

    expect(screen.getByText("Comparaison par matière")).toBeTruthy();
    expect(screen.getByText("Radar des moyennes")).toBeTruthy();
    expect(screen.getByTestId("child-notes-radar-panel")).toBeTruthy();
  });

  it("redirige le retour vers l'accueil enfant", () => {
    render(<StudentNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("déclenche une seule navigation retour au clic sur le bouton retour", () => {
    render(<StudentNotesScreen />);

    const backButton = screen.getByTestId("child-notes-back");
    fireEvent.press(backButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  describe("Onglets Notes / Bulletins", () => {
    it("affiche les deux onglets, Notes actif par défaut", () => {
      render(<StudentNotesScreen />);

      expect(screen.getByTestId("child-notes-tab-notes")).toBeTruthy();
      expect(screen.getByTestId("child-notes-tab-reports")).toBeTruthy();
      // Le panel Notes (inchangé) est affiché par défaut
      expect(screen.getByText("MATHÉMATIQUES")).toBeTruthy();
    });

    it("bascule vers l'onglet Bulletins et affiche le bulletin de période", () => {
      render(<StudentNotesScreen />);

      fireEvent.press(screen.getByTestId("child-notes-tab-reports"));

      expect(screen.getByTestId("child-reports-tab")).toBeTruthy();
      expect(screen.getByTestId("notes-period-hero")).toBeTruthy();
      expect(
        screen.getByTestId("child-reports-subject-card-math"),
      ).toBeTruthy();
    });

    it("l'onglet Bulletins n'affiche pas la grille d'évaluations de l'onglet Notes", () => {
      render(<StudentNotesScreen />);

      fireEvent.press(screen.getByTestId("child-notes-tab-reports"));

      expect(screen.queryByTestId("child-notes-evaluation-eval-1")).toBeNull();
    });

    it("revient à l'onglet Notes inchangé après être passé par Bulletins", () => {
      render(<StudentNotesScreen />);

      fireEvent.press(screen.getByTestId("child-notes-tab-reports"));
      fireEvent.press(screen.getByTestId("child-notes-tab-notes"));

      expect(screen.getByTestId("child-notes-evaluation-eval-1")).toBeTruthy();
    });
  });

  describe("Onglet Bulletins — bulletin en lecture seule", () => {
    it("affiche le rang, la moyenne de classe et l'appréciation sans aucun bouton d'action", () => {
      render(<StudentNotesScreen />);

      fireEvent.press(screen.getByTestId("child-notes-tab-reports"));

      expect(
        screen.getByTestId("child-reports-subject-card-math"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("child-reports-subject-math-rank"),
      ).toHaveTextContent("Rang 1/24", { exact: false });
      expect(
        screen.getByTestId("child-reports-subject-math-readonly"),
      ).toHaveTextContent("Bonne régularité.");

      // Aucun élément d'édition (réservé à la vue enseignant) ne doit exister
      expect(
        screen.queryByTestId("child-reports-subject-math-display"),
      ).toBeNull();
      expect(
        screen.queryByTestId("child-reports-subject-math-editor"),
      ).toBeNull();
      expect(
        screen.queryByTestId("child-reports-subject-math-save"),
      ).toBeNull();
    });

    it("n'affiche plus le badge 'année scolaire en cours'", () => {
      render(<StudentNotesScreen />);

      fireEvent.press(screen.getByTestId("child-notes-tab-reports"));

      expect(screen.queryByText("Année scolaire en cours")).toBeNull();
    });
  });
});
