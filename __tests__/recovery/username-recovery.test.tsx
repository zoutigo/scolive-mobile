import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import UsernameRecoveryScreen from "../../app/recovery/username";
import { apiFetch } from "../../src/api/client";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import { useLocaleStore } from "../../src/store/locale.store";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));
// pin.tsx helpers (imported by username.tsx for date formatting)
jest.mock("../../app/recovery/pin", () => ({
  formatDateInput: (v: string) => v,
  parseDateToISO: (v: string) => {
    const parts = v.split("/");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    return `${y}-${m}-${d}`;
  },
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const { router: mockRouter } = require("expo-router") as {
  router: { replace: jest.Mock; back: jest.Mock; push: jest.Mock };
};

const MOCK_QUESTIONS = [
  { key: "BIRTH_CITY", label: "Votre ville de naissance" },
  { key: "FAVORITE_SPORT", label: "Votre sport préféré" },
  { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function submitStep1(username = "JeanDUPONT") {
  fireEvent.changeText(screen.getByTestId("input-username"), username);
  fireEvent.press(screen.getByTestId("btn-step1"));
}

async function fillAndSubmitStep2(birthDate = "15/01/1990") {
  fireEvent.changeText(screen.getByTestId("input-birthdate"), birthDate);
  fireEvent.changeText(screen.getByTestId("input-answer-0"), "Yaoundé");
  fireEvent.changeText(screen.getByTestId("input-answer-1"), "Football");
  fireEvent.changeText(screen.getByTestId("input-answer-2"), "Dupont");
  fireEvent.press(screen.getByTestId("btn-step2"));
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

describe("UsernameRecoveryScreen — Step 1", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useLocaleStore.setState({ locale: DEFAULT_LOCALE });
    });
  });

  afterEach(() => {
    act(() => {
      useLocaleStore.setState({ locale: DEFAULT_LOCALE });
    });
  });

  describe("Traduction (anglais)", () => {
    it("affiche l'étape 1 en anglais lorsque la locale est 'en'", async () => {
      act(() => {
        useLocaleStore.setState({ locale: "en" });
      });
      render(<UsernameRecoveryScreen />);

      expect(screen.getByText("Account recovery")).toBeTruthy();
      expect(screen.getByText("Your username")).toBeTruthy();
      expect(screen.getByText("Continue")).toBeTruthy();
    });

    it("affiche une erreur de validation traduite en anglais", async () => {
      act(() => {
        useLocaleStore.setState({ locale: "en" });
      });
      render(<UsernameRecoveryScreen />);

      fireEvent.press(screen.getByTestId("btn-step1"));

      await waitFor(() =>
        expect(screen.getByTestId("error-username")).toBeTruthy(),
      );
      expect(screen.getByText("Username is required.")).toBeTruthy();
    });
  });

  it("affiche le champ identifiant et le bouton Continuer", () => {
    render(<UsernameRecoveryScreen />);

    expect(screen.getByTestId("step-1")).toBeTruthy();
    expect(screen.getByTestId("input-username")).toBeTruthy();
    expect(screen.getByTestId("btn-step1")).toBeTruthy();
  });

  it("affiche l'en-tête 'Récupération du compte'", () => {
    render(<UsernameRecoveryScreen />);

    expect(screen.getByText("Récupération du compte")).toBeTruthy();
  });

  it("affiche une erreur de validation si l'identifiant est vide au submit", async () => {
    render(<UsernameRecoveryScreen />);

    fireEvent.press(screen.getByTestId("btn-step1"));

    await waitFor(() =>
      expect(screen.getByTestId("error-username")).toBeTruthy(),
    );
    expect(screen.getByText("L'identifiant est requis.")).toBeTruthy();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("appelle POST /auth/recover/username/start avec l'identifiant saisi", async () => {
    mockApiFetch.mockResolvedValueOnce({
      questions: MOCK_QUESTIONS,
    });

    render(<UsernameRecoveryScreen />);
    await submitStep1("JeanDUPONT");

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/recover/username/start",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ username: "JeanDUPONT" }),
        }),
      ),
    );
  });

  it("passe à l'étape 2 avec questions après une réponse réussie", async () => {
    mockApiFetch.mockResolvedValueOnce({ questions: MOCK_QUESTIONS });

    render(<UsernameRecoveryScreen />);
    await submitStep1();

    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());
    expect(screen.getByTestId("input-birthdate")).toBeTruthy();
    expect(screen.getByTestId("input-answer-0")).toBeTruthy();
  });

  it("passe à l'étape 2 sans questions si noQuestions = true", async () => {
    mockApiFetch.mockResolvedValueOnce({ questions: [], noQuestions: true });

    render(<UsernameRecoveryScreen />);
    await submitStep1();

    await waitFor(() =>
      expect(screen.getByTestId("step-2-no-questions")).toBeTruthy(),
    );
    expect(
      screen.getByText(/Aucune question de récupération n'a été configurée/),
    ).toBeTruthy();
  });

  it("passe à l'étape 2 sans questions si questions est un tableau vide", async () => {
    mockApiFetch.mockResolvedValueOnce({ questions: [] });

    render(<UsernameRecoveryScreen />);
    await submitStep1();

    await waitFor(() =>
      expect(screen.getByTestId("step-2-no-questions")).toBeTruthy(),
    );
  });

  it("affiche une erreur si l'identifiant n'existe pas (USER_NOT_FOUND)", async () => {
    mockApiFetch.mockRejectedValueOnce({
      code: "USER_NOT_FOUND",
      statusCode: 404,
    });

    render(<UsernameRecoveryScreen />);
    await submitStep1("inexistant");

    await waitFor(() =>
      expect(screen.getByTestId("error-message")).toBeTruthy(),
    );
    expect(
      screen.getByText("Aucun compte trouvé pour cet identifiant."),
    ).toBeTruthy();
  });

  it("affiche une erreur pour NOT_FOUND (statusCode 404)", async () => {
    mockApiFetch.mockRejectedValueOnce({ statusCode: 404 });

    render(<UsernameRecoveryScreen />);
    await submitStep1("inconnu");

    await waitFor(() =>
      expect(
        screen.getByText("Aucun compte trouvé pour cet identifiant."),
      ).toBeTruthy(),
    );
  });

  it("affiche une erreur générique en cas de réseau coupé", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Network request failed"));

    render(<UsernameRecoveryScreen />);
    await submitStep1();

    await waitFor(() =>
      expect(screen.getByTestId("error-message")).toBeTruthy(),
    );
  });

  it("le bouton Retour appelle router.back() depuis l'étape 1", () => {
    render(<UsernameRecoveryScreen />);

    fireEvent.press(screen.getByTestId("back-button"));

    expect(mockRouter.back).toHaveBeenCalled();
  });
});

