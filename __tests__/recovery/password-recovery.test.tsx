import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PasswordRecoveryScreen, {
  pwdRecoveryStep1Schema,
  pwdRecoveryStep2Schema,
  pwdRecoveryStep4Schema,
  parsePasswordRecoveryApiError,
} from "../../app/recovery/password";
import { recoveryApi } from "../../src/api/recovery.api";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/recovery.api", () => ({
  recoveryApi: {
    forgotPasswordRequest: jest.fn(),
    forgotPasswordOptions: jest.fn(),
    forgotPasswordVerify: jest.fn(),
    forgotPasswordComplete: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const { router: mockRouter } = require("expo-router") as {
  router: { replace: jest.Mock; back: jest.Mock; push: jest.Mock };
};

const mockRequest = recoveryApi.forgotPasswordRequest as jest.MockedFunction<
  typeof recoveryApi.forgotPasswordRequest
>;
const mockOptions = recoveryApi.forgotPasswordOptions as jest.MockedFunction<
  typeof recoveryApi.forgotPasswordOptions
>;
const mockVerify = recoveryApi.forgotPasswordVerify as jest.MockedFunction<
  typeof recoveryApi.forgotPasswordVerify
>;
const mockComplete = recoveryApi.forgotPasswordComplete as jest.MockedFunction<
  typeof recoveryApi.forgotPasswordComplete
>;

const MOCK_REQUEST_RESPONSE = {
  success: true,
  message: "Si ce compte existe, un lien a été envoyé.",
};

const MOCK_OPTIONS_RESPONSE = {
  success: true,
  emailHint: "t***t@example.com",
  schoolSlug: null,
  questions: [
    { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
    { key: "BIRTH_CITY", label: "Votre ville de naissance" },
    { key: "FAVORITE_SPORT", label: "Votre sport préféré" },
  ],
};

const MOCK_VERIFY_RESPONSE = { success: true, verified: true };
const MOCK_COMPLETE_RESPONSE = { success: true };
const VALID_TOKEN = "a".repeat(48);

// ── Schémas Zod ───────────────────────────────────────────────────────────────

describe("pwdRecoveryStep1Schema", () => {
  it("accepte un email valide", () => {
    expect(
      pwdRecoveryStep1Schema.safeParse({ email: "test@example.com" }).success,
    ).toBe(true);
  });

  it("rejette un email vide", () => {
    const r = pwdRecoveryStep1Schema.safeParse({ email: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("L'adresse email est requise.");
  });

  it("rejette un email invalide", () => {
    const r = pwdRecoveryStep1Schema.safeParse({ email: "notanemail" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Adresse email invalide.");
  });

  it("rejette un email sans domaine", () => {
    expect(pwdRecoveryStep1Schema.safeParse({ email: "test@" }).success).toBe(
      false,
    );
  });
});

describe("pwdRecoveryStep2Schema", () => {
  it("accepte un token d'au moins 16 caractères", () => {
    expect(
      pwdRecoveryStep2Schema.safeParse({ token: "a".repeat(16) }).success,
    ).toBe(true);
  });

  it("rejette un token trop court", () => {
    const r = pwdRecoveryStep2Schema.safeParse({ token: "short" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("invalide");
  });

  it("rejette un token vide", () => {
    const r = pwdRecoveryStep2Schema.safeParse({ token: "" });
    expect(r.success).toBe(false);
  });
});

describe("pwdRecoveryStep4Schema", () => {
  const valid = { newPassword: "ValidPass1", confirmPassword: "ValidPass1" };

  it("accepte un mot de passe valide", () => {
    expect(pwdRecoveryStep4Schema.safeParse(valid).success).toBe(true);
  });

  it("rejette un mot de passe de moins de 8 caractères", () => {
    const r = pwdRecoveryStep4Schema.safeParse({
      ...valid,
      newPassword: "Ab1",
      confirmPassword: "Ab1",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("au moins 8 caractères");
  });

  it("rejette un mot de passe sans majuscule", () => {
    const r = pwdRecoveryStep4Schema.safeParse({
      newPassword: "validpass1",
      confirmPassword: "validpass1",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("majuscules");
  });

  it("rejette un mot de passe sans minuscule", () => {
    const r = pwdRecoveryStep4Schema.safeParse({
      newPassword: "VALIDPASS1",
      confirmPassword: "VALIDPASS1",
    });
    expect(r.success).toBe(false);
  });

  it("rejette un mot de passe sans chiffre", () => {
    const r = pwdRecoveryStep4Schema.safeParse({
      newPassword: "ValidPassword",
      confirmPassword: "ValidPassword",
    });
    expect(r.success).toBe(false);
  });

  it("rejette un confirmPassword vide", () => {
    const r = pwdRecoveryStep4Schema.safeParse({
      newPassword: "ValidPass1",
      confirmPassword: "",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Confirmez le mot de passe.");
  });

  it("rejette si les mots de passe ne correspondent pas", () => {
    const r = pwdRecoveryStep4Schema.safeParse({
      newPassword: "ValidPass1",
      confirmPassword: "OtherPass2",
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toContain("confirmPassword");
    expect(r.error?.issues[0].message).toContain(
      "La confirmation ne correspond pas",
    );
  });
});

// ── parsePasswordRecoveryApiError ─────────────────────────────────────────────

describe("parsePasswordRecoveryApiError", () => {
  it("traduit RECOVERY_INVALID", () => {
    expect(parsePasswordRecoveryApiError({ code: "RECOVERY_INVALID" })).toBe(
      "Informations de récupération invalides.",
    );
  });

  it("traduit NOT_FOUND", () => {
    expect(parsePasswordRecoveryApiError({ code: "NOT_FOUND" })).toBe(
      "Aucun compte trouvé pour cette adresse email.",
    );
  });

  it("traduit TOKEN_EXPIRED", () => {
    expect(parsePasswordRecoveryApiError({ code: "TOKEN_EXPIRED" })).toBe(
      "Le lien a expiré. Recommencez depuis le début.",
    );
  });

  it("traduit RESET_TOKEN_EXPIRED", () => {
    expect(parsePasswordRecoveryApiError({ code: "RESET_TOKEN_EXPIRED" })).toBe(
      "Le lien a expiré. Recommencez depuis le début.",
    );
  });

  it("traduit TOKEN_INVALID", () => {
    expect(parsePasswordRecoveryApiError({ code: "TOKEN_INVALID" })).toBe(
      "Lien de réinitialisation invalide.",
    );
  });

  it("traduit SAME_PASSWORD", () => {
    expect(parsePasswordRecoveryApiError({ code: "SAME_PASSWORD" })).toBe(
      "Le nouveau mot de passe doit être différent de l'actuel.",
    );
  });

  it("utilise statusCode 404 en fallback", () => {
    expect(parsePasswordRecoveryApiError({ statusCode: 404 })).toBe(
      "Aucun compte trouvé pour cette adresse email.",
    );
  });

  it("utilise statusCode 401 en fallback", () => {
    expect(parsePasswordRecoveryApiError({ statusCode: 401 })).toBe(
      "Lien de réinitialisation invalide ou expiré.",
    );
  });

  it("retourne le message générique pour une erreur inconnue", () => {
    expect(parsePasswordRecoveryApiError({})).toBe(
      "Impossible de se connecter. Vérifiez votre connexion.",
    );
    expect(parsePasswordRecoveryApiError(null)).toBe(
      "Impossible de se connecter. Vérifiez votre connexion.",
    );
  });
});

// ── Composant PasswordRecoveryScreen ─────────────────────────────────────────

describe("PasswordRecoveryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Step 1 ──────────────────────────────────────────────────────────────

  describe("Step 1 — Saisie de l'email", () => {
    it("affiche le formulaire email par défaut", () => {
      const { getByTestId } = render(<PasswordRecoveryScreen />);
      expect(getByTestId("step-1")).toBeTruthy();
      expect(getByTestId("input-email")).toBeTruthy();
    });

    it("affiche une erreur si l'email est vide", async () => {
      const { getByTestId, findByTestId } = render(<PasswordRecoveryScreen />);
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-email");
      expect(err.props.children).toBe("L'adresse email est requise.");
    });

    it("affiche une erreur si l'email est invalide", async () => {
      const { getByTestId, findByTestId } = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-email"), "notanemail");
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-email");
      expect(err.props.children).toBe("Adresse email invalide.");
    });

    it("affiche l'erreur API NOT_FOUND", async () => {
      mockRequest.mockRejectedValueOnce({ code: "NOT_FOUND", statusCode: 404 });
      const { getByTestId, findByTestId } = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-email"), "test@example.com");
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Aucun compte trouvé pour cette adresse email.",
      );
    });

    it("affiche l'erreur réseau générique", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Network error"));
      const { getByTestId, findByTestId } = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-email"), "test@example.com");
      fireEvent.press(getByTestId("btn-step1"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Impossible de se connecter. Vérifiez votre connexion.",
      );
    });

    it("passe à l'étape 2 après succès", async () => {
      mockRequest.mockResolvedValueOnce(MOCK_REQUEST_RESPONSE);
      const { getByTestId, findByTestId } = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(getByTestId("input-email"), "test@example.com");
      fireEvent.press(getByTestId("btn-step1"));
      await findByTestId("step-2");
      expect(mockRequest).toHaveBeenCalledWith({ email: "test@example.com" });
    });

    it("navigue en arrière vers login sur 'Retour'", () => {
      const { getByTestId } = render(<PasswordRecoveryScreen />);
      fireEvent.press(getByTestId("back-button"));
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  // ── Step 2 ──────────────────────────────────────────────────────────────

  describe("Step 2 — Saisie du token", () => {
    async function goToStep2() {
      mockRequest.mockResolvedValueOnce(MOCK_REQUEST_RESPONSE);
      const utils = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(
        utils.getByTestId("input-email"),
        "test@example.com",
      );
      fireEvent.press(utils.getByTestId("btn-step1"));
      await utils.findByTestId("step-2");
      return utils;
    }

    it("affiche le champ token et le message d'info email", async () => {
      const { getByTestId, getByText } = await goToStep2();
      expect(getByTestId("input-token")).toBeTruthy();
      expect(getByText("test@example.com")).toBeTruthy();
    });

    it("affiche une erreur si le token est trop court", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-token"), "short");
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-token");
      expect(err.props.children).toContain("invalide");
    });

    it("affiche une erreur si le token est vide", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-token");
      expect(err.props.children).toBeTruthy();
    });

    it("affiche l'erreur API TOKEN_INVALID", async () => {
      mockOptions.mockRejectedValueOnce({
        code: "TOKEN_INVALID",
        statusCode: 400,
      });
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-token"), VALID_TOKEN);
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe("Lien de réinitialisation invalide.");
    });

    it("affiche l'erreur API TOKEN_EXPIRED", async () => {
      mockOptions.mockRejectedValueOnce({
        code: "TOKEN_EXPIRED",
        statusCode: 401,
      });
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-token"), VALID_TOKEN);
      fireEvent.press(getByTestId("btn-step2"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toContain("expiré");
    });

    it("passe à l'étape 3 après chargement des questions", async () => {
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.changeText(getByTestId("input-token"), VALID_TOKEN);
      fireEvent.press(getByTestId("btn-step2"));
      await findByTestId("step-3");
      expect(mockOptions).toHaveBeenCalledWith({ token: VALID_TOKEN });
    });

    it("peut renvoyer l'email avec le bouton 'Renvoyer'", async () => {
      mockRequest.mockResolvedValueOnce(MOCK_REQUEST_RESPONSE);
      const { getByTestId } = await goToStep2();
      fireEvent.press(getByTestId("btn-resend"));
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledTimes(2);
      });
    });

    it("revient à l'étape 1 en appuyant sur Retour", async () => {
      const { getByTestId, findByTestId } = await goToStep2();
      fireEvent.press(getByTestId("back-button"));
      await findByTestId("step-1");
    });
  });

  // ── Step 3 ──────────────────────────────────────────────────────────────

  describe("Step 3 — Vérification identité", () => {
    async function goToStep3() {
      mockRequest.mockResolvedValueOnce(MOCK_REQUEST_RESPONSE);
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      const utils = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(
        utils.getByTestId("input-email"),
        "test@example.com",
      );
      fireEvent.press(utils.getByTestId("btn-step1"));
      await utils.findByTestId("step-2");
      fireEvent.changeText(utils.getByTestId("input-token"), VALID_TOKEN);
      fireEvent.press(utils.getByTestId("btn-step2"));
      await utils.findByTestId("step-3");
      return utils;
    }

    it("affiche le hint email et les questions", async () => {
      const { findByText, getByTestId } = await goToStep3();
      expect(await findByText("t***t@example.com")).toBeTruthy();
      expect(getByTestId("input-answer-0")).toBeTruthy();
      expect(getByTestId("input-answer-1")).toBeTruthy();
      expect(getByTestId("input-answer-2")).toBeTruthy();
    });

    it("affiche une erreur si la date est vide", async () => {
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-birthdate");
      expect(err.props.children).toBe("La date de naissance est obligatoire.");
    });

    it("affiche une erreur si le format de date est invalide", async () => {
      const { getByTestId, findByTestId } = await goToStep3();
      // "1234" → formatDateInput → "12/34" (5 chars) → regex fails → "Format attendu"
      fireEvent.changeText(getByTestId("input-birthdate"), "1234");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-birthdate");
      expect(err.props.children).toBe("Format attendu : JJ/MM/AAAA.");
    });

    it("affiche une erreur si les réponses sont incomplètes", async () => {
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toContain("Répondez à toutes les questions");
    });

    it("affiche l'erreur API RECOVERY_INVALID", async () => {
      mockVerify.mockRejectedValueOnce({
        code: "RECOVERY_INVALID",
        statusCode: 400,
      });
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(getByTestId("input-answer-2"), "football");
      fireEvent.press(getByTestId("btn-step3"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Informations de récupération invalides.",
      );
    });

    it("passe à l'étape 4 après vérification réussie", async () => {
      mockVerify.mockResolvedValueOnce(MOCK_VERIFY_RESPONSE);
      const { getByTestId, findByTestId } = await goToStep3();
      fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(getByTestId("input-answer-2"), "football");
      fireEvent.press(getByTestId("btn-step3"));
      await findByTestId("step-4");
      expect(mockVerify).toHaveBeenCalledWith(
        expect.objectContaining({
          token: VALID_TOKEN,
          birthDate: "1990-01-15",
        }),
      );
    });
  });

  // ── Step 4 ──────────────────────────────────────────────────────────────

  describe("Step 4 — Nouveau mot de passe", () => {
    async function goToStep4() {
      mockRequest.mockResolvedValueOnce(MOCK_REQUEST_RESPONSE);
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      mockVerify.mockResolvedValueOnce(MOCK_VERIFY_RESPONSE);
      const utils = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(
        utils.getByTestId("input-email"),
        "test@example.com",
      );
      fireEvent.press(utils.getByTestId("btn-step1"));
      await utils.findByTestId("step-2");
      fireEvent.changeText(utils.getByTestId("input-token"), VALID_TOKEN);
      fireEvent.press(utils.getByTestId("btn-step2"));
      await utils.findByTestId("step-3");
      fireEvent.changeText(utils.getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(utils.getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(utils.getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(utils.getByTestId("input-answer-2"), "football");
      fireEvent.press(utils.getByTestId("btn-step3"));
      await utils.findByTestId("step-4");
      return utils;
    }

    it("affiche les champs nouveau mot de passe et confirmation", async () => {
      const { getByTestId } = await goToStep4();
      expect(getByTestId("input-new-password")).toBeTruthy();
      expect(getByTestId("input-confirm-password")).toBeTruthy();
    });

    it("affiche une erreur si le mot de passe est trop court", async () => {
      const { getByTestId, findByTestId } = await goToStep4();
      // "Abc1" échoue min(8) ET regex — la première erreur (min) doit s'afficher
      fireEvent.changeText(getByTestId("input-new-password"), "Abc1");
      fireEvent.changeText(getByTestId("input-confirm-password"), "Abc1");
      fireEvent.press(getByTestId("btn-step4"));
      const err = await findByTestId("error-new-password");
      expect(err.props.children).toBe(
        "Le mot de passe doit faire au moins 8 caractères.",
      );
    });

    it("affiche une erreur si le mot de passe manque de majuscule", async () => {
      const { getByTestId, findByTestId } = await goToStep4();
      fireEvent.changeText(getByTestId("input-new-password"), "validpass1");
      fireEvent.changeText(getByTestId("input-confirm-password"), "validpass1");
      fireEvent.press(getByTestId("btn-step4"));
      const err = await findByTestId("error-new-password");
      expect(err.props.children).toContain("majuscules");
    });

    it("affiche une erreur si la confirmation ne correspond pas", async () => {
      const { getByTestId, findByTestId } = await goToStep4();
      fireEvent.changeText(getByTestId("input-new-password"), "ValidPass1");
      fireEvent.changeText(getByTestId("input-confirm-password"), "OtherPass2");
      fireEvent.press(getByTestId("btn-step4"));
      const err = await findByTestId("error-confirm-password");
      expect(err.props.children).toContain("La confirmation ne correspond pas");
    });

    it("affiche l'erreur SAME_PASSWORD", async () => {
      mockComplete.mockRejectedValueOnce({
        code: "SAME_PASSWORD",
        statusCode: 400,
      });
      const { getByTestId, findByTestId } = await goToStep4();
      fireEvent.changeText(getByTestId("input-new-password"), "ValidPass1");
      fireEvent.changeText(getByTestId("input-confirm-password"), "ValidPass1");
      fireEvent.press(getByTestId("btn-step4"));
      const err = await findByTestId("error-message");
      expect(err.props.children).toBe(
        "Le nouveau mot de passe doit être différent de l'actuel.",
      );
    });

    it("passe à l'étape 5 (succès) après completion", async () => {
      mockComplete.mockResolvedValueOnce(MOCK_COMPLETE_RESPONSE);
      const { getByTestId, findByTestId } = await goToStep4();
      fireEvent.changeText(getByTestId("input-new-password"), "NewValidPass1");
      fireEvent.changeText(
        getByTestId("input-confirm-password"),
        "NewValidPass1",
      );
      fireEvent.press(getByTestId("btn-step4"));
      await findByTestId("step-5");
      expect(mockComplete).toHaveBeenCalledWith({
        token: VALID_TOKEN,
        newPassword: "NewValidPass1",
      });
    });

    it("le toggle 'Voir/Cacher' change la visibilité du mot de passe", async () => {
      const { getByTestId } = await goToStep4();
      expect(getByTestId("input-new-password").props.secureTextEntry).toBe(
        true,
      );
      expect(getByTestId("input-confirm-password").props.secureTextEntry).toBe(
        true,
      );
      fireEvent.press(getByTestId("toggle-show-password"));
      expect(getByTestId("input-new-password").props.secureTextEntry).toBe(
        false,
      );
      expect(getByTestId("input-confirm-password").props.secureTextEntry).toBe(
        true,
      );
    });
  });

  // ── Step 5 (Succès) ──────────────────────────────────────────────────────

  describe("Step 5 — Succès", () => {
    async function goToStep5() {
      mockRequest.mockResolvedValueOnce(MOCK_REQUEST_RESPONSE);
      mockOptions.mockResolvedValueOnce(MOCK_OPTIONS_RESPONSE);
      mockVerify.mockResolvedValueOnce(MOCK_VERIFY_RESPONSE);
      mockComplete.mockResolvedValueOnce(MOCK_COMPLETE_RESPONSE);
      const utils = render(<PasswordRecoveryScreen />);
      fireEvent.changeText(
        utils.getByTestId("input-email"),
        "test@example.com",
      );
      fireEvent.press(utils.getByTestId("btn-step1"));
      await utils.findByTestId("step-2");
      fireEvent.changeText(utils.getByTestId("input-token"), VALID_TOKEN);
      fireEvent.press(utils.getByTestId("btn-step2"));
      await utils.findByTestId("step-3");
      fireEvent.changeText(utils.getByTestId("input-birthdate"), "15011990");
      fireEvent.changeText(utils.getByTestId("input-answer-0"), "dupont");
      fireEvent.changeText(utils.getByTestId("input-answer-1"), "yaoundé");
      fireEvent.changeText(utils.getByTestId("input-answer-2"), "football");
      fireEvent.press(utils.getByTestId("btn-step3"));
      await utils.findByTestId("step-4");
      fireEvent.changeText(utils.getByTestId("input-new-password"), "NewPass1");
      fireEvent.changeText(
        utils.getByTestId("input-confirm-password"),
        "NewPass1",
      );
      fireEvent.press(utils.getByTestId("btn-step4"));
      await utils.findByTestId("step-5");
      return utils;
    }

    it("affiche l'écran de succès", async () => {
      const { getByTestId } = await goToStep5();
      expect(getByTestId("step-5")).toBeTruthy();
    });

    it("navigue vers /login en appuyant sur 'Se connecter'", async () => {
      const { getByTestId } = await goToStep5();
      fireEvent.press(getByTestId("btn-go-login"));
      expect(mockRouter.replace).toHaveBeenCalledWith("/login");
    });

    it("n'affiche plus le bouton Retour sur l'écran de succès", async () => {
      const { queryByTestId } = await goToStep5();
      expect(queryByTestId("back-button")).toBeNull();
    });
  });
});
