import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { PromotionsAdminScreen } from "../../src/components/promotions/PromotionsAdminScreen";
import { promotionsApi } from "../../src/api/promotions.api";
import { teachersApi } from "../../src/api/teachers.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/promotions.api");
jest.mock("../../src/api/teachers.api");
jest.mock("../../src/api/curriculums.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const promotionsApiMock = promotionsApi as jest.Mocked<typeof promotionsApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

const CLASSROOMS = [
  {
    id: "class-source",
    name: "CE1 A",
    schoolYear: { id: "sy-2025", label: "2025-2026" },
  },
  {
    id: "class-target",
    name: "CE2 A",
    schoolYear: { id: "sy-2026", label: "2026-2027" },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Awa",
      lastName: "Ekwalla",
      onboardingHelpEnabled: false,
      activeRole: "SCHOOL_ADMIN",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
    },
  } as never);

  teachersApiMock.listClassrooms.mockResolvedValue(CLASSROOMS as never);
  teachersApiMock.listSchoolYears.mockResolvedValue([
    { id: "sy-2025", label: "2025-2026", isActive: true },
    { id: "sy-2026", label: "2026-2027", isActive: false },
  ]);
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([
    { id: "level-ce2", code: "CE2", label: "CE2" },
  ]);
  promotionsApiMock.listTermReportsForDecision.mockResolvedValue([
    {
      id: "report-1",
      student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
      decision: null,
      nextAcademicLevel: null,
      nextTrack: null,
      termAverages: { TERM_1: null, TERM_2: null, TERM_3: null },
      yearlyAverage: null,
      rank: null,
      classSize: null,
      currentAcademicLevel: null,
    },
  ]);
  promotionsApiMock.setTermReportDecision.mockResolvedValue({
    id: "report-1",
    student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
    decision: "PROMOTED",
    nextAcademicLevel: { id: "level-ce2", label: "CE2" },
    nextTrack: null,
    termAverages: { TERM_1: null, TERM_2: null, TERM_3: null },
    yearlyAverage: null,
    rank: null,
    classSize: null,
    currentAcademicLevel: null,
  });
  promotionsApiMock.listWaitingEnrollments.mockResolvedValue([
    {
      id: "enr-waiting-1",
      student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
      academicLevel: { id: "level-ce2", label: "CE2" },
      track: null,
    },
  ]);
  promotionsApiMock.assignEnrollmentToClass.mockResolvedValue({
    id: "enr-waiting-1",
  });
});

describe("PromotionsAdminScreen", () => {
  it("charge les bulletins d'une classe et enregistre une decision", async () => {
    render(<PromotionsAdminScreen />);

    fireEvent.press(await screen.findByTestId("promotions-admin-class-select"));
    fireEvent.press(
      await screen.findByTestId(
        "promotions-admin-class-select-option-class-source",
      ),
    );

    expect(await screen.findByTestId("term-report-report-1")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("term-report-report-1-decision"));
    fireEvent.press(
      await screen.findByTestId(
        "term-report-report-1-decision-option-PROMOTED",
      ),
    );
    fireEvent.press(screen.getByTestId("term-report-report-1-level"));
    fireEvent.press(
      await screen.findByTestId("term-report-report-1-level-option-level-ce2"),
    );
    fireEvent.press(screen.getByTestId("term-report-report-1-save"));

    await waitFor(() =>
      expect(promotionsApiMock.setTermReportDecision).toHaveBeenCalledWith(
        "college-vogt",
        "report-1",
        { decision: "PROMOTED", nextAcademicLevelId: "level-ce2" },
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Décision enregistrée.",
      ),
    );
  });

  it("liste les eleves en attente et les affecte a une classe cible", async () => {
    render(<PromotionsAdminScreen />);

    fireEvent.press(await screen.findByTestId("promotions-admin-tab-waiting"));

    fireEvent.press(await screen.findByTestId("promotions-admin-target-year"));
    fireEvent.press(
      await screen.findByTestId("promotions-admin-target-year-option-sy-2026"),
    );

    expect(
      await screen.findByTestId("waiting-enrollment-enr-waiting-1"),
    ).toBeOnTheScreen();

    fireEvent.press(
      screen.getByTestId("waiting-enrollment-enr-waiting-1-class"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "waiting-enrollment-enr-waiting-1-class-option-class-target",
      ),
    );
    fireEvent.press(
      screen.getByTestId("waiting-enrollment-enr-waiting-1-assign"),
    );

    await waitFor(() =>
      expect(promotionsApiMock.assignEnrollmentToClass).toHaveBeenCalledWith(
        "college-vogt",
        "enr-waiting-1",
        "class-target",
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Élève affecté à la classe.",
      ),
    );
  });
});