// ── Step 2 — No Questions ─────────────────────────────────────────────────────

describe("UsernameRecoveryScreen — Step 2 (pas de questions)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function goToStep2NoQuestions() {
    mockApiFetch.mockResolvedValueOnce({ questions: [], noQuestions: true });
    render(<UsernameRecoveryScreen />);
    await submitStep1();
    await waitFor(() =>
      expect(screen.getByTestId("step-2-no-questions")).toBeTruthy(),
    );
  }

  it("affiche le message d'absence de questions", async () => {
    await goToStep2NoQuestions();

    expect(screen.getByText(/administration scolaire/)).toBeTruthy();
  });

  it("le bouton 'Retour à la connexion' appelle router.replace('/login')", async () => {
    await goToStep2NoQuestions();

    fireEvent.press(screen.getByTestId("btn-back-login"));

    expect(mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("le bouton Retour depuis step-2-no-questions revient à l'étape 1", async () => {
    await goToStep2NoQuestions();

    fireEvent.press(screen.getByTestId("back-button"));

    await waitFor(() => expect(screen.getByTestId("step-1")).toBeTruthy());
  });
});

// ── Step 2 — Avec Questions ───────────────────────────────────────────────────

describe("UsernameRecoveryScreen — Step 2 (avec questions)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function goToStep2WithQuestions() {
    mockApiFetch.mockResolvedValueOnce({ questions: MOCK_QUESTIONS });
    render(<UsernameRecoveryScreen />);
    await submitStep1();
    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());
  }

  it("affiche le champ date et toutes les questions", async () => {
    await goToStep2WithQuestions();

    expect(screen.getByTestId("input-birthdate")).toBeTruthy();
    expect(screen.getByTestId("input-answer-0")).toBeTruthy();
    expect(screen.getByTestId("input-answer-1")).toBeTruthy();
    expect(screen.getByTestId("input-answer-2")).toBeTruthy();
    expect(screen.getByText("Votre ville de naissance")).toBeTruthy();
    expect(screen.getByText("Votre sport préféré")).toBeTruthy();
  });

  it("affiche une erreur si la date est absente au submit", async () => {
    await goToStep2WithQuestions();

    fireEvent.press(screen.getByTestId("btn-step2"));

    await waitFor(() =>
      expect(screen.getByTestId("error-message")).toBeTruthy(),
    );
    expect(screen.getByText(/Format de date attendu/)).toBeTruthy();
  });

  it("affiche une erreur si une réponse est trop courte (< 2 caractères)", async () => {
    await goToStep2WithQuestions();

    fireEvent.changeText(screen.getByTestId("input-birthdate"), "15/01/1990");
    fireEvent.changeText(screen.getByTestId("input-answer-0"), "A");
    fireEvent.changeText(screen.getByTestId("input-answer-1"), "Football");
    fireEvent.changeText(screen.getByTestId("input-answer-2"), "Dupont");
    fireEvent.press(screen.getByTestId("btn-step2"));

    await waitFor(() =>
      expect(
        screen.getByText("Chaque réponse doit contenir au moins 2 caractères."),
      ).toBeTruthy(),
    );
  });

  it("appelle POST /auth/recover/username/verify avec les bonnes données", async () => {
    mockApiFetch.mockResolvedValueOnce({ questions: MOCK_QUESTIONS });
    render(<UsernameRecoveryScreen />);
    await submitStep1("JeanDUPONT");
    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());

    mockApiFetch.mockResolvedValueOnce({ recoveryToken: "tok-abc123" });
    await fillAndSubmitStep2("15/01/1990");

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/recover/username/verify",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"username":"JeanDUPONT"'),
        }),
      ),
    );
  });

  it("passe à l'étape 3 après vérification réussie", async () => {
    mockApiFetch.mockResolvedValueOnce({ questions: MOCK_QUESTIONS });
    render(<UsernameRecoveryScreen />);
    await submitStep1();
    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());

    mockApiFetch.mockResolvedValueOnce({ recoveryToken: "tok-abc123" });
    await fillAndSubmitStep2();

    await waitFor(() => expect(screen.getByTestId("step-3")).toBeTruthy());
  });

  it("affiche une erreur RECOVERY_INVALID si les réponses sont incorrectes", async () => {
    mockApiFetch.mockResolvedValueOnce({ questions: MOCK_QUESTIONS });
    render(<UsernameRecoveryScreen />);
    await submitStep1();
    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());

    mockApiFetch.mockRejectedValueOnce({
      code: "RECOVERY_INVALID",
      statusCode: 400,
    });
    await fillAndSubmitStep2();

    await waitFor(() =>
      expect(
        screen.getByText("Informations de récupération invalides."),
      ).toBeTruthy(),
    );
  });

  it("affiche une erreur générique si le serveur répond 500", async () => {
    mockApiFetch.mockResolvedValueOnce({ questions: MOCK_QUESTIONS });
    render(<UsernameRecoveryScreen />);
    await submitStep1();
    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());

    mockApiFetch.mockRejectedValueOnce({ statusCode: 500 });
    await fillAndSubmitStep2();

    await waitFor(() =>
      expect(screen.getByTestId("error-message")).toBeTruthy(),
    );
  });

  it("le bouton Retour depuis step-2 revient à l'étape 1", async () => {
    await goToStep2WithQuestions();

    fireEvent.press(screen.getByTestId("back-button"));

    await waitFor(() => expect(screen.getByTestId("step-1")).toBeTruthy());
  });
});

