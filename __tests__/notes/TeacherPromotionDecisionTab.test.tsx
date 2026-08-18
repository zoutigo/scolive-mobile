import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherPromotionDecisionTab } from "../../src/components/notes/TeacherPromotionDecisionTab";
import { promotionsApi } from "../../src/api/promotions.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/promotions.api");
jest.mock("../../src/api/curriculums.api");

const promotionsApiMock = promotionsApi as jest.Mocked<typeof promotionsApi>;
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

const ACTIVATED_LEVELS = [
  { id: "level-ce1", code: "CE1", label: "CE1", order: 4 },
  { id: "level-ce2", code: "CE2", label: "CE2", order: 5 },
  { id: "level-cm1", code: "CM1", label: "CM1", order: 6 },
];

function undecidedReport(overrides: Record<string, unknown> = {}) {
  return {
    id: "report-1",
    student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
    decision: null,
    nextAcademicLevel: null,
    nextTrack: null,
    termAverages: { TERM_1: 12, TERM_2: 14, TERM_3: 16 },
    yearlyAverage: 14,
    rank: 2,
    classSize: 25,
    currentAcademicLevel: { id: "level-ce1", order: 4 },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  curriculumsApiMock.listActivatedAcademicLevels.mockResolvedValue(
    ACTIVATED_LEVELS as never,
  );
  promotionsApiMock.listTermReportsForDecision.mockResolvedValue([
    undecidedReport(),
  ] as never);
  promotionsApiMock.setTermReportDecision.mockResolvedValue({
    ...undecidedReport(),
    decision: "PROMOTED",
    nextAcademicLevel: { id: "level-ce2", label: "CE2" },
  } as never);
});

describe("TeacherPromotionDecisionTab", () => {
  it("affiche la card repliee par defaut avec 'Aucune decision' en rouge tant qu'aucune decision n'est prise", async () => {
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
      />,
    );

    expect(
      await screen.findByTestId("decision-card-report-1"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("decision-card-report-1-status"),
    ).toHaveTextContent("Aucune décision");
    expect(
      screen.queryByTestId("decision-card-report-1-decision"),
    ).not.toBeOnTheScreen();
  });

  it("ouvre la card au clic, propose automatiquement le niveau suivant pour Promoted, enregistre puis se referme en affichant la decision", async () => {
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
      />,
    );

    fireEvent.press(await screen.findByTestId("decision-card-report-1-toggle"));

    expect(screen.getByText("12")).toBeOnTheScreen();
    expect(screen.getByText("16")).toBeOnTheScreen();
    expect(screen.getAllByText("14")).toHaveLength(2);

    fireEvent.press(screen.getByTestId("decision-card-report-1-decision"));
    fireEvent.press(
      await screen.findByTestId(
        "decision-card-report-1-decision-option-PROMOTED",
      ),
    );

    // niveau actuel = CE1 (order 4) -> le suivant actif est CE2 (order 5),
    // propose automatiquement sans que l'enseignant ait a le choisir
    expect(
      screen.getByTestId("decision-card-report-1-level"),
    ).toHaveTextContent("CE2");

    promotionsApiMock.listTermReportsForDecision.mockResolvedValueOnce([
      undecidedReport({
        decision: "PROMOTED",
        nextAcademicLevel: { id: "level-ce2", label: "CE2" },
      }),
    ] as never);

    fireEvent.press(screen.getByTestId("decision-card-report-1-save"));

    await waitFor(() =>
      expect(promotionsApiMock.setTermReportDecision).toHaveBeenCalledWith(
        "college-vogt",
        "report-1",
        { decision: "PROMOTED", nextAcademicLevelId: "level-ce2" },
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Décision enregistrée",
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("decision-card-report-1-status"),
      ).toHaveTextContent("Promu"),
    );
    expect(
      screen.queryByTestId("decision-card-report-1-decision"),
    ).not.toBeOnTheScreen();
  });

  it("propose automatiquement le niveau actuel de la classe pour Repeated", async () => {
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
      />,
    );

    fireEvent.press(await screen.findByTestId("decision-card-report-1-toggle"));
    fireEvent.press(screen.getByTestId("decision-card-report-1-decision"));
    fireEvent.press(
      await screen.findByTestId(
        "decision-card-report-1-decision-option-REPEATED",
      ),
    );

    expect(
      screen.getByTestId("decision-card-report-1-level"),
    ).toHaveTextContent("CE1");
  });

  it("desactive le bouton Enregistrer tant qu'aucune decision n'est selectionnee", async () => {
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
      />,
    );

    fireEvent.press(await screen.findByTestId("decision-card-report-1-toggle"));

    expect(screen.getByTestId("decision-card-report-1-save")).toBeDisabled();
  });

  it("ouvre le bulletin du trimestre tape via onOpenBulletin", async () => {
    const onOpenBulletin = jest.fn();
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
        onOpenBulletin={onOpenBulletin}
      />,
    );

    fireEvent.press(await screen.findByTestId("decision-card-report-1-toggle"));
    fireEvent.press(screen.getByTestId("decision-card-report-1-open-TERM_2"));

    expect(onOpenBulletin).toHaveBeenCalledWith("student-1", "TERM_2");
  });

  it("ouvre le bulletin annuel via la cellule Moyenne annuelle", async () => {
    const onOpenBulletin = jest.fn();
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
        onOpenBulletin={onOpenBulletin}
      />,
    );

    fireEvent.press(await screen.findByTestId("decision-card-report-1-toggle"));
    fireEvent.press(screen.getByTestId("decision-card-report-1-open-YEARLY"));

    expect(onOpenBulletin).toHaveBeenCalledWith("student-1", "YEARLY");
  });

  it("les cellules de synthese restent inertes sans onOpenBulletin fourni", async () => {
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
      />,
    );

    fireEvent.press(await screen.findByTestId("decision-card-report-1-toggle"));

    expect(
      screen.getByTestId("decision-card-report-1-open-TERM_1"),
    ).toBeDisabled();
  });

  it("affiche un etat vide quand aucun bulletin de decision n'est disponible", async () => {
    promotionsApiMock.listTermReportsForDecision.mockResolvedValue([]);
    render(
      <TeacherPromotionDecisionTab
        schoolSlug="college-vogt"
        classId="class-6eb"
        bottomInset={0}
      />,
    );

    expect(await screen.findByTestId("decision-tab-empty")).toBeOnTheScreen();
  });
});
