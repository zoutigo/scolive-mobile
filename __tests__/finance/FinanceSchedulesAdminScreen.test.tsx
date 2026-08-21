import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { FinanceSchedulesAdminScreen } from "../../src/components/finance/FinanceSchedulesAdminScreen";
import { financeApi } from "../../src/api/finance.api";
import { teachersApi } from "../../src/api/teachers.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import type { FeeScheduleRow } from "../../src/types/finance-admin.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/finance.api");
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

const financeApiMock = financeApi as jest.Mocked<typeof financeApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

const SCHEDULE: FeeScheduleRow = {
  id: "fee-1",
  academicLevel: { id: "level-1", label: "CE2", code: "CE2" },
  track: null,
  schoolYear: { id: "sy-1", label: "2026-2027" },
  installments: [
    {
      id: "inst-1",
      rank: 1,
      label: "1ere echeance",
      amount: 50000,
      dueDate: null,
    },
  ],
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

  financeApiMock.listFeeSchedules.mockResolvedValue([SCHEDULE]);
  financeApiMock.upsertFeeSchedule.mockResolvedValue(SCHEDULE);
  financeApiMock.deleteFeeSchedule.mockResolvedValue({ success: true });
  financeApiMock.getFinanceSettings.mockResolvedValue({
    reinscriptionThresholdPolicy: "FIRST_INSTALLMENT",
  });
  financeApiMock.updateFinanceSettings.mockResolvedValue({
    reinscriptionThresholdPolicy: "FULL_PAYMENT",
  });
  teachersApiMock.listSchoolYears.mockResolvedValue([
    { id: "sy-1", label: "2026-2027", isActive: false },
  ]);
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([
    { id: "level-1", code: "CE2", label: "CE2" },
  ]);
  curriculumsApiMock.listTracks.mockResolvedValue([]);
});

describe("FinanceSchedulesAdminScreen", () => {
  it("charge et affiche les echeanciers existants", async () => {
    render(<FinanceSchedulesAdminScreen />);
    expect(await screen.findByTestId("fee-schedule-fee-1")).toBeOnTheScreen();
  });

  it("ouvre le formulaire via le FAB et revient a la liste apres Annuler", async () => {
    render(<FinanceSchedulesAdminScreen />);
    await screen.findByTestId("fee-schedule-fee-1");

    fireEvent.press(screen.getByTestId("fee-schedules-fab"));
    expect(
      await screen.findByTestId("fee-schedule-forms-tab"),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("fee-schedule-form-cancel"));
    await waitFor(() =>
      expect(screen.getByTestId("fee-schedules-fab")).toBeOnTheScreen(),
    );
  });

  it("edite un echeancier existant avec les valeurs pre-remplies", async () => {
    render(<FinanceSchedulesAdminScreen />);
    await screen.findByTestId("fee-schedule-fee-1");

    fireEvent.press(screen.getByTestId("fee-schedule-edit-fee-1"));
    await screen.findByTestId("fee-schedule-forms-tab");
    expect(
      screen.getByTestId("fee-schedule-form-installment-0-label").props.value,
    ).toBe("1ere echeance");
  });

  it("supprime un echeancier apres confirmation", async () => {
    render(<FinanceSchedulesAdminScreen />);
    await screen.findByTestId("fee-schedule-fee-1");

    fireEvent.press(screen.getByTestId("fee-schedule-delete-fee-1"));
    fireEvent.press(await screen.findByText("Supprimer"));

    await waitFor(() =>
      expect(financeApiMock.deleteFeeSchedule).toHaveBeenCalledWith(
        "college-vogt",
        "fee-1",
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Échéancier supprimé.",
      ),
    );
  });

  it("charge la politique de seuil courante et permet de la changer", async () => {
    render(<FinanceSchedulesAdminScreen />);
    await screen.findByTestId("fee-schedule-fee-1");

    await waitFor(() =>
      expect(financeApiMock.getFinanceSettings).toHaveBeenCalledWith(
        "college-vogt",
      ),
    );

    fireEvent.press(screen.getByTestId("reinscription-policy-full-payment"));

    await waitFor(() =>
      expect(financeApiMock.updateFinanceSettings).toHaveBeenCalledWith(
        "college-vogt",
        { reinscriptionThresholdPolicy: "FULL_PAYMENT" },
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Politique de réinscription mise à jour.",
      ),
    );
  });

  it("revient a la politique precedente si la mise a jour echoue", async () => {
    financeApiMock.updateFinanceSettings.mockRejectedValue(
      new Error("network error"),
    );
    render(<FinanceSchedulesAdminScreen />);
    await screen.findByTestId("fee-schedule-fee-1");

    fireEvent.press(screen.getByTestId("reinscription-policy-full-payment"));

    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Impossible de mettre à jour la politique de réinscription.",
      ),
    );
    expect(useSuccessToastStore.getState().variant).toBe("error");
  });
});
