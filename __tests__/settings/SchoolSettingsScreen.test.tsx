import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SchoolSettingsScreen } from "../../src/components/settings/SchoolSettingsScreen";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/curriculums.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
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

const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

function setActiveRole(role: string) {
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "user-1",
      firstName: "Awa",
      lastName: "Ekwalla",
      onboardingHelpEnabled: false,
      activeRole: role,
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role }],
      profileCompleted: true,
    },
  } as never);
}

const LEVELS = [
  {
    id: "own-gen",
    code: "GEN",
    label: "General",
    order: null,
    isNational: false,
    isActivated: true,
  },
  {
    id: "nat-6eme",
    code: "6EME",
    label: "6ème",
    order: 8,
    isNational: true,
    isActivated: true,
  },
  {
    id: "nat-5eme",
    code: "5EME",
    label: "5ème",
    order: 9,
    isNational: true,
    isActivated: false,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  curriculumsApiMock.listAcademicLevels.mockResolvedValue(LEVELS as never);
  curriculumsApiMock.setAcademicLevelActivation.mockResolvedValue({
    success: true,
    activated: true,
  });
  curriculumsApiMock.updateAcademicLevel.mockResolvedValue(LEVELS[0] as never);
});

describe("SchoolSettingsScreen", () => {
  it("refuse l'acces a un role non autorise (ex: enseignant)", async () => {
    setActiveRole("TEACHER");
    render(<SchoolSettingsScreen />);

    expect(await screen.findByText("Accès réservé")).toBeOnTheScreen();
    expect(curriculumsApiMock.listAcademicLevels).not.toHaveBeenCalled();
  });

  it("charge et affiche les niveaux pour un admin ecole", async () => {
    setActiveRole("SCHOOL_ADMIN");
    render(<SchoolSettingsScreen />);

    expect(await screen.findByTestId("level-row-own-gen")).toBeOnTheScreen();
    expect(screen.getByTestId("level-row-nat-6eme")).toBeOnTheScreen();
    expect(
      screen.queryByTestId("level-row-own-gen-toggle"),
    ).not.toBeOnTheScreen();
    expect(screen.getByTestId("level-row-nat-6eme-toggle")).toBeOnTheScreen();
  });

  it("active/desactive un niveau national via le switch", async () => {
    setActiveRole("SCHOOL_MANAGER");
    render(<SchoolSettingsScreen />);

    const toggle = await screen.findByTestId("level-row-nat-5eme-toggle");
    fireEvent(toggle, "valueChange", true);

    await waitFor(() =>
      expect(
        curriculumsApiMock.setAcademicLevelActivation,
      ).toHaveBeenCalledWith("college-vogt", "nat-5eme", true),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Modification enregistrée.",
      ),
    );
  });

  it("enregistre l'ordre d'un niveau propre a l'ecole", async () => {
    setActiveRole("SCHOOL_ADMIN");
    render(<SchoolSettingsScreen />);

    const input = await screen.findByTestId("level-row-own-gen-order-input");
    fireEvent.changeText(input, "5");
    fireEvent.press(screen.getByTestId("level-row-own-gen-order-save"));

    await waitFor(() =>
      expect(curriculumsApiMock.updateAcademicLevel).toHaveBeenCalledWith(
        "college-vogt",
        "own-gen",
        { order: 5 },
      ),
    );
  });

  it("ouvre et ferme l'aide via le menu ... du header, cachee par defaut", async () => {
    setActiveRole("SCHOOL_ADMIN");
    render(<SchoolSettingsScreen />);
    await screen.findByTestId("level-row-own-gen");

    expect(screen.queryByTestId("school-settings-help-title")).toBeNull();

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("school-settings-help-menu-item"));

    expect(
      await screen.findByTestId("school-settings-help-title"),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("school-settings-help-close"));

    await waitFor(() =>
      expect(screen.queryByTestId("school-settings-help-title")).toBeNull(),
    );
  });
});
