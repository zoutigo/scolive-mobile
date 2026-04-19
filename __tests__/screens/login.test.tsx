import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import LoginScreen from "../../app/login";
import { authApi } from "../../src/api/auth.api";
import { mobileBuildsApi } from "../../src/api/mobile-builds.api";
import { signInWithGoogleAsync } from "../../src/auth/google-auth";
import { useAuthStore } from "../../src/store/auth.store";

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
jest.mock("../../src/api/mobile-builds.api");
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

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockMobileBuildsApi = mobileBuildsApi as jest.Mocked<
  typeof mobileBuildsApi
>;
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
const { Linking } = require("react-native") as {
  Linking: { openURL: jest.Mock };
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
  };
  err.code = code;
  err.statusCode = status;
  return err;
}

beforeEach(() => {
  jest.clearAllMocks();
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
  mockMobileBuildsApi.getLatestAndroidBuildMeta.mockResolvedValue({
    versionName: "1.0.0",
    versionCode: 100,
    uploadedAt: "2026-04-19T10:00:00.000Z",
    fileSize: 1024,
    mimeType: "application/vnd.android.package-archive",
  });
  mockMobileBuildsApi.getLatestAndroidDownloadUrl.mockReturnValue(
    "https://scolive.lisaweb.fr/api/mobile-builds/android/latest",
  );
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

describe("Mise à jour Android", () => {
  it("affiche un bandeau quand une version plus récente est disponible", async () => {
    mockMobileBuildsApi.getLatestAndroidBuildMeta.mockResolvedValueOnce({
      versionName: "1.0.1",
      versionCode: 101,
      uploadedAt: "2026-04-19T10:00:00.000Z",
      fileSize: 2048,
      mimeType: "application/vnd.android.package-archive",
      downloadUrl:
        "https://scolive.lisaweb.fr/api/mobile-builds/android/latest",
    });

    render(<LoginScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("android-update-banner")).toBeOnTheScreen(),
    );
    expect(screen.getByText(/Dernière version: 1.0.1 \(101\)/)).toBeTruthy();
  });

  it("ouvre le téléchargement quand on appuie sur le bouton", async () => {
    const openUrlSpy = jest
      .spyOn(Linking, "openURL")
      .mockResolvedValueOnce(undefined);
    mockMobileBuildsApi.getLatestAndroidBuildMeta.mockResolvedValueOnce({
      versionName: "1.0.2",
      versionCode: 102,
      uploadedAt: "2026-04-19T10:00:00.000Z",
      fileSize: 4096,
      mimeType: "application/vnd.android.package-archive",
      downloadUrl:
        "https://scolive.lisaweb.fr/api/mobile-builds/android/latest",
    });

    render(<LoginScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("android-update-download")).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByTestId("android-update-download"));

    expect(openUrlSpy).toHaveBeenCalledWith(
      "https://scolive.lisaweb.fr/api/mobile-builds/android/latest",
    );
  });
});

// ─────────────────────────────────────────────────────────────
// Onglets
// ─────────────────────────────────────────────────────────────
describe("Onglets", () => {
  it("affiche les trois onglets", () => {
    render(<LoginScreen />);
    expect(screen.getByTestId("tab-phone")).toBeOnTheScreen();
    expect(screen.getByTestId("tab-email")).toBeOnTheScreen();
    expect(screen.getByTestId("tab-google")).toBeOnTheScreen();
  });

  it("active l'onglet Téléphone par défaut", () => {
    render(<LoginScreen />);
    expect(screen.getByTestId("panel-phone")).toBeOnTheScreen();
    expect(screen.queryByTestId("panel-email")).toBeNull();
    expect(screen.queryByTestId("panel-google")).toBeNull();
  });

  it("bascule vers le formulaire email", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
    expect(screen.getByTestId("panel-email")).toBeOnTheScreen();
    expect(screen.queryByTestId("panel-phone")).toBeNull();
  });

  it("bascule vers le panneau Google", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-google"));
    expect(screen.getByTestId("panel-google")).toBeOnTheScreen();
  });

  it("ouvre l'onglet Google et affiche l'erreur passée en query param", () => {
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

  it("efface l'erreur lors du changement d'onglet", async () => {
    mockAuthApi.loginPhone.mockRejectedValueOnce(
      makeApiError("INVALID_CREDENTIALS"),
    );
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-login"));

    await waitFor(() =>
      expect(screen.getByTestId("error-message")).toBeOnTheScreen(),
    );

    fireEvent.press(screen.getByTestId("tab-email"));
    expect(screen.queryByTestId("error-message")).toBeNull();
  });
});

