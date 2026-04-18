import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ChildNotesScreen } from "../../src/components/notes/ChildNotesScreen";
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
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

describe("ChildNotesScreen", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDrawer.mockReturnValue({
      openDrawer: mockOpenDrawer,
      closeDrawer: jest.fn(),
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
    render(<ChildNotesScreen />);

    expect(screen.getByTestId("child-notes-header")).toBeTruthy();
    expect(screen.getByText("Evaluations et moyennes")).toBeTruthy();
    expect(screen.getByText("Lisa Ntamack • 6e A")).toBeTruthy();
    expect(screen.getAllByText("Trimestre 1").length).toBeGreaterThan(0);
    expect(screen.getByText("MATHÉMATIQUES")).toBeTruthy();
  });

  it("redirige le retour vers l'accueil de l'enfant actif", () => {
    render(<ChildNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("ouvre le menu de navigation enfant via l'icone droite", () => {
    render(<ChildNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-menu"));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
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

    render(<ChildNotesScreen />);

    const activeTerm = screen.getByTestId("child-notes-term-TERM_3");
    const activeView = screen.getByTestId("child-notes-view-evaluations");
    const activeTermStyle = StyleSheet.flatten(activeTerm.props.style);
    const activeViewStyle = StyleSheet.flatten(activeView.props.style);

    expect(screen.getAllByText("Trimestre 3").length).toBeGreaterThan(0);
    expect(activeTermStyle.backgroundColor).toBe(colors.primary);
    expect(activeViewStyle.backgroundColor).toBe("#f4f8fd");
    expect(screen.getByText("Données publiées le 13/04/2026")).toBeTruthy();
  });

  it("affiche une entete concise avec le nom et la classe", () => {
    render(<ChildNotesScreen />);

    expect(screen.queryByText("Evaluations et moyennes de l'eleve")).toBeNull();
    expect(screen.getByText("Evaluations et moyennes")).toBeTruthy();
    expect(screen.getByText("Lisa Ntamack • 6e A")).toBeTruthy();
  });

  it("verrouille le gabarit compact et pleine largeur du header", () => {
    render(<ChildNotesScreen />);

    const header = screen.getByTestId("child-notes-header");
    const title = screen.getByTestId("child-notes-header-title");
    const subtitle = screen.getByTestId("child-notes-header-subtitle");

    const headerStyle = StyleSheet.flatten(header.props.style);
    const titleStyle = StyleSheet.flatten(title.props.style);
    const subtitleStyle = StyleSheet.flatten(subtitle.props.style);

    expect(headerStyle.backgroundColor).toBe(colors.primary);
    expect(headerStyle.marginHorizontal).toBe(-16);
    expect(headerStyle.paddingVertical).toBe(10);
    expect(titleStyle.fontWeight).toBe("600");
    expect(titleStyle.fontSize).toBe(19);
    expect(subtitleStyle.fontSize).toBe(11);
  });

  it("verrouille la hiérarchie visuelle entre trimestres et tabs de vue", () => {
    render(<ChildNotesScreen />);

    const activeTerm = screen.getByTestId("child-notes-term-TERM_1");
    const activeView = screen.getByTestId("child-notes-view-evaluations");
    const inactiveView = screen.getByTestId("child-notes-view-averages");

    const activeTermStyle = StyleSheet.flatten(activeTerm.props.style);
    const activeViewStyle = StyleSheet.flatten(activeView.props.style);
    const inactiveViewStyle = StyleSheet.flatten(inactiveView.props.style);

    expect(activeTermStyle.borderRadius).toBe(10);
    expect(activeTermStyle.backgroundColor).toBe(colors.primary);
    expect(activeTermStyle.elevation).toBe(4);
    expect(activeViewStyle.borderRadius).toBe(8);
    expect(activeViewStyle.backgroundColor).toBe("#f4f8fd");
    expect(activeViewStyle.borderColor).toBe(colors.primary);
    expect(inactiveViewStyle.backgroundColor).toBe(colors.white);
    expect(inactiveViewStyle.borderColor).toBe(colors.border);
    expect(activeTermStyle.elevation).toBeGreaterThan(
      activeViewStyle.elevation,
    );
  });

  it("ouvre le détail d'une évaluation", () => {
    render(<ChildNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-evaluation-eval-1"));

    expect(screen.getByText("Detail de l'evaluation")).toBeTruthy();
    expect(screen.getAllByText("Interro 1").length).toBeGreaterThan(0);
  });

  it("applique la couleur de vigilance aux notes faibles comme sur le web", () => {
    render(<ChildNotesScreen />);

    const weakScore = screen.getByTestId("score-value-eval-geo-1");
    const weakScoreStyle = StyleSheet.flatten(weakScore.props.style);

    expect(weakScoreStyle.color).toBe(colors.notification);
    expect(screen.getByText("9,50")).toBeTruthy();
  });

  it("alterne legerement le fond des matieres pour faciliter la lecture", () => {
    render(<ChildNotesScreen />);

    const firstRow = screen.getByTestId("child-notes-subject-row-math");
    const secondRow = screen.getByTestId("child-notes-subject-row-geo");

    const firstRowStyle = StyleSheet.flatten(firstRow.props.style);
    const secondRowStyle = StyleSheet.flatten(secondRow.props.style);

    expect(firstRowStyle.backgroundColor).toBeUndefined();
    expect(secondRowStyle.backgroundColor).toBe("#fffaf4");
  });

  it("affiche le bloc bulletin de période et les données publiées", () => {
    render(<ChildNotesScreen />);

    expect(screen.getByTestId("notes-period-hero")).toBeTruthy();
    expect(screen.getByText("BULLETIN DE PERIODE")).toBeTruthy();
    expect(screen.getByText("DONNEES PUBLIEES")).toBeTruthy();
    expect(screen.getByText("Données publiées le 12/04/2026")).toBeTruthy();
  });

  it("affiche les cartes de synthèse du bulletin", () => {
    render(<ChildNotesScreen />);

    expect(screen.getByTestId("notes-period-stat-moyenne-eleve")).toBeTruthy();
    expect(screen.getByTestId("notes-period-stat-moyenne-classe")).toBeTruthy();
    expect(screen.getByTestId("notes-period-stat-matiere-forte")).toBeTruthy();
    expect(
      screen.getByTestId("notes-period-stat-point-de-vigilance"),
    ).toBeTruthy();
  });

  it("affiche la vue moyennes proche du tableau web mobile", () => {
    render(<ChildNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-view-averages"));

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
    render(<ChildNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-view-charts"));

    expect(screen.getByText("Comparaison par matiere")).toBeTruthy();
    expect(screen.getByText("Radar des moyennes")).toBeTruthy();
    expect(screen.getByTestId("child-notes-radar-panel")).toBeTruthy();
  });

  it("redirige le retour vers l'accueil enfant", () => {
    render(<ChildNotesScreen />);

    fireEvent.press(screen.getByTestId("child-notes-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("déclenche une seule navigation retour au clic sur le bouton retour", () => {
    render(<ChildNotesScreen />);

    const backButton = screen.getByTestId("child-notes-back");
    fireEvent.press(backButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
