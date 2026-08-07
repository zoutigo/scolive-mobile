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

/**
 * Régression : l'utilisateur est SCHOOL_HEALTH_OFFICER dans l'école active
 * ("school-1") mais possède aussi des memberships TEACHER/PARENT dans
 * d'autres écoles ("school-2", "school-3") où il n'est pas actuellement
 * connecté. Seuls les rôles de l'école active + les rôles platform doivent
 * apparaître dans le sélecteur de rôle actif.
 */
const multiSchoolMultiRoleProfile = {
  firstName: "Valery",
  lastName: "Mbele",
  gender: "M" as const,
  preferredLocale: "FR" as const,
  email: "valery@example.com",
  phone: "237650123456",
  role: "SCHOOL_HEALTH_OFFICER" as const,
  activeRole: "SCHOOL_HEALTH_OFFICER" as const,
  platformRoles: [],
  memberships: [
    { schoolId: "school-1", role: "SCHOOL_HEALTH_OFFICER" as const },
    { schoolId: "school-2", role: "TEACHER" as const },
    { schoolId: "school-3", role: "PARENT" as const },
  ],
  schoolSlug: "college-vogt",
  activeSchoolId: "school-1",
  schools: [
    {
      schoolId: "school-1",
      slug: "college-vogt",
      name: "Collège Vogt",
      role: "SCHOOL_HEALTH_OFFICER" as const,
    },
    {
      schoolId: "school-2",
      slug: "ayungha-bilingual",
      name: "Ayungha Bilingual College",
      role: "TEACHER" as const,
    },
    {
      schoolId: "school-3",
      slug: "college-frantz-fanon",
      name: "Collège Frantz Fanon",
      role: "PARENT" as const,
    },
  ],
  hasPassword: true,
  hasPhoneCredential: true,
};

/** Même utilisateur mais avec un rôle platform en plus, non lié à une école. */
const platformRoleProfile = {
  ...multiSchoolMultiRoleProfile,
  platformRoles: ["SUPPORT" as const],
};

/** Un seul membership, dans l'école active : le sélecteur doit rester caché. */
const singleRoleProfile = {
  ...multiSchoolMultiRoleProfile,
  memberships: [
    { schoolId: "school-1", role: "SCHOOL_HEALTH_OFFICER" as const },
  ],
  schools: [multiSchoolMultiRoleProfile.schools[0]],
};

const recoveryResponse = {
  schoolRoles: ["SCHOOL_HEALTH_OFFICER" as const],
  questions: [],
  classes: [],
  students: [],
  selectedQuestions: [],
  birthDate: "",
  parentClassId: null,
  parentStudentId: null,
};

function setAuthState() {
  useAuthStore.setState({
    user: {
      id: "user-1",
      firstName: "Valery",
      lastName: "Mbele",
      email: "valery@example.com",
      phone: "237650123456",
      gender: "M",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_HEALTH_OFFICER" }],
      profileCompleted: true,
      role: "SCHOOL_HEALTH_OFFICER",
      activeRole: "SCHOOL_HEALTH_OFFICER",
    },
    schoolSlug: "college-vogt",
    isLoading: false,
    isAuthenticated: true,
    accessToken: "token",
    authErrorMessage: null,
    switchActiveSchool: jest.fn(),
  });
}

describe("AccountScreen — sélecteur de rôle actif (scoping par école active)", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    useSuccessToastStore.getState().hide();
    await AsyncStorage.clear();
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });

    api.getRecoveryOptions.mockResolvedValue(recoveryResponse);
    api.updateProfile.mockResolvedValue(multiSchoolMultiRoleProfile);
    api.changePassword.mockResolvedValue(undefined);
    api.changePin.mockResolvedValue(undefined);
    api.updateRecovery.mockResolvedValue(undefined);
    api.setActiveRole.mockResolvedValue({
      activeRole: "SCHOOL_HEALTH_OFFICER",
    });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
  });

  it("masque le sélecteur de rôle quand l'utilisateur n'a qu'un seul rôle dans l'école active", async () => {
    api.getMe.mockResolvedValue(singleRoleProfile);
    setAuthState();

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    expect(screen.queryByTestId("account-settings-role-card")).toBeNull();
  });

  it("n'expose PAS les rôles détenus dans d'autres écoles que l'école active", async () => {
    api.getMe.mockResolvedValue(multiSchoolMultiRoleProfile);
    setAuthState();

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    // Un seul rôle dans l'école active ("school-1") => pas de card de switch,
    // même si l'utilisateur a des memberships TEACHER/PARENT ailleurs.
    expect(screen.queryByTestId("account-settings-role-card")).toBeNull();
  });

  it("propose le switch de rôle uniquement entre les rôles de l'école active et les rôles platform", async () => {
    api.getMe.mockResolvedValue(platformRoleProfile);
    setAuthState();

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    expect(screen.getByTestId("account-settings-role-card")).toBeTruthy();

    fireEvent.press(screen.getByTestId("account-settings-role-edit"));
    fireEvent.press(screen.getByTestId("settings-active-role-select"));

    // Rôle de l'école active : présent.
    expect(
      await screen.findByTestId(
        "settings-active-role-select-option-SCHOOL_HEALTH_OFFICER",
      ),
    ).toBeTruthy();
    // Rôle platform : présent.
    expect(
      screen.getByTestId("settings-active-role-select-option-SUPPORT"),
    ).toBeTruthy();

    // Rôles détenus dans d'autres écoles : absents.
    expect(
      screen.queryByTestId("settings-active-role-select-option-TEACHER"),
    ).toBeNull();
    expect(
      screen.queryByTestId("settings-active-role-select-option-PARENT"),
    ).toBeNull();
  });

  it("ne propose que le rôle de la nouvelle école active après un changement d'école (pas l'ancienne ni les autres)", async () => {
    const switchedSchoolProfile = {
      ...platformRoleProfile,
      role: "TEACHER" as const,
      activeRole: "TEACHER" as const,
      activeSchoolId: "school-2",
    };
    api.getMe.mockResolvedValue(switchedSchoolProfile);
    setAuthState();

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    expect(screen.getByTestId("account-settings-role-card")).toBeTruthy();

    fireEvent.press(screen.getByTestId("account-settings-role-edit"));
    fireEvent.press(screen.getByTestId("settings-active-role-select"));

    // Rôle de la nouvelle école active ("school-2") : présent.
    expect(
      await screen.findByTestId("settings-active-role-select-option-TEACHER"),
    ).toBeTruthy();
    // Rôle platform : toujours présent.
    expect(
      screen.getByTestId("settings-active-role-select-option-SUPPORT"),
    ).toBeTruthy();

    // Rôle de l'ancienne école active ("school-1") et de la 3e école
    // ("school-3") : absents.
    expect(
      screen.queryByTestId(
        "settings-active-role-select-option-SCHOOL_HEALTH_OFFICER",
      ),
    ).toBeNull();
    expect(
      screen.queryByTestId("settings-active-role-select-option-PARENT"),
    ).toBeNull();
  });
});