// ── Step 3 ────────────────────────────────────────────────────────────────────

describe("UsernameRecoveryScreen — Step 3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function goToStep3() {
    mockApiFetch
      .mockResolvedValueOnce({ questions: MOCK_QUESTIONS })
      .mockResolvedValueOnce({ recoveryToken: "tok-reset" });

    render(<UsernameRecoveryScreen />);
    await submitStep1();
    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());
    await fillAndSubmitStep2();
    await waitFor(() => expect(screen.getByTestId("step-3")).toBeTruthy());
  }

  it("affiche les champs nouveau mot de passe et confirmation", async () => {
    await goToStep3();

    expect(screen.getByTestId("input-new-password")).toBeTruthy();
    expect(screen.getByTestId("input-confirm-password")).toBeTruthy();
    expect(screen.getByTestId("btn-step3")).toBeTruthy();
  });

  it("erreur si le mot de passe fait moins de 8 caractères", async () => {
    await goToStep3();

    fireEvent.changeText(screen.getByTestId("input-new-password"), "Ab1");
    fireEvent.changeText(screen.getByTestId("input-confirm-password"), "Ab1");
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(screen.getByTestId("error-new-password")).toBeTruthy(),
    );
    expect(screen.getByText(/au moins 8 caractères/)).toBeTruthy();
  });

  it("erreur si le mot de passe n'a pas de majuscule", async () => {
    await goToStep3();

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "nouppercase1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "nouppercase1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(screen.getByTestId("error-new-password")).toBeTruthy(),
    );
    expect(screen.getByText(/majuscules/)).toBeTruthy();
  });

  it("erreur si le mot de passe n'a pas de chiffre", async () => {
    await goToStep3();

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "NoDigitPassword",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "NoDigitPassword",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(screen.getByTestId("error-new-password")).toBeTruthy(),
    );
  });

  it("erreur si la confirmation ne correspond pas", async () => {
    await goToStep3();

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "DifferentPass2",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(screen.getByTestId("error-confirm-password")).toBeTruthy(),
    );
    expect(screen.getByText(/La confirmation ne correspond pas/)).toBeTruthy();
  });

  it("appelle POST /auth/recover/username/reset avec le token et le nouveau mot de passe", async () => {
    await goToStep3();

    mockApiFetch.mockResolvedValueOnce({ success: true });

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "ValidPass1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/recover/username/reset",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            recoveryToken: "tok-reset",
            newPassword: "ValidPass1",
          }),
        }),
      ),
    );
  });

  it("passe à l'étape 4 après réinitialisation réussie", async () => {
    await goToStep3();

    mockApiFetch.mockResolvedValueOnce({ success: true });

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "ValidPass1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() => expect(screen.getByTestId("step-4")).toBeTruthy());
  });

  it("affiche l'erreur TOKEN_EXPIRED si le jeton a expiré", async () => {
    await goToStep3();

    mockApiFetch.mockRejectedValueOnce({ code: "TOKEN_EXPIRED" });

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "ValidPass1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(
        screen.getByText("Le jeton a expiré. Recommencez depuis le début."),
      ).toBeTruthy(),
    );
  });

  it("affiche l'erreur TOKEN_INVALID si le lien est invalide", async () => {
    await goToStep3();

    mockApiFetch.mockRejectedValueOnce({
      code: "TOKEN_INVALID",
      message: "Lien de reinitialisation invalide ou expire",
    });

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "ValidPass1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(
        screen.getByText("Lien de réinitialisation invalide."),
      ).toBeTruthy(),
    );
  });

  it("affiche l'erreur SAME_PASSWORD si le mot de passe est identique à l'actuel", async () => {
    await goToStep3();

    mockApiFetch.mockRejectedValueOnce({
      code: "SAME_PASSWORD",
      message:
        "Le nouveau mot de passe doit etre different du mot de passe actuel",
    });

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "ValidPass1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Le nouveau mot de passe doit être différent de l'actuel.",
        ),
      ).toBeTruthy(),
    );
  });

  it("affiche une erreur générique si reset échoue avec code inconnu", async () => {
    await goToStep3();

    mockApiFetch.mockRejectedValueOnce({ statusCode: 500 });

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "ValidPass1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));

    await waitFor(() =>
      expect(screen.getByTestId("error-message")).toBeTruthy(),
    );
  });

  it("le bouton Retour depuis step-3 revient à l'étape 2", async () => {
    await goToStep3();

    fireEvent.press(screen.getByTestId("back-button"));

    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());
  });
});

