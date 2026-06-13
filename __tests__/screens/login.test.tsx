import React from "react";
import { StyleSheet } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import LoginScreen from "../../app/login";
import { authApi } from "../../src/api/auth.api";
import { signInWithGoogleAsync } from "../../src/auth/google-auth";
import { useAuthStore } from "../../src/store/auth.store";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import { useLocaleStore } from "../../src/store/locale.store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "100",
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  __esModule: true,
  default: {
    OS: "android",
    select: (options: Record<string, unknown>) =>
      options.android ?? options.default,
  },
  OS: "android",
  select: (options: Record<string, unknown>) =>
    options.android ?? options.default,
}));
jest.mock("../../src/api/auth.api");
jest.mock("../../src/auth/google-auth", () => {
  class MockGoogleAuthError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "GoogleAuthError";
      this.code = code;
    }
  }

  return {
    GoogleAuthError: MockGoogleAuthError,
    signInWithGoogleAsync: jest.fn(),
  };
});
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("@react-native-async-storage/async-storage");
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockGoogleAuth = signInWithGoogleAsync as jest.MockedFunction<
  typeof signInWithGoogleAsync
>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const { GoogleAuthError } = require("../../src/auth/google-auth") as {
  GoogleAuthError: new (code: string, message: string) => Error;
};
const { router: mockRouter } = require("expo-router") as {
  router: { push: jest.Mock; replace: jest.Mock; back: jest.Mock };
};

const mockHandleLoginResponse = jest.fn().mockResolvedValue(undefined);

const fakeLoginResponse = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  tokenType: "Bearer" as const,
  expiresIn: 86400,
  refreshExpiresIn: 2592000,
  schoolSlug: "lycee-bilingue",
};

function makeApiError(code: string, status = 401) {
  const err = new Error(code) as Error & {
    code: string;
    statusCode: number;
    email?: string | null;
    schoolSlug?: string | null;
    setupToken?: string | null;
    username?: string | null;
  };
  err.code = code;
  err.statusCode = status;
  return err;
}

/** Ouvre le switcher de méthode et sélectionne la méthode voulue */
async function switchToMethod(targetMethod: string) {
  fireEvent.press(screen.getByTestId("link-switch-method"));
  await waitFor(() =>
    expect(screen.getByTestId(`modal-tab-${targetMethod}`)).toBeOnTheScreen(),
  );
  fireEvent.press(screen.getByTestId(`modal-tab-${targetMethod}`));
}

beforeEach(() => {
  jest.clearAllMocks();
  // By default AsyncStorage.getItem returns null (no stored preference)
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);
  useLocaleStore.setState({ locale: DEFAULT_LOCALE });
  const { useLocalSearchParams } = require("expo-router") as {
    useLocalSearchParams: jest.Mock;
  };
  useLocalSearchParams.mockReturnValue({});
  mockUseAuthStore.mockImplementation((selector: unknown) => {
    if (typeof selector === "function") {
      return selector({
        handleLoginResponse: mockHandleLoginResponse,
      });
    }
    return {
      handleLoginResponse: mockHandleLoginResponse,
    } as ReturnType<typeof useAuthStore>;
  });
});

// ─────────────────────────────────────────────────────────────
// En-tête
// ─────────────────────────────────────────────────────────────
describe("En-tête", () => {
  it("affiche la marque en deux parties", () => {
    render(<LoginScreen />);
    expect(screen.getByText("SCO")).toBeOnTheScreen();
    expect(screen.getByText("LIVE")).toBeOnTheScreen();
  });

  it("affiche le tagline", () => {
    render(<LoginScreen />);
    expect(screen.getByText("Votre école en temps réel.")).toBeOnTheScreen();
  });
});

