import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AccountScreen } from "../../src/components/account/AccountScreen";
import { accountApi } from "../../src/api/account.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import { useLocaleStore } from "../../src/store/locale.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/account.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
  useDrawer: () => ({
    openDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

const api = accountApi as jest.Mocked<typeof accountApi>;
let consoleErrorSpy: jest.SpyInstance | undefined;
let consoleWarnSpy: jest.SpyInstance | undefined;

const multiSchoolProfile = {
  firstName: "Remi",
  lastName: "Ntamack",
  gender: "M" as const,
  preferredLocale: "FR" as const,
  email: "remi@example.com",
  phone: "237650123456",
  role: "TEACHER" as const,
  activeRole: "TEACHER" as const,
  platformRoles: [],
  memberships: [
    { schoolId: "school-1", role: "TEACHER" as const },
    { schoolId: "school-2", role: "TEACHER" as const },
  ],
  schoolSlug: "college-a",
  activeSchoolId: "school-1",
  schools: [
    {
      schoolId: "school-1",
      slug: "college-a",
      name: "Collège A",
      role: "TEACHER" as const,
    },
    {
      schoolId: "school-2",
      slug: "college-b",
      name: "Collège B",
      role: "TEACHER" as const,
    },
  ],
  hasPassword: true,
  hasPhoneCredential: true,
};

const singleSchoolProfile = {
  ...multiSchoolProfile,
  memberships: [{ schoolId: "school-1", role: "TEACHER" as const }],
  schools: [multiSchoolProfile.schools[0]],
};

const recoveryResponse = {
  schoolRoles: ["TEACHER" as const],
  questions: [],
  classes: [],
  students: [],
  selectedQuestions: [],
  birthDate: "",
  parentClassId: null,
  parentStudentId: null,
};

function setAuthState(switchActiveSchool: jest.Mock) {
  useAuthStore.setState({
    user: {
      id: "user-1",
      firstName: "Remi",
      lastName: "Ntamack",
      email: "remi@example.com",
      phone: "237650123456",
      gender: "M",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "TEACHER" }],
      profileCompleted: true,
      role: "TEACHER",
      activeRole: "TEACHER",
    },
    schoolSlug: "college-a",
    isLoading: false,
    isAuthenticated: true,
    accessToken: "token",
    authErrorMessage: null,
    switchActiveSchool,
  });
}

describe("AccountScreen — sélecteur d'école active", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    useSuccessToastStore.getState().hide();
    await AsyncStorage.clear();
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });

    api.getRecoveryOptions.mockResolvedValue(recoveryResponse);
    api.updateProfile.mockResolvedValue(multiSchoolProfile);
    api.changePassword.mockResolvedValue(undefined);
    api.changePin.mockResolvedValue(undefined);
    api.updateRecovery.mockResolvedValue(undefined);
    api.setActiveRole.mockResolvedValue({ activeRole: "TEACHER" });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
  });

  it("masque le sélecteur d'école quand l'utilisateur n'a qu'une seule école", async () => {
    api.getMe.mockResolvedValue(singleSchoolProfile);
    setAuthState(jest.fn());

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    expect(screen.queryByTestId("account-settings-school-card")).toBeNull();
  });

  it("affiche l'école active en lecture seule avec un bouton Modifier quand il y en a plusieurs", async () => {
    api.getMe.mockResolvedValue(multiSchoolProfile);
    setAuthState(jest.fn());

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    expect(screen.getByTestId("account-settings-school-card")).toBeTruthy();
    expect(screen.getByTestId("account-settings-school-edit")).toBeTruthy();
    expect(
      screen.getByTestId("account-settings-school-value"),
    ).toHaveTextContent(/Collège A/);
  });

  it("change l'école active via le formulaire dédié et affiche un succès", async () => {
    api.getMe.mockResolvedValue(multiSchoolProfile);
    const switchActiveSchool = jest.fn().mockResolvedValue("college-b");
    setAuthState(switchActiveSchool);

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    fireEvent.press(screen.getByTestId("account-settings-school-edit"));

    expect(screen.getByTestId("settings-active-school-form-hero")).toBeTruthy();

    fireEvent.press(screen.getByTestId("settings-active-school-select"));
    fireEvent.press(
      await screen.findByTestId(
        "settings-active-school-select-option-school-2",
      ),
    );
    fireEvent.press(screen.getByTestId("settings-active-school-save"));

    await waitFor(() => {
      expect(switchActiveSchool).toHaveBeenCalledWith("school-2");
    });

    await waitFor(() => {
      expect(useSuccessToastStore.getState().visible).toBe(true);
    });
  });

  it("filtre les écoles par la recherche dans le formulaire d'édition (plus de 5 écoles)", async () => {
    const manySchoolsProfile = {
      ...multiSchoolProfile,
      schools: [
        ...multiSchoolProfile.schools,
        {
          schoolId: "school-3",
          slug: "college-c",
          name: "Collège C",
          role: "TEACHER" as const,
        },
        {
          schoolId: "school-4",
          slug: "college-d",
          name: "Collège D",
          role: "TEACHER" as const,
        },
        {
          schoolId: "school-5",
          slug: "college-e",
          name: "Collège E",
          role: "TEACHER" as const,
        },
        {
          schoolId: "school-6",
          slug: "college-f",
          name: "Collège F",
          role: "TEACHER" as const,
        },
      ],
    };
    api.getMe.mockResolvedValue(manySchoolsProfile);
    setAuthState(jest.fn());

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    fireEvent.press(screen.getByTestId("account-settings-school-edit"));
    fireEvent.press(screen.getByTestId("settings-active-school-select"));

    fireEvent.changeText(
      await screen.findByTestId("settings-active-school-select-search"),
      "Collège B",
    );

    expect(
      screen.getByTestId("settings-active-school-select-option-school-2"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("settings-active-school-select-option-school-1"),
    ).toBeNull();
  });

  it("n'affiche pas de recherche pour l'école active quand il y a 5 écoles ou moins", async () => {
    api.getMe.mockResolvedValue(multiSchoolProfile);
    setAuthState(jest.fn());

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    fireEvent.press(screen.getByTestId("account-settings-school-edit"));
    fireEvent.press(screen.getByTestId("settings-active-school-select"));

    await waitFor(() => {
      expect(
        screen.getByTestId("settings-active-school-select-option-school-1"),
      ).toBeTruthy();
    });
    expect(
      screen.queryByTestId("settings-active-school-select-search"),
    ).toBeNull();
  });
});
