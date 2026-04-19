import React from "react";
import { StyleSheet } from "react-native";
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
import { colors } from "../../src/theme";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/account.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
  useDrawer: () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }),
}));

const api = accountApi as jest.Mocked<typeof accountApi>;
let consoleErrorSpy: jest.SpyInstance | undefined;
let consoleWarnSpy: jest.SpyInstance | undefined;

const profileResponse = {
  firstName: "Remi",
  lastName: "Ntamack",
  gender: "M" as const,
  email: "remi@example.com",
  phone: "237650123456",
  role: "PARENT" as const,
  schoolSlug: "college-vogt",
};

const recoveryResponse = {
  schoolRoles: ["PARENT" as const],
  questions: [
    { key: "BIRTH_CITY", label: "Votre ville de naissance" },
    { key: "FAVORITE_SPORT", label: "Votre sport préféré" },
    { key: "FAVORITE_BOOK", label: "Votre livre préféré" },
  ],
  classes: [{ id: "class-1", name: "6e C", schoolYearLabel: "2025-2026" }],
  students: [{ id: "student-1", firstName: "Remi", lastName: "Ntamack" }],
  selectedQuestions: ["BIRTH_CITY", "FAVORITE_SPORT", "FAVORITE_BOOK"],
  birthDate: "2026-04-05",
  parentClassId: "class-1",
  parentStudentId: "student-1",
};

describe("AccountScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    useSuccessToastStore.getState().hide();
    useAuthStore.setState({
      user: {
        id: "user-1",
        firstName: "Remi",
        lastName: "Ntamack",
        email: "remi@example.com",
        phone: "237650123456",
        gender: "M",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "PARENT" }],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
      },
      schoolSlug: "college-vogt",
      isLoading: false,
      isAuthenticated: true,
      accessToken: "token",
      authErrorMessage: null,
    });

    api.getMe.mockResolvedValue(profileResponse);
    api.getRecoveryOptions.mockResolvedValue(recoveryResponse);
    api.updateProfile.mockResolvedValue(profileResponse);
    api.changePassword.mockResolvedValue(undefined);
    api.changePin.mockResolvedValue(undefined);
    api.updateRecovery.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
  });

  it("charge et affiche les informations personnelles", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    expect(screen.getByTestId("account-top-tabs")).toBeTruthy();
    expect(screen.queryByText("Paramètres du compte")).toBeNull();
    expect(
      screen.queryByText(
        /Modifiez uniquement les informations déjà prévues côté web/i,
      ),
    ).toBeNull();
    expect(screen.getByText("Informations personnelles")).toBeTruthy();
    expect(screen.getByText("Remi")).toBeTruthy();
    expect(screen.getByText("Ntamack")).toBeTruthy();
    expect(screen.getByText("650123456")).toBeTruthy();
  });

  it("utilise primaryDark sur le header Mon compte", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    const header = screen.getByTestId("account-header");
    const headerStyle = StyleSheet.flatten(header.props.style);
    expect(headerStyle.backgroundColor).toBe(colors.primaryDark);
  });

  it("édite et enregistre le profil", async () => {
    const updatedProfile = {
      ...profileResponse,
      firstName: "Rémi",
      phone: "237699000111",
    };
    api.updateProfile.mockResolvedValueOnce(updatedProfile);

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-edit-personal"));
    fireEvent.changeText(
      screen.getByTestId("account-first-name-input"),
      "Rémi",
    );
    fireEvent.changeText(
      screen.getByTestId("account-phone-input"),
      "699000111",
    );
    fireEvent.press(screen.getByTestId("account-save-personal"));

    await waitFor(() => {
      expect(api.updateProfile).toHaveBeenCalledWith({
        firstName: "Rémi",
        lastName: "Ntamack",
        gender: "M",
        phone: "699000111",
      });
    });
  });

  it("ouvre la sécurité et charge la récupération", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));

    await waitFor(() => {
      expect(api.getRecoveryOptions).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-recovery-section-toggle"));

    expect(screen.getByTestId("account-birth-date-input")).toBeTruthy();
    expect(screen.getByTestId("account-parent-class-class-1")).toBeTruthy();
    expect(screen.getByTestId("account-parent-student-student-1")).toBeTruthy();
  });

  it("bloque l'enregistrement d'un mot de passe invalide", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));
    fireEvent.press(screen.getByTestId("account-password-section-toggle"));
    fireEvent.changeText(
      screen.getByTestId("account-current-password-input"),
      "Current12",
    );
    fireEvent.changeText(
      screen.getByTestId("account-new-password-input"),
      "simple",
    );
    fireEvent.changeText(
      screen.getByTestId("account-confirm-password-input"),
      "simple",
    );
    fireEvent.press(screen.getByTestId("account-save-password"));

    expect(api.changePassword).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres\./i,
      ),
    ).toBeTruthy();
  });
});