// ─────────────────────────────────────────────────────────────
// Sélecteur de langue (paramètre machine)
// ─────────────────────────────────────────────────────────────
describe("Sélecteur de langue de l'appareil", () => {
  it("affiche FR et EN avec le français sélectionné par défaut", () => {
    render(<LoginScreen />);

    expect(screen.getByTestId("login-language-switcher")).toBeOnTheScreen();
    expect(screen.getByTestId("login-language-fr")).toBeOnTheScreen();
    expect(screen.getByTestId("login-language-en")).toBeOnTheScreen();
    expect(useLocaleStore.getState().locale).toBe("fr");
  });

  it("bascule la langue de l'appareil en anglais au clic sur EN", () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId("login-language-en"));

    expect(useLocaleStore.getState().locale).toBe("en");
  });

  it("traduit immédiatement tout l'écran en anglais au clic sur EN, sans rechargement", () => {
    render(<LoginScreen />);

    expect(screen.getByText("Votre école en temps réel.")).toBeOnTheScreen();
    expect(screen.getByText("Connexion par téléphone")).toBeOnTheScreen();
    expect(screen.getByText("Numéro de téléphone")).toBeOnTheScreen();
    expect(screen.getByText("Code PIN")).toBeOnTheScreen();
    expect(screen.getByText("Se connecter")).toBeOnTheScreen();
    expect(screen.getByText("PIN oublié ?")).toBeOnTheScreen();
    expect(screen.getByText("Se connecter autrement →")).toBeOnTheScreen();
    expect(
      screen.getByText("© 2026 Scolive. Tous droits réservés."),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("login-language-en"));

    expect(screen.getByText("Your school, in real time.")).toBeOnTheScreen();
    expect(screen.getByText("Sign in with phone")).toBeOnTheScreen();
    expect(screen.getByText("Phone number")).toBeOnTheScreen();
    expect(screen.getByText("PIN code")).toBeOnTheScreen();
    expect(screen.getByText("Sign in")).toBeOnTheScreen();
    expect(screen.getByText("Forgot your PIN?")).toBeOnTheScreen();
    expect(screen.getByText("Sign in another way →")).toBeOnTheScreen();
    expect(
      screen.getByText("© 2026 Scolive. All rights reserved."),
    ).toBeOnTheScreen();

    expect(
      screen.queryByText("Votre école en temps réel."),
    ).not.toBeOnTheScreen();
    expect(screen.queryByText("Connexion par téléphone")).not.toBeOnTheScreen();
    expect(screen.queryByText("Se connecter")).not.toBeOnTheScreen();
  });

  it("traduit de nouveau l'écran en français au clic sur FR", () => {
    useLocaleStore.setState({ locale: "en" });
    render(<LoginScreen />);

    expect(screen.getByText("Your school, in real time.")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("login-language-fr"));

    expect(screen.getByText("Votre école en temps réel.")).toBeOnTheScreen();
    expect(screen.getByText("Connexion par téléphone")).toBeOnTheScreen();
    expect(screen.getByText("Se connecter")).toBeOnTheScreen();
  });

  it("garde le nom de marque SCOLIVE inchangé dans les deux langues", () => {
    render(<LoginScreen />);

    expect(screen.getByText("SCO")).toBeOnTheScreen();
    expect(screen.getByText("LIVE")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("login-language-en"));

    expect(screen.getByText("SCO")).toBeOnTheScreen();
    expect(screen.getByText("LIVE")).toBeOnTheScreen();
  });
});

// ─────────────────────────────────────────────────────────────
// Méthode par défaut
// ─────────────────────────────────────────────────────────────
describe("Méthode par défaut", () => {
  it("affiche le formulaire Téléphone par défaut (sans AsyncStorage)", async () => {
    render(<LoginScreen />);
    // Attendre que l'effet AsyncStorage se soit exécuté
    await waitFor(() =>
      expect(screen.getByTestId("panel-phone")).toBeOnTheScreen(),
    );
    expect(screen.queryByTestId("panel-email")).toBeNull();
    expect(screen.queryByTestId("panel-username")).toBeNull();
    expect(screen.queryByTestId("panel-google")).toBeNull();
  });

  it("affiche le formulaire username si AsyncStorage preferred_auth_method = 'username'", async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce("username");
    render(<LoginScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("panel-username")).toBeOnTheScreen(),
    );
    expect(screen.queryByTestId("panel-phone")).toBeNull();
  });

  it("affiche le formulaire email si AsyncStorage preferred_auth_method = 'email'", async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce("email");
    render(<LoginScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("panel-email")).toBeOnTheScreen(),
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Lien "Se connecter autrement"
// ─────────────────────────────────────────────────────────────
describe("Lien Se connecter autrement", () => {
  it("affiche le lien 'Se connecter autrement'", () => {
    render(<LoginScreen />);
    expect(screen.getByTestId("link-switch-method")).toBeOnTheScreen();
  });

  it("ouvre la liste des méthodes quand on clique 'Se connecter autrement'", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    fireEvent.press(screen.getByTestId("link-switch-method"));
    await waitFor(() =>
      // email, username ou google doivent être proposés (pas phone car c'est la méthode active)
      expect(screen.getByTestId("modal-tab-email")).toBeOnTheScreen(),
    );
  });

  it("sélectionner 'Email' depuis le switcher affiche le formulaire email", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    expect(screen.getByTestId("panel-email")).toBeOnTheScreen();
    expect(screen.queryByTestId("panel-phone")).toBeNull();
  });

  it("sélectionner 'username' depuis le switcher affiche le formulaire username", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("username");
    expect(screen.getByTestId("panel-username")).toBeOnTheScreen();
  });
});

