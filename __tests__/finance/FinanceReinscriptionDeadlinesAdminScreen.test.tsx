import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { FinanceReinscriptionDeadlinesAdminScreen } from "../../src/components/finance/FinanceReinscriptionDeadlinesAdminScreen";
import { financeApi } from "../../src/api/finance.api";
import { teachersApi } from "../../src/api/teachers.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import type { ReinscriptionDeadlineRow } from "../../src/types/finance-admin.types";

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

jest.mock("../../src/components/DatePickerField", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    DatePickerField: ({
      value,
      onChange,
      testID,
    }: {
      value: string;
      onChange: (v: string) => void;
      testID?: string;
    }) => (
      <TouchableOpacity testID={testID} onPress={() => onChange("2027-06-30")}>
        <Text testID={testID ? `${testID}-value` : undefined}>
          {value || "date-vide"}
        </Text>
      </TouchableOpacity>
    ),
  };
});

const financeApiMock = financeApi as jest.Mocked<typeof financeApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

const DEADLINE: ReinscriptionDeadlineRow = {
  id: "deadline-1",
  academicLevel: { id: "level-1", label: "CE2", code: "CE2" },
  schoolYear: { id: "sy-1", label: "2026-2027" },
  deadline: "2027-05-31T00:00:00.000Z",
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

  financeApiMock.listReinscriptionDeadlines.mockResolvedValue([DEADLINE]);
  financeApiMock.createReinscriptionDeadline.mockResolvedValue(DEADLINE);
  financeApiMock.deleteReinscriptionDeadline.mockResolvedValue({
    success: true,
  });
  teachersApiMock.listSchoolYears.mockResolvedValue([
    { id: "sy-1", label: "2026-2027", isActive: false },
  ]);
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([
    { id: "level-1", code: "CE2", label: "CE2" },
  ]);
});

describe("FinanceReinscriptionDeadlinesAdminScreen", () => {
  it("charge et affiche les delais existants", async () => {
    render(<FinanceReinscriptionDeadlinesAdminScreen />);
    expect(
      await screen.findByTestId("reinscription-deadline-deadline-1"),
    ).toBeOnTheScreen();
  });

  it("ouvre le formulaire via le FAB et revient a la liste apres Annuler", async () => {
    render(<FinanceReinscriptionDeadlinesAdminScreen />);
    await screen.findByTestId("reinscription-deadline-deadline-1");

    fireEvent.press(screen.getByTestId("reinscription-deadlines-fab"));
    expect(
      await screen.findByTestId("reinscription-deadline-form-tab"),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("reinscription-deadline-form-cancel"));
    await waitFor(() =>
      expect(
        screen.getByTestId("reinscription-deadlines-fab"),
      ).toBeOnTheScreen(),
    );
  });

  it("cree un nouveau delai avec annee, niveau et date", async () => {
    render(<FinanceReinscriptionDeadlinesAdminScreen />);
    await screen.findByTestId("reinscription-deadline-deadline-1");

    fireEvent.press(screen.getByTestId("reinscription-deadlines-fab"));
    await screen.findByTestId("reinscription-deadline-form-tab");

    fireEvent.press(screen.getByTestId("reinscription-deadline-form-year"));
    fireEvent.press(
      screen.getByTestId("reinscription-deadline-form-year-option-sy-1"),
    );
    fireEvent.press(screen.getByTestId("reinscription-deadline-form-level"));
    fireEvent.press(
      screen.getByTestId("reinscription-deadline-form-level-option-level-1"),
    );
    fireEvent.press(screen.getByTestId("reinscription-deadline-form-deadline"));

    fireEvent.press(screen.getByTestId("reinscription-deadline-form-submit"));

    await waitFor(() =>
      expect(financeApiMock.createReinscriptionDeadline).toHaveBeenCalledWith(
        "college-vogt",
        {
          schoolYearId: "sy-1",
          academicLevelId: "level-1",
          deadline: "2027-06-30",
        },
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe("Délai enregistré."),
    );
  });

  it("bloque l'envoi tant que le niveau ou la date ne sont pas renseignes", async () => {
    render(<FinanceReinscriptionDeadlinesAdminScreen />);
    await screen.findByTestId("reinscription-deadline-deadline-1");

    fireEvent.press(screen.getByTestId("reinscription-deadlines-fab"));
    await screen.findByTestId("reinscription-deadline-form-tab");

    fireEvent.press(screen.getByTestId("reinscription-deadline-form-submit"));

    expect(financeApiMock.createReinscriptionDeadline).not.toHaveBeenCalled();
  });

  it("supprime un delai apres confirmation", async () => {
    render(<FinanceReinscriptionDeadlinesAdminScreen />);
    await screen.findByTestId("reinscription-deadline-deadline-1");

    fireEvent.press(
      screen.getByTestId("reinscription-deadline-delete-deadline-1"),
    );
    fireEvent.press(await screen.findByText("Supprimer"));

    await waitFor(() =>
      expect(financeApiMock.deleteReinscriptionDeadline).toHaveBeenCalledWith(
        "college-vogt",
        "deadline-1",
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe("Délai supprimé."),
    );
  });

  it("affiche un etat verrouille pour un role non autorise", async () => {
    useAuthStore.setState({
      schoolSlug: "college-vogt",
      user: {
        id: "teacher-1",
        firstName: "Awa",
        lastName: "Ekwalla",
        onboardingHelpEnabled: false,
        activeRole: "TEACHER",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
        profileCompleted: true,
      },
    } as never);

    render(<FinanceReinscriptionDeadlinesAdminScreen />);

    expect(
      await screen.findByText("Module réservé au personnel administratif"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId("reinscription-deadlines-fab"),
    ).not.toBeOnTheScreen();
  });
});
