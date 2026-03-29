import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PinRecoveryScreen, {
  pinRecoveryStep1PhoneSchema,
  pinRecoveryStep3Schema,
  formatDateInput,
  parseDateToISO,
  parseRecoveryApiError,
} from "../../app/recovery/pin";
import { recoveryApi } from "../../src/api/recovery.api";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("../../src/api/recovery.api", () => ({
  recoveryApi: {
    forgotPinOptions: jest.fn(),
    forgotPinVerify: jest.fn(),
    forgotPinComplete: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Références aux mocks (récupérées après le hoisting)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { router: mockRouter } = require("expo-router") as {
  router: { replace: jest.Mock; back: jest.Mock; push: jest.Mock };
};

const mockOptions = recoveryApi.forgotPinOptions as jest.MockedFunction<
  typeof recoveryApi.forgotPinOptions
>;
const mockVerify = recoveryApi.forgotPinVerify as jest.MockedFunction<
  typeof recoveryApi.forgotPinVerify
>;
const mockComplete = recoveryApi.forgotPinComplete as jest.MockedFunction<
  typeof recoveryApi.forgotPinComplete
>;

const MOCK_OPTIONS_RESPONSE = {
  success: true,
  principalHint: "6***3",
  schoolSlug: null,
  questions: [
    { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
    { key: "BIRTH_CITY", label: "Votre ville de naissance" },
    { key: "FAVORITE_SPORT", label: "Votre sport préféré" },
  ],
};

const MOCK_VERIFY_RESPONSE = {
  success: true,
  recoveryToken: "e2e-recovery-token",
  schoolSlug: null,
};

const MOCK_COMPLETE_RESPONSE = {
  success: true,
  schoolSlug: null,
};

// ── Helpers utilitaires ───────────────────────────────────────────────────────

describe("formatDateInput", () => {
  it("retourne les chiffres bruts si ≤ 2", () => {
    expect(formatDateInput("1")).toBe("1");
    expect(formatDateInput("15")).toBe("15");
  });

  it("ajoute un slash après 2 chiffres", () => {
    expect(formatDateInput("150")).toBe("15/0");
    expect(formatDateInput("1501")).toBe("15/01");
  });

  it("ajoute deux slashs pour une date complète", () => {
    expect(formatDateInput("15011990")).toBe("15/01/1990");
  });

  it("ignore les caractères non-numériques", () => {
    expect(formatDateInput("15/01/1990")).toBe("15/01/1990");
    expect(formatDateInput("15-01-1990")).toBe("15/01/1990");
  });

  it("limite à 8 chiffres", () => {
    expect(formatDateInput("150119901234")).toBe("15/01/1990");
  });
});

describe("parseDateToISO", () => {
  it("convertit JJ/MM/AAAA en YYYY-MM-DD", () => {
    expect(parseDateToISO("15/01/1990")).toBe("1990-01-15");
    expect(parseDateToISO("01/12/2000")).toBe("2000-12-01");
  });

  it("retourne null pour un format invalide", () => {
    expect(parseDateToISO("15-01-1990")).toBeNull();
    expect(parseDateToISO("1990-01-15")).toBeNull();
    expect(parseDateToISO("")).toBeNull();
  });

  it("retourne null pour une date impossible", () => {
    expect(parseDateToISO("32/01/1990")).toBeNull();
    expect(parseDateToISO("15/13/1990")).toBeNull();
  });
});

// ── Schémas Zod ───────────────────────────────────────────────────────────────

describe("pinRecoveryStep1PhoneSchema", () => {
  it("accepte un numéro à 9 chiffres", () => {
    expect(
      pinRecoveryStep1PhoneSchema.safeParse({ phone: "650000001" }).success,
    ).toBe(true);
  });

  it("rejette un numéro vide", () => {
    const r = pinRecoveryStep1PhoneSchema.safeParse({ phone: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe(
      "Le numéro de téléphone est requis.",
    );
  });

  it("rejette un numéro de moins de 9 chiffres", () => {
    const r = pinRecoveryStep1PhoneSchema.safeParse({ phone: "65000000" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("9 chiffres");
  });

  it("rejette un numéro de plus de 9 chiffres", () => {
    const r = pinRecoveryStep1PhoneSchema.safeParse({ phone: "6500000012" });
    expect(r.success).toBe(false);
  });

  it("rejette un numéro avec des lettres", () => {
    const r = pinRecoveryStep1PhoneSchema.safeParse({ phone: "65000abc1" });
    expect(r.success).toBe(false);
  });
});

describe("pinRecoveryStep3Schema", () => {
  it("accepte un PIN à 6 chiffres correspondants", () => {
    expect(
      pinRecoveryStep3Schema.safeParse({
        newPin: "123456",
        confirmPin: "123456",
      }).success,
    ).toBe(true);
  });

  it("rejette un PIN de moins de 6 chiffres", () => {
    const r = pinRecoveryStep3Schema.safeParse({
      newPin: "12345",
      confirmPin: "12345",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("exactement 6 chiffres");
  });

  it("rejette un PIN avec des lettres", () => {
    const r = pinRecoveryStep3Schema.safeParse({
      newPin: "12345a",
      confirmPin: "12345a",
    });
    expect(r.success).toBe(false);
  });

  it("rejette un confirmPin vide", () => {
    const r = pinRecoveryStep3Schema.safeParse({
      newPin: "123456",
      confirmPin: "",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Confirmez le PIN.");
  });

  it("rejette si les deux PINs ne correspondent pas", () => {
    const r = pinRecoveryStep3Schema.safeParse({
      newPin: "123456",
      confirmPin: "654321",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toContain("confirmPin");
    expect(r.error?.issues[0].message).toContain(
      "La confirmation ne correspond pas",
    );
  });
});

// ── parseRecoveryApiError ─────────────────────────────────────────────────────

describe("parseRecoveryApiError", () => {
  it("traduit RECOVERY_INVALID", () => {
    expect(parseRecoveryApiError({ code: "RECOVERY_INVALID" })).toBe(
      "Informations de récupération invalides.",
    );
  });

  it("traduit NOT_FOUND", () => {
    expect(parseRecoveryApiError({ code: "NOT_FOUND" })).toBe(
      "Aucun compte trouvé avec ces informations.",
    );
  });

  it("traduit USER_NOT_FOUND", () => {
    expect(parseRecoveryApiError({ code: "USER_NOT_FOUND" })).toBe(
      "Aucun compte trouvé avec ces informations.",
    );
  });

  it("traduit RECOVERY_SESSION_EXPIRED", () => {
    expect(parseRecoveryApiError({ code: "RECOVERY_SESSION_EXPIRED" })).toBe(
      "Session expirée. Recommencez depuis le début.",
    );
  });

  it("traduit SAME_PIN", () => {
    expect(parseRecoveryApiError({ code: "SAME_PIN" })).toBe(
      "Le nouveau PIN doit être différent de l'actuel.",
    );
  });

  it("utilise statusCode 404 en fallback", () => {
    expect(parseRecoveryApiError({ statusCode: 404 })).toBe(
      "Aucun compte trouvé avec ces informations.",
    );
  });

  it("utilise statusCode 400 en fallback", () => {
    expect(parseRecoveryApiError({ statusCode: 400 })).toBe(
      "Informations de récupération invalides.",
    );
  });

  it("retourne le message générique pour une erreur inconnue", () => {
    expect(parseRecoveryApiError({})).toBe(
      "Impossible de se connecter. Vérifiez votre connexion.",
    );
    expect(parseRecoveryApiError(null)).toBe(
      "Impossible de se connecter. Vérifiez votre connexion.",
    );
  });
});

// ── Composant PinRecoveryScreen ───────────────────────────────────────────────

describe("PinRecoveryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Step 1 ──────────────────────────────────────────────────────────────

  describe("Step 1 — Identification (téléphone)", () => {
    it("affiche le formulaire téléphone par défaut", () => {
      const { getByTestId } = render(<PinRecoveryScreen />);
      expect(getByTestId("step-1")).toBeTruthy();
      expect(getByTestId("input-phone")).toBeTruthy();
    });

    it("affiche une erreur si le téléphone est vide", async () => {
      const { getByTestId, findByTestId } = render(<PinRecoveryScreen />);
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-phone");
      expect(err.props.children).toBe("Le numéro de téléphone est requis.");
    });

    it("affiche une erreur si le téléphone n'a pas 9 chiffres", async () => {
      const { getByTestId, findByTestId } = render(<PinRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-phone"), "65000000");
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-phone");
      expect(err.props.children).toContain("9 chiffres");
    });

    it("affiche l'erreur API sur NOT_FOUND", async () => {
      mockOptions.mockRejectedValueOnce({ code: "NOT_FOUND", statusCode: 404 });
      const { getByTestId, findByTestId } = render(<PinRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-phone"), "650000001");
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Aucun compte trouvé avec ces informations.",
      );
    });

    it("affiche l'erreur générique sur erreur réseau", async () => {
      mockOptions.mockRejectedValueOnce(new Error("Network error"));
      const { getByTestId, findByTestId } = render(<PinRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-phone"), "650000001");
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Impossible de se connecter. Vérifiez votre connexion.",
      );
    });

    it("passe à l'étape 2 après succès de l'API", async () => {
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      const { getByTestId, findByTestId } = render(<PinRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-phone"), "650000001");
      fireEvent.press(getByTestId("btn-step1"));
      await findByTestId("step-2");
      expect(mockOptions).toHaveBeenCalledWith({ phone: "650000001" });
    });

    it("appelle router.back() sur 'Retour' depuis l'étape 1", () => {
      const { getByTestId } = render(<PinRecoveryScreen />);
      fireEvent.press(getByTestId("back-button"));
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  // ── Step 2 ──────────────────────────────────────────────────────────────

  describe("Step 2 — Vérification identité", () => {
    async function goToStep2() {
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      const utils = render(<PinRecoveryScreen />);
      fireEvent.changeText(utils.getByTestId("input-phone"), "650000001");
      fireEvent.press(utils.getByTestId("btn-step1"));
      await utils.findByTestId("step-2");
      return utils;
    }

    it("affiche le hint et les questions dynamiques", async () => {
      const { findByText, getByTestId } = await goToStep2();
      expect(await findByText("6***3")).toBeTruthy();
      expect(getByTestId("input-answer-0")).toBeTruthy();
      expect(getByTestId("input-answer-1")).toBeTruthy();
      expect(getByTestId("input-answer-2")).toBeTruthy();
    });

    it("affiche une erreur si la date de naissance est vide", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-birthdate");
      expect(err.props.children).toBe("La date de naissance est obligatoire.");
    });

    it("affiche une erreur si le format de date est invalide", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      // "1234" → formatDateInput → "12/34" (5 chars) → regex fails → "Format attendu"
      fireEvent.changeText(getByTestId("input-birthdate"), "1234");
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-birthdate");
      expect(err.props.children).toBe("Format attendu : JJ/MM/AAAA.");
    });

    it("affiche une erreur si les réponses sont manquantes", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
      // N'a remplit qu'une seule réponse
      fireEvent.changeText(getByTestId("input-answer-0"), "dupont");
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toContain("Répondez à toutes les questions");
    });

    it("affiche une erreur si une réponse est trop courte (< 2 chars)", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(getByTestId("input-answer-0"), "x");
      fireEvent.changeText(getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(getByTestId("input-answer-2"), "football");
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toContain("min. 2 caractères");
    });

    it("affiche l'erreur API RECOVERY_INVALID", async () => {
      mockVerify.mockRejectedValueOnce({
        code: "RECOVERY_INVALID",
        statusCode: 400,
      });
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(getByTestId("input-answer-2"), "football");
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Informations de récupération invalides.",
      );
    });

    it("passe à l'étape 3 après vérification réussie", async () => {
      mockVerify.mockResolvedValueOnce(MOCK_VERIFY_RESPONSE);
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(getByTestId("input-answer-2"), "football");
      fireEvent.press(getByTestId("btn-step2"));
      await findByTestId("step-3");
      expect(mockVerify).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: "650000001",
          birthDate: "1990-01-15",
          answers: expect.arrayContaining([
            expect.objectContaining({
              questionKey: "MOTHER_MAIDEN_NAME",
              answer: "dupont",
            }),
          ]),
        }),
      );
    });

    it("appuyer sur Retour depuis l'étape 2 revient à l'étape 1", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.press(getByTestId("back-button"));
      await findByTestId("step-1");
    });
  });

  // ── Step 3 ──────────────────────────────────────────────────────────────

  describe("Step 3 — Nouveau PIN", () => {
    async function goToStep3() {
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      mockVerify.mockResolvedValueOnce(MOCK_VERIFY_RESPONSE);
      const utils = render(<PinRecoveryScreen />);
      fireEvent.changeText(utils.getByTestId("input-phone"), "650000001");
      fireEvent.press(utils.getByTestId("btn-step1"));
      await utils.findByTestId("step-2");
      fireEvent.changeText(utils.getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(utils.getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(utils.getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(utils.getByTestId("input-answer-2"), "football");
      fireEvent.press(utils.getByTestId("btn-step2"));
      await utils.findByTestId("step-3");
      return utils;
    }

    it("affiche une erreur si le nouveau PIN est invalide (trop court)", async () => {
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-new-pin"), "12345");
      fireEvent.changeText(getByTestId("input-confirm-pin"), "12345");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-new-pin");
      expect(err.props.children).toContain("exactement 6 chiffres");
    });

    it("affiche une erreur si le PIN contient des lettres", async () => {
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-new-pin"), "12345a");
      fireEvent.changeText(getByTestId("input-confirm-pin"), "12345a");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-new-pin");
      expect(err.props.children).toContain("exactement 6 chiffres");
    });

    it("affiche une erreur si la confirmation ne correspond pas", async () => {
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-new-pin"), "123456");
      fireEvent.changeText(getByTestId("input-confirm-pin"), "654321");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-confirm-pin");
      expect(err.props.children).toContain("La confirmation ne correspond pas");
    });

    it("affiche une erreur si confirmPin est vide", async () => {
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-new-pin"), "123456");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-confirm-pin");
      expect(err.props.children).toBe("Confirmez le PIN.");
    });

    it("affiche l'erreur RECOVERY_SESSION_EXPIRED", async () => {
      mockComplete.mockRejectedValueOnce({
        code: "RECOVERY_SESSION_EXPIRED",
        statusCode: 401,
      });
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-new-pin"), "654321");
      fireEvent.changeText(getByTestId("input-confirm-pin"), "654321");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toContain("Session expirée");
    });

    it("affiche l'erreur SAME_PIN", async () => {
      mockComplete.mockRejectedValueOnce({ code: "SAME_PIN", statusCode: 400 });
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-new-pin"), "123456");
      fireEvent.changeText(getByTestId("input-confirm-pin"), "123456");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Le nouveau PIN doit être différent de l'actuel.",
      );
    });

    it("passe à l'étape 4 (succès) après completion réussie", async () => {
      mockComplete.mockResolvedValueOnce(MOCK_COMPLETE_RESPONSE);
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-new-pin"), "654321");
      fireEvent.changeText(getByTestId("input-confirm-pin"), "654321");
      fireEvent.press(getByTestId("btn-step3"));
      await findByTestId("step-4");
      expect(mockComplete).toHaveBeenCalledWith({
        recoveryToken: "e2e-recovery-token",
        newPin: "654321",
      });
    });
  });

  // ── Step 4 (Succès) ──────────────────────────────────────────────────────

  describe("Step 4 — Succès", () => {
    async function goToStep4() {
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      mockVerify.mockResolvedValueOnce(MOCK_VERIFY_RESPONSE);
      mockComplete.mockResolvedValueOnce(MOCK_COMPLETE_RESPONSE);
      const utils = render(<PinRecoveryScreen />);
      fireEvent.changeText(utils.getByTestId("input-phone"), "650000001");
      fireEvent.press(utils.getByTestId("btn-step1"));
      await utils.findByTestId("step-2");
      fireEvent.changeText(utils.getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(utils.getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(utils.getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(utils.getByTestId("input-answer-2"), "football");
      fireEvent.press(utils.getByTestId("btn-step2"));
      await utils.findByTestId("step-3");
      fireEvent.changeText(utils.getByTestId("input-new-pin"), "654321");
      fireEvent.changeText(utils.getByTestId("input-confirm-pin"), "654321");
      fireEvent.press(utils.getByTestId("btn-step3"));
      await utils.findByTestId("step-4");
      return utils;
    }

    it("affiche l'écran de succès avec le bouton 'Se connecter'", async () => {
      const { getByTestId } = await goToStep4();
      expect(getByTestId("btn-go-login")).toBeTruthy();
      expect(getByTestId("step-4")).toBeTruthy();
    });

    it("navigue vers /login en appuyant sur 'Se connecter'", async () => {
      const { getByTestId } = await goToStep4();
      fireEvent.press(getByTestId("btn-go-login"));
      expect(mockRouter.replace).toHaveBeenCalledWith("/login");
    });

    it("n'affiche plus le bouton Retour sur l'écran de succès", async () => {
      const { queryByTestId } = await goToStep4();
      expect(queryByTestId("back-button")).toBeNull();
    });
  });
});