// ─────────────────────────────────────────────────────────────
// Champs sécurisés
// ─────────────────────────────────────────────────────────────
describe("Champs sécurisés", () => {
  it("permet d'afficher le PIN saisi", () => {
    render(<LoginScreen />);

    expect(screen.getByTestId("input-pin").props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByTestId("input-pin-toggle-visibility"));
    expect(screen.getByTestId("input-pin").props.secureTextEntry).toBe(false);
  });

  it("permet d'afficher le mot de passe saisi (formulaire email)", async () => {
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    expect(screen.getByTestId("input-password").props.secureTextEntry).toBe(
      true,
    );
    fireEvent.press(screen.getByTestId("input-password-toggle-visibility"));
    expect(screen.getByTestId("input-password").props.secureTextEntry).toBe(
      false,
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Formulaire Téléphone — rendu
// ─────────────────────────────────────────────────────────────
describe("Formulaire Téléphone — rendu", () => {
  it("affiche le préfixe +237", () => {
    render(<LoginScreen />);
    expect(screen.getByText("+237")).toBeOnTheScreen();
  });

  it("affiche les champs téléphone et PIN", () => {
    render(<LoginScreen />);
    expect(screen.getByTestId("input-phone")).toBeOnTheScreen();
    expect(screen.getByTestId("input-pin")).toBeOnTheScreen();
  });

  it("accepte la saisie du numéro et du PIN", () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    expect(screen.getByDisplayValue("612345678")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("123456")).toBeOnTheScreen();
  });
});

// ─────────────────────────────────────────────────────────────
// Formulaire Téléphone — validation
// ─────────────────────────────────────────────────────────────
describe("Formulaire Téléphone — validation", () => {
  it("affiche une erreur si le numéro est vide", async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));
    await waitFor(() =>
      expect(
        screen.getByText("Numéro de téléphone invalide."),
      ).toBeOnTheScreen(),
    );
    expect(mockAuthApi.loginPhone).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le PIN fait moins de 6 chiffres", async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123");
    fireEvent.press(screen.getByTestId("submit-login"));
    await waitFor(() =>
      expect(
        screen.getByText("Le code PIN doit contenir exactement 6 chiffres."),
      ).toBeOnTheScreen(),
    );
    expect(mockAuthApi.loginPhone).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// Formulaire Téléphone — soumission
// ─────────────────────────────────────────────────────────────
describe("Formulaire Téléphone — soumission", () => {
  it("appelle loginPhone avec +237 et redirige en cas de succès", async () => {
    mockAuthApi.loginPhone.mockResolvedValueOnce(fakeLoginResponse);
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() => {
      expect(mockAuthApi.loginPhone).toHaveBeenCalledWith(
        "+237612345678",
        "123456",
      );
      expect(mockHandleLoginResponse).toHaveBeenCalledWith(fakeLoginResponse);
      expect(mockRouter.replace).toHaveBeenCalledWith("/");
    });
  });

  it("enregistre 'phone' dans AsyncStorage après connexion réussie", async () => {
    mockAuthApi.loginPhone.mockResolvedValueOnce(fakeLoginResponse);
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      "preferred_auth_method",
      "phone",
    );
  });

  it("redirige vers l'onboarding si le profil téléphone doit être complété", async () => {
    const err = makeApiError("PROFILE_SETUP_REQUIRED", 403);
    err.setupToken = "setup-token-phone";
    err.schoolSlug = "lycee-bilingue";
    mockAuthApi.loginPhone.mockRejectedValueOnce(err);
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/onboarding",
        params: {
          schoolSlug: "lycee-bilingue",
          setupToken: "setup-token-phone",
        },
      }),
    );
    expect(screen.queryByTestId("error-message")).toBeNull();
  });

  it("affiche une erreur INVALID_CREDENTIALS", async () => {
    mockAuthApi.loginPhone.mockRejectedValueOnce(
      makeApiError("INVALID_CREDENTIALS"),
    );
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "000000");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(
        screen.getByText("Identifiants incorrects. Vérifiez vos informations."),
      ).toBeOnTheScreen(),
    );
  });

  it("affiche une erreur AUTH_RATE_LIMITED", async () => {
    mockAuthApi.loginPhone.mockRejectedValueOnce(
      makeApiError("AUTH_RATE_LIMITED", 429),
    );
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Trop de tentatives. Réessayez dans quelques minutes.",
        ),
      ).toBeOnTheScreen(),
    );
  });

  it("affiche une erreur ACCOUNT_VALIDATION_REQUIRED", async () => {
    mockAuthApi.loginPhone.mockRejectedValueOnce(
      makeApiError("ACCOUNT_VALIDATION_REQUIRED", 403),
    );
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(
        screen.getByText("Votre compte est en attente d'activation."),
      ).toBeOnTheScreen(),
    );
  });

  it("affiche une erreur réseau générique", async () => {
    mockAuthApi.loginPhone.mockRejectedValueOnce(new Error("Network error"));
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Impossible de se connecter. Vérifiez votre connexion.",
        ),
      ).toBeOnTheScreen(),
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Formulaire Email — rendu
// ─────────────────────────────────────────────────────────────
describe("Formulaire Email — rendu", () => {
  it("affiche les champs email et mot de passe", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    expect(screen.getByTestId("input-email")).toBeOnTheScreen();
    expect(screen.getByTestId("input-password")).toBeOnTheScreen();
  });

  it("accepte la saisie de l'email et du mot de passe", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(
      screen.getByTestId("input-email"),
      "directeur@lycee-cm.cm",
    );
    fireEvent.changeText(screen.getByTestId("input-password"), "motdepasse");
    expect(screen.getByDisplayValue("directeur@lycee-cm.cm")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("motdepasse")).toBeOnTheScreen();
  });
});