describe("Champs sécurisés", () => {
  it("permet d'afficher le PIN saisi", () => {
    render(<LoginScreen />);

    expect(screen.getByTestId("input-pin").props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByTestId("input-pin-toggle-visibility"));
    expect(screen.getByTestId("input-pin").props.secureTextEntry).toBe(false);
  });

  it("permet d'afficher le mot de passe saisi", () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId("tab-email"));
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
    });
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
  it("affiche les champs email et mot de passe", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
    expect(screen.getByTestId("input-email")).toBeOnTheScreen();
    expect(screen.getByTestId("input-password")).toBeOnTheScreen();
  });

  it("accepte la saisie de l'email et du mot de passe", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
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
    fireEvent.press(screen.getByTestId("tab-email"));
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
    fireEvent.press(screen.getByTestId("tab-email"));
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

    fireEvent.press(screen.getByTestId("tab-email"));
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
    });
  });

  it("redirige vers l'onboarding si le mot de passe doit être changé", async () => {
    const err = makeApiError("PASSWORD_CHANGE_REQUIRED", 403);
    err.email = "directeur@lycee-cm.cm";
    err.schoolSlug = "lycee-cm";
    mockAuthApi.loginEmail.mockRejectedValueOnce(err);
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId("tab-email"));
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

    fireEvent.press(screen.getByTestId("tab-email"));
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

    fireEvent.press(screen.getByTestId("tab-email"));
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

    fireEvent.press(screen.getByTestId("tab-email"));
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
// Persistance des saisies entre onglets
// ─────────────────────────────────────────────────────────────
describe("Persistance des saisies entre onglets", () => {
  it("conserve les valeurs téléphone/PIN après changement d'onglet", () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("tab-email"));
    fireEvent.press(screen.getByTestId("tab-phone"));
    expect(screen.getByDisplayValue("612345678")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("123456")).toBeOnTheScreen();
  });

  it("conserve les valeurs email/password après changement d'onglet", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
    fireEvent.changeText(screen.getByTestId("input-email"), "marie@ecole.fr");
    fireEvent.changeText(screen.getByTestId("input-password"), "secret");
    fireEvent.press(screen.getByTestId("tab-phone"));
    fireEvent.press(screen.getByTestId("tab-email"));
    expect(screen.getByDisplayValue("marie@ecole.fr")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("secret")).toBeOnTheScreen();
  });
});

// ─────────────────────────────────────────────────────────────
// Panneau SSO
// ─────────────────────────────────────────────────────────────
describe("Panneau SSO", () => {
  it("affiche les boutons Google et Apple", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-google"));
    expect(screen.getByTestId("sso-google")).toBeOnTheScreen();
    expect(screen.getByTestId("sso-apple")).toBeOnTheScreen();
  });

  it("affiche le texte informatif SSO", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-google"));
    expect(
      screen.getByText("Accès instantané avec votre compte existant."),
    ).toBeOnTheScreen();
  });

  it("indique que Apple n'est pas encore disponible", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-google"));
    expect(screen.getByText("BIENTÔT")).toBeOnTheScreen();
  });

  it("ouvre le flux Google sans appeler loginSso depuis l'écran login", async () => {
    mockGoogleAuth.mockResolvedValueOnce(undefined);

    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-google"));
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
    fireEvent.press(screen.getByTestId("tab-google"));
    fireEvent.press(screen.getByTestId("sso-google"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "La connexion Google nécessite l'application Android native. Lancez `npm run android:build` puis réessayez.",
        ),
      ).toBeOnTheScreen(),
    );
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
});
