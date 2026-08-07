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

beforeEach(() => {
  jest.clearAllMocks();
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([
    { id: "level-ce2", code: "CE2", label: "CE2" },
  ] as never);
  promotionsApiMock.listTermReportsForDecision.mockResolvedValue([
    {
      id: "report-1",
      student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
      decision: null,
      nextAcademicLevel: null,
      nextTrack: null,
      termAverages: { TERM_1: 12, TERM_2: 14, TERM_3: 16 },
      yearlyAverage: 14,
      rank: 2,
      classSize: 25,
    },
  ] as never);
  promotionsApiMock.setTermReportDecision.mockResolvedValue({
    id: "report-1",
    student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
    decision: "PROMOTED",
    nextAcademicLevel: { id: "level-ce2", label: "CE2" },
    nextTrack: null,
    termAverages: { TERM_1: 12, TERM_2: 14, TERM_3: 16 },
    yearlyAverage: 14,
    rank: 2,
    classSize: 25,
  } as never);
});

describe("TeacherPromotionDecisionTab", () => {
  it("affiche la synthese annuelle (T1/T2/T3, moyenne, rang) puis enregistre une decision", async () => {
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
    expect(promotionsApiMock.listTermReportsForDecision).toHaveBeenCalledWith(
      "college-vogt",
      "class-6eb",
    );
    expect(screen.getByText("12")).toBeOnTheScreen();
    expect(screen.getByText("16")).toBeOnTheScreen();
    expect(screen.getAllByText("14")).toHaveLength(2);

    fireEvent.press(screen.getByTestId("decision-card-report-1-decision"));
    fireEvent.press(
      await screen.findByTestId(
        "decision-card-report-1-decision-option-PROMOTED",
      ),
    );
    fireEvent.press(screen.getByTestId("decision-card-report-1-level"));
    fireEvent.press(
      await screen.findByTestId(
        "decision-card-report-1-level-option-level-ce2",
      ),
    );
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
