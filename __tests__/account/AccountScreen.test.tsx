import React from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  act,
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
import {
  LOCALE_STORAGE_KEY,
  useLocaleStore,
} from "../../src/store/locale.store";
import { colors } from "../../src/theme";

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

const profileResponse = {
  firstName: "Remi",
  lastName: "Ntamack",
  gender: "M" as const,
  preferredLocale: "FR" as const,
  email: "remi@example.com",
  phone: "237650123456",
  role: "PARENT" as const,
  activeRole: "PARENT" as const,
  platformRoles: [],
  memberships: [
    { schoolId: "school-1", role: "PARENT" as const },
    { schoolId: "school-1", role: "TEACHER" as const },
  ],
  schoolSlug: "college-vogt",
  hasPassword: true,
  hasPhoneCredential: true,
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
  beforeEach(async () => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    useSuccessToastStore.getState().hide();
    await AsyncStorage.clear();
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
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
    api.setActiveRole.mockResolvedValue({ activeRole: "TEACHER" });
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

  it("le bouton Enregistrer reste cliquable pendant la saisie (pas de blocage isValid)", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-edit-personal"));

    const saveBtn = screen.getByTestId("account-save-personal");
    expect(saveBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("affiche une erreur de champ si le prénom est vidé", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-edit-personal"));
    fireEvent.changeText(screen.getByTestId("account-first-name-input"), "");
    fireEvent.press(screen.getByTestId("account-save-personal"));

    await waitFor(() => {
      expect(screen.getByText("Le prénom est obligatoire.")).toBeTruthy();
    });

    expect(api.updateProfile).not.toHaveBeenCalled();
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

  it("n'appelle pas l'API si le mot de passe est invalide et affiche l'erreur", async () => {
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

    await act(async () => {
      fireEvent.press(screen.getByTestId("account-save-password"));
    });

    expect(api.changePassword).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByText(
          /Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres\./i,
        ),
      ).toBeTruthy();
    });
  });

  it("le bouton Modifier du mot de passe est actif même sans saisie", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));
    fireEvent.press(screen.getByTestId("account-password-section-toggle"));

    const saveBtn = screen.getByTestId("account-save-password");
    expect(saveBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("affiche l'erreur de mot de passe au changement si le champ est touché", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));
    fireEvent.press(screen.getByTestId("account-password-section-toggle"));
    fireEvent.changeText(
      screen.getByTestId("account-new-password-input"),
      "faible",
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres\./i,
        ),
      ).toBeTruthy();
    });
  });

  it("soumet le changement de mot de passe valide", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));
    fireEvent.press(screen.getByTestId("account-password-section-toggle"));
    fireEvent.changeText(
      screen.getByTestId("account-current-password-input"),
      "OldPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("account-new-password-input"),
      "NewPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("account-confirm-password-input"),
      "NewPass1",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("account-save-password"));
    });

    await waitFor(() => {
      expect(api.changePassword).toHaveBeenCalledWith({
        currentPassword: "OldPass1",
        newPassword: "NewPass1",
      });
    });
  });

  it("le bouton Modifier du PIN est actif sans saisie", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));
    fireEvent.press(screen.getByTestId("account-pin-section-toggle"));

    const saveBtn = screen.getByTestId("account-save-pin");
    expect(saveBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("n'appelle pas l'API PIN si les valeurs sont invalides", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));
    fireEvent.press(screen.getByTestId("account-pin-section-toggle"));
    fireEvent.changeText(
      screen.getByTestId("account-current-pin-input"),
      "123",
    );
    fireEvent.changeText(screen.getByTestId("account-new-pin-input"), "123456");
    fireEvent.changeText(
      screen.getByTestId("account-confirm-pin-input"),
      "999999",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("account-save-pin"));
    });

    expect(api.changePin).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByText(/La confirmation du nouveau PIN ne correspond pas\./i),
      ).toBeTruthy();
    });
  });

  it("affiche l'onglet paramètres en lecture seule avec bouton Modifier par catégorie", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    expect(screen.getByTestId("account-settings-language-card")).toBeTruthy();
    expect(screen.getByTestId("account-settings-role-card")).toBeTruthy();
    expect(screen.getByTestId("account-settings-language-edit")).toBeTruthy();
    expect(screen.getByTestId("account-settings-role-edit")).toBeTruthy();
    expect(
      screen.getByTestId("account-settings-language-value"),
    ).toHaveTextContent("Français");
    expect(screen.getByTestId("account-settings-role-value")).toHaveTextContent(
      "Parent",
    );
    // pas de sélecteurs directement sur la page de lecture
    expect(screen.queryByTestId("account-active-role-TEACHER")).toBeNull();
  });

  it("permet de changer le profil actif via le formulaire dédié", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    fireEvent.press(screen.getByTestId("account-settings-role-edit"));

    expect(screen.getByTestId("settings-active-role-form-hero")).toBeTruthy();

    fireEvent.press(screen.getByTestId("settings-active-role-select"));
    fireEvent.press(
      await screen.findByTestId("settings-active-role-select-option-TEACHER"),
    );
    fireEvent.press(screen.getByTestId("settings-active-role-save"));

    await waitFor(() => {
      expect(api.setActiveRole).toHaveBeenCalledWith({ role: "TEACHER" });
    });

    await waitFor(() => {
      expect(useAuthStore.getState().user?.activeRole).toBe("TEACHER");
    });

    // redirection automatique vers l'onglet paramètres après le toast
    await waitFor(
      () => {
        expect(screen.getByTestId("account-settings-role-card")).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it("annule l'édition du profil actif sans appeler l'API", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    fireEvent.press(screen.getByTestId("account-settings-role-edit"));
    fireEvent.press(screen.getByTestId("settings-active-role-cancel"));

    expect(screen.getByTestId("account-settings-role-card")).toBeTruthy();
    expect(api.setActiveRole).not.toHaveBeenCalled();
  });

  it("bascule l'interface en anglais via le formulaire de langue de l'appareil et persiste le choix", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    expect(
      screen.getByTestId("account-settings-language-value"),
    ).toHaveTextContent("Français");

    fireEvent.press(screen.getByTestId("account-settings-language-edit"));
    expect(
      screen.getByTestId("settings-device-language-form-hero"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("settings-device-language-select"));
    fireEvent.press(
      await screen.findByTestId("settings-device-language-select-option-en"),
    );
    fireEvent.press(screen.getByTestId("settings-device-language-save"));

    expect(useLocaleStore.getState().locale).toBe("en");

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored as string)).toMatchObject({
        state: { locale: "en" },
      });
    });
  });

  it("restaure la langue anglaise persistée au prochain démarrage", async () => {
    await AsyncStorage.setItem(
      LOCALE_STORAGE_KEY,
      JSON.stringify({ state: { locale: "en" }, version: 0 }),
    );
    await useLocaleStore.persist.rehydrate();

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    expect(screen.getByText("Language of this device")).toBeTruthy();
    expect(
      screen.getByTestId("account-settings-language-value"),
    ).toHaveTextContent("English");
  });

  it("affiche la langue du compte et permet de la modifier via le formulaire dédié", async () => {
    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));

    expect(
      screen.getByTestId("account-settings-account-language-card"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("account-settings-account-language-value"),
    ).toHaveTextContent("Français");

    fireEvent.press(
      screen.getByTestId("account-settings-account-language-edit"),
    );
    expect(
      screen.getByTestId("settings-account-language-form-hero"),
    ).toBeTruthy();
  });

  it("met à jour la langue du compte et synchronise la langue de l'appareil", async () => {
    api.updateLanguage.mockResolvedValueOnce({
      ...profileResponse,
      preferredLocale: "EN",
    });

    render(<AccountScreen />);

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    fireEvent.press(
      screen.getByTestId("account-settings-account-language-edit"),
    );

    fireEvent.press(screen.getByTestId("settings-account-language-select"));
    fireEvent.press(
      await screen.findByTestId("settings-account-language-select-option-en"),
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("settings-account-language-save"));
    });

    await waitFor(() => {
      expect(api.updateLanguage).toHaveBeenCalledWith({
        preferredLocale: "EN",
      });
    });

    await waitFor(() => {
      expect(useLocaleStore.getState().locale).toBe("en");
    });

    await waitFor(() => {
      expect(useAuthStore.getState().user?.preferredLocale).toBe("EN");
    });

    await waitFor(() => {
      expect(useSuccessToastStore.getState().message).toBe(
        "La langue de votre compte a été enregistrée.",
      );
    });
  });
});
