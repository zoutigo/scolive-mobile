import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { FinancePaymentsAdminScreen } from "../../src/components/finance/FinancePaymentsAdminScreen";
import { financeApi } from "../../src/api/finance.api";
import { familyApi } from "../../src/api/family.api";
import { teachersApi } from "../../src/api/teachers.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import type { StudentFinanceSummary } from "../../src/types/finance-admin.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/finance.api");
jest.mock("../../src/api/family.api");
jest.mock("../../src/api/teachers.api");
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

const financeApiMock = financeApi as jest.Mocked<typeof financeApi>;
const familyApiMock = familyApi as jest.Mocked<typeof familyApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;

const SUMMARY: StudentFinanceSummary = {
  student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
  decision: {
    decision: "PROMOTED",
    nextAcademicLevelId: "level-1",
    nextTrackId: null,
  },
  feeSchedule: {
    academicLevel: { label: "CE2" },
    track: null,
    installments: [
      {
        id: "inst-1",
        rank: 1,
        label: "1ere echeance",
        amount: 50000,
        dueDate: null,
      },
    ],
  },
  totalPaid: 20000,
  firstInstallmentAmount: 50000,
  reinscriptionEligible: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Awa",
      lastName: "Ekwalla",
      onboardingHelpEnabled: false,
      activeRole: "SCHOOL_ACCOUNTANT",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_ACCOUNTANT" }],
      profileCompleted: true,
    },
  } as never);

  teachersApiMock.listSchoolYears.mockResolvedValue([
    { id: "sy-2026", label: "2026-2027", isActive: false },
  ]);
  familyApiMock.listAdminStudents.mockResolvedValue({
    students: [
      {
        id: "student-1",
        firstName: "Remi",
        lastName: "Ntamack",
        currentEnrollment: null,
      },
    ],
    total: 1,
    page: 1,
    hasMore: false,
  });
  financeApiMock.getStudentFinanceSummary.mockResolvedValue(SUMMARY);
  financeApiMock.recordDirectPayment.mockResolvedValue({
    payment: { id: "payment-1" },
    totalPaid: 50000,
    firstInstallmentAmount: 50000,
    reinscriptionConfirmed: true,
  });
});

async function selectStudentAndYear() {
  fireEvent.changeText(
    screen.getByTestId("finance-payments-search-input"),
    "Ntamack",
  );
  fireEvent.press(screen.getByTestId("finance-payments-search-button"));
  fireEvent.press(
    await screen.findByTestId("finance-payments-student-student-1"),
  );
  fireEvent.press(await screen.findByTestId("finance-payments-target-year"));
  fireEvent.press(
    await screen.findByTestId("finance-payments-target-year-option-sy-2026"),
  );
}

describe("FinancePaymentsAdminScreen", () => {
  it("recherche un eleve et affiche sa situation financiere", async () => {
    render(<FinancePaymentsAdminScreen />);
    await selectStudentAndYear();

    expect(
      await screen.findByTestId("finance-payments-summary"),
    ).toBeOnTheScreen();
    expect(screen.getByText(/Seuil non atteint/)).toBeOnTheScreen();
  });

  it("enregistre un paiement et confirme la reinscription si le seuil est atteint", async () => {
    render(<FinancePaymentsAdminScreen />);
    await selectStudentAndYear();
    await screen.findByTestId("finance-payments-summary");

    fireEvent.changeText(
      screen.getByTestId("finance-payments-amount-input"),
      "30000",
    );
    fireEvent.press(screen.getByTestId("finance-payments-submit"));

    await waitFor(() =>
      expect(financeApiMock.recordDirectPayment).toHaveBeenCalledWith(
        "college-vogt",
        {
          studentId: "student-1",
          schoolYearId: "sy-2026",
          amount: 30000,
          paidAt: expect.any(String),
        },
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Paiement enregistré : la réinscription de l'élève est confirmée.",
      ),
    );
  });
});
