import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SupplyListsAdminScreen } from "../../src/components/supply-lists/SupplyListsAdminScreen";
import { supplyListsApi } from "../../src/api/supply-lists.api";
import { teachersApi } from "../../src/api/teachers.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import type { SupplyListRow } from "../../src/types/supply-lists.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/supply-lists.api");
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

const supplyListsApiMock = supplyListsApi as jest.Mocked<typeof supplyListsApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

const SUPPLY_LIST: SupplyListRow = {
  id: "supply-1",
  academicLevel: { id: "level-1", label: "CE2", code: "CE2" },
  track: null,
  schoolYear: { id: "sy-1", label: "2026-2027" },
  items: [
    {
      id: "item-1",
      rank: 1,
      label: "Cahier 100 pages",
      quantity: 3,
      note: null,
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
      activeRole: "SCHOOL_MANAGER",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_MANAGER" }],
      profileCompleted: true,
    },
  } as never);

  supplyListsApiMock.listSupplyLists.mockResolvedValue([SUPPLY_LIST]);
  supplyListsApiMock.upsertSupplyList.mockResolvedValue(SUPPLY_LIST);
  supplyListsApiMock.deleteSupplyList.mockResolvedValue({ success: true });
  teachersApiMock.listSchoolYears.mockResolvedValue([
    { id: "sy-1", label: "2026-2027", isActive: false },
  ]);
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([
    { id: "level-1", code: "CE2", label: "CE2" },
  ]);
  curriculumsApiMock.listTracks.mockResolvedValue([]);
});

describe("SupplyListsAdminScreen", () => {
  it("charge et affiche les listes de fournitures existantes", async () => {
    render(<SupplyListsAdminScreen />);
    expect(await screen.findByTestId("supply-list-supply-1")).toBeOnTheScreen();
    expect(screen.getByText(/Cahier 100 pages/)).toBeOnTheScreen();
  });

  it("ouvre le formulaire via le FAB et revient a la liste apres Annuler", async () => {
    render(<SupplyListsAdminScreen />);
    await screen.findByTestId("supply-list-supply-1");

    fireEvent.press(screen.getByTestId("supply-lists-fab"));
    expect(
      await screen.findByTestId("supply-list-forms-tab"),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("supply-list-form-cancel"));
    await waitFor(() =>
      expect(screen.getByTestId("supply-lists-fab")).toBeOnTheScreen(),
    );
  });

  it("edite une liste existante avec les valeurs pre-remplies", async () => {
    render(<SupplyListsAdminScreen />);
    await screen.findByTestId("supply-list-supply-1");

    fireEvent.press(screen.getByTestId("supply-list-edit-supply-1"));
    await screen.findByTestId("supply-list-forms-tab");
    expect(
      screen.getByTestId("supply-list-form-item-0-label").props.value,
    ).toBe("Cahier 100 pages");
    expect(
      screen.getByTestId("supply-list-form-item-0-quantity").props.value,
    ).toBe("3");
  });

  it("enregistre une nouvelle liste avec ses articles", async () => {
    render(<SupplyListsAdminScreen />);
    await screen.findByTestId("supply-list-supply-1");

    fireEvent.press(screen.getByTestId("supply-lists-fab"));
    await screen.findByTestId("supply-list-forms-tab");

    fireEvent.press(screen.getByTestId("supply-list-form-year"));
    fireEvent.press(await screen.findByText("2026-2027"));
    fireEvent.press(screen.getByTestId("supply-list-form-level"));
    fireEvent.press(await screen.findByText("CE2"));
    fireEvent.changeText(
      screen.getByTestId("supply-list-form-item-0-label"),
      "Stylo bleu",
    );
    fireEvent.changeText(
      screen.getByTestId("supply-list-form-item-0-quantity"),
      "2",
    );

    fireEvent.press(screen.getByTestId("supply-list-form-submit"));

    await waitFor(() =>
      expect(supplyListsApiMock.upsertSupplyList).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          schoolYearId: "sy-1",
          academicLevelId: "level-1",
          items: [
            expect.objectContaining({
              rank: 1,
              label: "Stylo bleu",
              quantity: 2,
            }),
          ],
        }),
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Liste de fournitures enregistrée.",
      ),
    );
  });

  it("supprime une liste apres confirmation", async () => {
    render(<SupplyListsAdminScreen />);
    await screen.findByTestId("supply-list-supply-1");

    fireEvent.press(screen.getByTestId("supply-list-delete-supply-1"));
    fireEvent.press(await screen.findByText("Supprimer"));

    await waitFor(() =>
      expect(supplyListsApiMock.deleteSupplyList).toHaveBeenCalledWith(
        "college-vogt",
        "supply-1",
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Liste de fournitures supprimée.",
      ),
    );
  });

  it("ouvre la modale d'aide depuis le menu de l'en-tete", async () => {
    render(<SupplyListsAdminScreen />);
    await screen.findByTestId("supply-list-supply-1");

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("supply-lists-help-menu-item"));

    expect(screen.getByText("Aide — Fournitures scolaires")).toBeOnTheScreen();
  });

  it("n'affiche pas le module pour un role non autorise", async () => {
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

    render(<SupplyListsAdminScreen />);
    expect(
      await screen.findByText("Module réservé au personnel administratif"),
    ).toBeOnTheScreen();
  });
});