// ─────────────────────────────────────────────────────────────
// Formulaire Email — validation
// ─────────────────────────────────────────────────────────────
describe("Formulaire Email — validation", () => {
  it("affiche une erreur si l'email est invalide", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(screen.getByTestId("input-email"), "pasunemail");
    fireEvent.changeText(screen.getByTestId("input-password"), "motdepasse");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(screen.getByText("Adresse email invalide.")).toBeOnTheScreen(),
    );
    expect(mockAuthApi.loginEmail).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le mot de passe est vide", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(screen.getByTestId("input-email"), "prof@ecole.cm");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(screen.getByText("Mot de passe requis.")).toBeOnTheScreen(),
    );
    expect(mockAuthApi.loginEmail).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// Formulaire Email — soumission
// ─────────────────────────────────────────────────────────────
describe("Formulaire Email — soumission", () => {
  it("appelle loginEmail et redirige en cas de succès", async () => {
    mockAuthApi.loginEmail.mockResolvedValueOnce(fakeLoginResponse);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(
      screen.getByTestId("input-email"),
      "directeur@lycee-cm.cm",
    );
    fireEvent.changeText(screen.getByTestId("input-password"), "motdepasse");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() => {
      expect(mockAuthApi.loginEmail).toHaveBeenCalledWith(
        "directeur@lycee-cm.cm",
        "motdepasse",
      );
      expect(mockHandleLoginResponse).toHaveBeenCalledWith(fakeLoginResponse);
      expect(mockRouter.replace).toHaveBeenCalledWith("/");
    });
  });

  it("enregistre 'email' dans AsyncStorage après connexion réussie", async () => {
    mockAuthApi.loginEmail.mockResolvedValueOnce(fakeLoginResponse);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(screen.getByTestId("input-email"), "prof@ecole.cm");
    fireEvent.changeText(screen.getByTestId("input-password"), "motdepasse");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      "preferred_auth_method",
      "email",
    );
  });

  it("redirige vers l'onboarding si le mot de passe doit être changé", async () => {
    const err = makeApiError("PASSWORD_CHANGE_REQUIRED", 403);
    err.email = "directeur@lycee-cm.cm";
    err.schoolSlug = "lycee-cm";
    mockAuthApi.loginEmail.mockRejectedValueOnce(err);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(
      screen.getByTestId("input-email"),
      "directeur@lycee-cm.cm",
    );
    fireEvent.changeText(screen.getByTestId("input-password"), "TempPass11");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/onboarding",
        params: {
          email: "directeur@lycee-cm.cm",
          schoolSlug: "lycee-cm",
        },
      }),
    );
  });

  it("redirige vers l'onboarding si le profil email doit être complété", async () => {
    const err = makeApiError("PROFILE_SETUP_REQUIRED", 403);
    err.email = "prof@ecole.cm";
    err.schoolSlug = "ecole";
    mockAuthApi.loginEmail.mockRejectedValueOnce(err);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(screen.getByTestId("input-email"), "prof@ecole.cm");
    fireEvent.changeText(screen.getByTestId("input-password"), "motdepasse");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/onboarding",
        params: {
          email: "prof@ecole.cm",
          schoolSlug: "ecole",
        },
      }),
    );
  });

  it("affiche une erreur INVALID_CREDENTIALS", async () => {
    mockAuthApi.loginEmail.mockRejectedValueOnce(
      makeApiError("INVALID_CREDENTIALS"),
    );
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(screen.getByTestId("input-email"), "prof@ecole.cm");
    fireEvent.changeText(screen.getByTestId("input-password"), "mauvais");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(
        screen.getByText("Identifiants incorrects. Vérifiez vos informations."),
      ).toBeOnTheScreen(),
    );
  });

  it("affiche une erreur ACCOUNT_SUSPENDED", async () => {
    mockAuthApi.loginEmail.mockRejectedValueOnce(
      makeApiError("ACCOUNT_SUSPENDED", 403),
    );
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("email");
    fireEvent.changeText(
      screen.getByTestId("input-email"),
      "suspendu@ecole.cm",
    );
    fireEvent.changeText(screen.getByTestId("input-password"), "motdepasse");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Votre compte a été suspendu. Contactez votre administration.",
        ),
      ).toBeOnTheScreen(),
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Formulaire Identifiant (username)
// ─────────────────────────────────────────────────────────────
describe("Formulaire Identifiant — rendu", () => {
  it("affiche les champs identifiant et mot de passe", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("username");
    expect(screen.getByTestId("input-username")).toBeOnTheScreen();
    expect(screen.getByTestId("input-password-username")).toBeOnTheScreen();
  });
});