// ── Step 4 ────────────────────────────────────────────────────────────────────

describe("UsernameRecoveryScreen — Step 4 (succès)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function goToStep4() {
    mockApiFetch
      .mockResolvedValueOnce({ questions: MOCK_QUESTIONS })
      .mockResolvedValueOnce({ recoveryToken: "tok-reset" })
      .mockResolvedValueOnce({ success: true });

    render(<UsernameRecoveryScreen />);
    await submitStep1();
    await waitFor(() => expect(screen.getByTestId("step-2")).toBeTruthy());
    await fillAndSubmitStep2();
    await waitFor(() => expect(screen.getByTestId("step-3")).toBeTruthy());

    fireEvent.changeText(
      screen.getByTestId("input-new-password"),
      "ValidPass1",
    );
    fireEvent.changeText(
      screen.getByTestId("input-confirm-password"),
      "ValidPass1",
    );
    fireEvent.press(screen.getByTestId("btn-step3"));
    await waitFor(() => expect(screen.getByTestId("step-4")).toBeTruthy());
  }

  it("affiche le message de succès", async () => {
    await goToStep4();

    // "Mot de passe réinitialisé" apparaît dans l'en-tête ET la card — on vérifie la card success
    expect(screen.getByTestId("step-4")).toBeTruthy();
    expect(
      screen.getByText(/Votre mot de passe a été mis à jour/),
    ).toBeTruthy();
    // On vérifie qu'il y a au moins une occurrence du titre de succès
    expect(
      screen.getAllByText("Mot de passe réinitialisé").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("le bouton 'Retour à la connexion' appelle router.replace('/login')", async () => {
    await goToStep4();

    fireEvent.press(screen.getByTestId("btn-go-login"));

    expect(mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("le bouton dans l'en-tête appelle router.replace('/login') depuis step 4", async () => {
    await goToStep4();

    fireEvent.press(screen.getByTestId("back-button"));

    expect(mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("l'en-tête n'affiche plus 'Récupération du compte' à l'étape 4", async () => {
    await goToStep4();

    // L'en-tête change à l'étape 4 — le titre de récupération disparaît
    expect(screen.queryByText("Récupération du compte")).toBeNull();
    // L'étape 4 sur 3 n'existe pas (3 étapes max)
    expect(screen.queryByText("Étape 4 sur 3")).toBeNull();
    // La card step-4 est bien affichée
    expect(screen.getByTestId("step-4")).toBeTruthy();
  });
});