describe("Formulaire Identifiant — soumission", () => {
  it("appelle loginUsername avec les credentials saisis", async () => {
    mockAuthApi.loginUsername.mockResolvedValueOnce(fakeLoginResponse);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("username");
    fireEvent.changeText(screen.getByTestId("input-username"), "amina42");
    fireEvent.changeText(
      screen.getByTestId("input-password-username"),
      "MonMotDePasse1",
    );
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(mockAuthApi.loginUsername).toHaveBeenCalledWith(
        "amina42",
        "MonMotDePasse1",
      ),
    );
  });

  it("redirige vers la racine après connexion username réussie", async () => {
    mockAuthApi.loginUsername.mockResolvedValueOnce(fakeLoginResponse);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("username");
    fireEvent.changeText(screen.getByTestId("input-username"), "amina42");
    fireEvent.changeText(
      screen.getByTestId("input-password-username"),
      "MonMotDePasse1",
    );
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
  });

  it("enregistre 'username' dans AsyncStorage après connexion réussie", async () => {
    mockAuthApi.loginUsername.mockResolvedValueOnce(fakeLoginResponse);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("username");
    fireEvent.changeText(screen.getByTestId("input-username"), "amina42");
    fireEvent.changeText(
      screen.getByTestId("input-password-username"),
      "MonMotDePasse1",
    );
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      "preferred_auth_method",
      "username",
    );
  });

  it("navigue vers /onboarding avec username + schoolSlug si PASSWORD_CHANGE_REQUIRED", async () => {
    const err = makeApiError("PASSWORD_CHANGE_REQUIRED", 403);
    err.schoolSlug = "lycee-bilingue";
    mockAuthApi.loginUsername.mockRejectedValueOnce(err);
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("username");
    fireEvent.changeText(screen.getByTestId("input-username"), "amina42");
    fireEvent.changeText(
      screen.getByTestId("input-password-username"),
      "TmpPwd1",
    );
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/onboarding",
        params: {
          username: "amina42",
          schoolSlug: "lycee-bilingue",
        },
      }),
    );
    expect(screen.queryByTestId("error-message")).toBeNull();
  });

  it("affiche une erreur INVALID_CREDENTIALS pour le formulaire username", async () => {
    mockAuthApi.loginUsername.mockRejectedValueOnce(
      makeApiError("INVALID_CREDENTIALS"),
    );
    render(<LoginScreen />);

    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("username");
    fireEvent.changeText(screen.getByTestId("input-username"), "amina42");
    fireEvent.changeText(
      screen.getByTestId("input-password-username"),
      "mauvais",
    );
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(
        screen.getByText("Identifiants incorrects. Vérifiez vos informations."),
      ).toBeOnTheScreen(),
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Panneau SSO
// ─────────────────────────────────────────────────────────────
describe("Panneau SSO", () => {
  it("affiche les boutons Google et Apple", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("google");
    expect(screen.getByTestId("sso-google")).toBeOnTheScreen();
    expect(screen.getByTestId("sso-apple")).toBeOnTheScreen();
  });

  it("affiche le texte informatif SSO", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("google");
    expect(
      screen.getByText("Accès instantané avec votre compte existant."),
    ).toBeOnTheScreen();
  });

  it("indique que Apple n'est pas encore disponible", async () => {
    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("google");
    expect(screen.getByText("BIENTÔT")).toBeOnTheScreen();
  });

  it("ouvre le flux Google sans appeler loginSso depuis l'écran login", async () => {
    mockGoogleAuth.mockResolvedValueOnce(undefined);

    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("google");
    fireEvent.press(screen.getByTestId("sso-google"));

    await waitFor(() => {
      expect(mockGoogleAuth).toHaveBeenCalled();
    });
    expect(mockAuthApi.loginSso).not.toHaveBeenCalled();
  });

  it("affiche une erreur claire si Google requiert l'app native", async () => {
    mockGoogleAuth.mockRejectedValueOnce(
      new GoogleAuthError(
        "GOOGLE_AUTH_NATIVE_BUILD_REQUIRED",
        "La connexion Google nécessite l'application Android native. Lancez `npm run android:build` puis réessayez.",
      ),
    );

    render(<LoginScreen />);
    await waitFor(() => screen.getByTestId("panel-phone"));
    await switchToMethod("google");
    fireEvent.press(screen.getByTestId("sso-google"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "La connexion Google nécessite l'application Android native. Lancez `npm run android:build` puis réessayez.",
        ),
      ).toBeOnTheScreen(),
    );
  });

  it("ouvre Google si AsyncStorage preferred_auth_method = 'google'", async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce("google");
    render(<LoginScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("panel-google")).toBeOnTheScreen(),
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Params d'URL
// ─────────────────────────────────────────────────────────────
describe("Params d'URL", () => {
  it("ouvre le panneau Google si tab=google est passé en param", () => {
    const { useLocalSearchParams } = require("expo-router") as {
      useLocalSearchParams: jest.Mock;
    };
    useLocalSearchParams.mockReturnValue({
      tab: "google",
      error: "Connexion Google interrompue.",
    });

    render(<LoginScreen />);

    expect(screen.getByTestId("panel-google")).toBeOnTheScreen();
    expect(screen.getByText("Connexion Google interrompue.")).toBeOnTheScreen();
  });
});

// ─────────────────────────────────────────────────────────────
// Pied de page
// ─────────────────────────────────────────────────────────────
describe("Pied de page", () => {
  it("affiche le copyright en bas de page", () => {
    render(<LoginScreen />);
    expect(
      screen.getByText("© 2026 Scolive. Tous droits réservés."),
    ).toBeOnTheScreen();
  });

  it("affiche la version de l'application", () => {
    render(<LoginScreen />);
    expect(screen.getByTestId("login-app-version")).toHaveTextContent(
      "build 100",
    );
  });

  it("n'est jamais positionné en absolute (ne doit pas chevaucher le contenu défilant)", () => {
    render(<LoginScreen />);
    const footer = screen.getByTestId("login-footer");
    const flatStyle = StyleSheet.flatten(footer.props.style);
    expect(flatStyle.position).not.toBe("absolute");
  });

  it("le lien 'Se connecter autrement' et le footer sont tous les deux affichés", () => {
    render(<LoginScreen />);
    expect(screen.getByTestId("link-switch-method")).toBeOnTheScreen();
    expect(screen.getByTestId("login-footer")).toBeOnTheScreen();
  });
});
