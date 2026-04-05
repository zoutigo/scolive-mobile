import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import OnboardingScreen, {
  buildOnboardingRecoveryRows,
  emailOnboardingStep1Schema,
  onboardingPinStepSchema,
  onboardingProfileStepSchema,
  onboardingRecoverySelectionStepSchema,
  onboardingRecoveryStepSchema,
  parseOnboardingApiError,
  phoneOnboardingStep1Schema,
} from "../../app/onboarding";
import { authApi } from "../../src/api/auth.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

let mockParams: Record<string, string | undefined> = {
  email: "parent@ecole.cm",
};

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/api/auth.api", () => ({
  authApi: {
    getOnboardingOptions: jest.fn(),
    completeOnboarding: jest.fn(),
  },
}));

const { router: mockRouter } = require("expo-router") as {
  router: { push: jest.Mock; replace: jest.Mock; back: jest.Mock };
};

const mockGetOnboardingOptions =
  authApi.getOnboardingOptions as jest.MockedFunction<
    typeof authApi.getOnboardingOptions
  >;
const mockCompleteOnboarding =
  authApi.completeOnboarding as jest.MockedFunction<
    typeof authApi.completeOnboarding
  >;

const parentOptions = {
  schoolSlug: "ecole-demo",
  schoolRoles: ["PARENT"],
  questions: [
    { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
    { key: "BIRTH_CITY", label: "Ville de naissance" },
    { key: "FAVORITE_SPORT", label: "Sport préféré" },
    { key: "FAVORITE_BOOK", label: "Livre préféré" },
  ],
  classes: [{ id: "class-1", name: "6e A", year: "2025-2026" }],
  students: [{ id: "student-1", firstName: "Paul", lastName: "MBELE" }],
};

const teacherOptions = {
  schoolSlug: "ecole-demo",
  schoolRoles: ["TEACHER"],
  questions: [
    { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
    { key: "BIRTH_CITY", label: "Ville de naissance" },
    { key: "FAVORITE_SPORT", label: "Sport préféré" },
  ],
  classes: [],
  students: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { email: "parent@ecole.cm" };
  mockGetOnboardingOptions.mockResolvedValue(parentOptions);
  mockCompleteOnboarding.mockResolvedValue({ success: true, schoolSlug: null });
});

describe("emailOnboardingStep1Schema", () => {
  it("accepte des identifiants valides", () => {
    expect(
      emailOnboardingStep1Schema.safeParse({
        email: "parent@ecole.cm",
        temporaryPassword: "TempPass11",
        newPassword: "NewPassWord9",
        confirmPassword: "NewPassWord9",
      }).success,
    ).toBe(true);
  });

  it("rejette une confirmation différente", () => {
    const result = emailOnboardingStep1Schema.safeParse({
      email: "parent@ecole.cm",
      temporaryPassword: "TempPass11",
      newPassword: "NewPassWord9",
      confirmPassword: "OtherPass9",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("confirmation");
  });
});

describe("phoneOnboardingStep1Schema", () => {
  it("accepte un email vide si le setupToken est fourni", () => {
    expect(
      phoneOnboardingStep1Schema.safeParse({
        email: "",
        setupToken: "setup-token",
      }).success,
    ).toBe(true);
  });

  it("rejette un email invalide", () => {
    const result = phoneOnboardingStep1Schema.safeParse({
      email: "not-an-email",
      setupToken: "setup-token",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Adresse email invalide.");
  });
});

describe("onboardingProfileStepSchema", () => {
  it("accepte un profil valide", () => {
    expect(
      onboardingProfileStepSchema.safeParse({
        firstName: "Lisa",
        lastName: "Mbele",
        gender: "F",
        birthDate: "09/01/1987",
      }).success,
    ).toBe(true);
  });

  it("rejette une date future", () => {
    const result = onboardingProfileStepSchema.safeParse({
      firstName: "Lisa",
      lastName: "Mbele",
      gender: "F",
      birthDate: "01/01/2999",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("futur");
  });
});

describe("onboardingPinStepSchema", () => {
  it("rejette un PIN invalide", () => {
    const result = onboardingPinStepSchema.safeParse({
      newPin: "123",
      confirmPin: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingRecoveryStepSchema", () => {
  it("rejette moins de 3 questions", () => {
    const result = onboardingRecoveryStepSchema.safeParse({
      selectedQuestions: ["MOTHER_MAIDEN_NAME"],
      answers: { MOTHER_MAIDEN_NAME: "Abena" },
      isParent: false,
    });
    expect(result.success).toBe(false);
  });

  it("demande classe et enfant pour un parent", () => {
    const result = onboardingRecoveryStepSchema.safeParse({
      selectedQuestions: ["MOTHER_MAIDEN_NAME", "BIRTH_CITY", "FAVORITE_SPORT"],
      answers: {
        MOTHER_MAIDEN_NAME: "Abena",
        BIRTH_CITY: "Douala",
        FAVORITE_SPORT: "Basket",
      },
      isParent: true,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(["parentClassId", "parentStudentId"]),
    );
  });
});

describe("onboardingRecoverySelectionStepSchema", () => {
  it("rejette moins de 3 questions", () => {
    const result = onboardingRecoverySelectionStepSchema.safeParse({
      selectedQuestions: ["MOTHER_MAIDEN_NAME"],
    });
    expect(result.success).toBe(false);
  });
});

describe("helpers", () => {
  it("construit les réponses de récupération dans l'ordre", () => {
    expect(
      buildOnboardingRecoveryRows(["BIRTH_CITY", "FAVORITE_SPORT"], {
        FAVORITE_SPORT: "Basket",
        BIRTH_CITY: "Douala",
      }),
    ).toEqual([
      { questionKey: "BIRTH_CITY", answer: "Douala" },
      { questionKey: "FAVORITE_SPORT", answer: "Basket" },
    ]);
  });

  it("traduit une erreur d'activation invalide", () => {
    expect(parseOnboardingApiError({ code: "INVALID_CREDENTIALS" })).toBe(
      "Informations d'activation invalides.",
    );
  });

  it("privilégie le message backend quand il existe", () => {
    expect(
      parseOnboardingApiError({
        message: "Cette adresse email est deja utilisee.",
      }),
    ).toBe("Cette adresse email est deja utilisee.");
  });
});

describe("OnboardingScreen", () => {
  it("charge les options d'onboarding avec l'email issu de la route", async () => {
    render(<OnboardingScreen />);

    await waitFor(() =>
      expect(mockGetOnboardingOptions).toHaveBeenCalledWith({
        email: "parent@ecole.cm",
      }),
    );
  });

  it("affiche une erreur de validation sur l'étape email", async () => {
    const { getByTestId, findByTestId } = render(<OnboardingScreen />);

    fireEvent.press(getByTestId("btn-step1"));

    const error = await findByTestId("error-temporary-password");
    expect(error.props.children).toBe(
      "Le mot de passe provisoire est obligatoire.",
    );
  });

  it("permet d'afficher les mots de passe sur l'étape email", async () => {
    const { getByTestId, findByTestId } = render(<OnboardingScreen />);

    await findByTestId("step-1");

    expect(getByTestId("input-temporary-password").props.secureTextEntry).toBe(
      true,
    );
    fireEvent.press(
      getByTestId("input-temporary-password-toggle-visibility"),
    );
    expect(getByTestId("input-temporary-password").props.secureTextEntry).toBe(
      false,
    );

    expect(getByTestId("input-new-password").props.secureTextEntry).toBe(true);
    fireEvent.press(getByTestId("input-new-password-toggle-visibility"));
    expect(getByTestId("input-new-password").props.secureTextEntry).toBe(
      false,
    );
    expect(getByTestId("input-confirm-password").props.secureTextEntry).toBe(
      true,
    );
  });

  it("termine le parcours email parent et soumet le payload attendu", async () => {
    const { getByTestId, findByTestId } = render(<OnboardingScreen />);

    await findByTestId("step-1");

    fireEvent.changeText(getByTestId("input-temporary-password"), "TempPass11");
    fireEvent.changeText(getByTestId("input-new-password"), "NewPassWord9");
    fireEvent.changeText(getByTestId("input-confirm-password"), "NewPassWord9");
    fireEvent.press(getByTestId("btn-step1"));

    await findByTestId("step-2");
    fireEvent.changeText(getByTestId("input-first-name"), "Lisa");
    fireEvent.changeText(getByTestId("input-last-name"), "Mbele");
    fireEvent.press(getByTestId("gender-F"));
    fireEvent.changeText(getByTestId("input-birthdate"), "09011987");
    fireEvent.press(getByTestId("btn-step2"));

    await findByTestId("step-3");
    fireEvent.press(getByTestId("question-MOTHER_MAIDEN_NAME"));
    fireEvent.press(getByTestId("question-BIRTH_CITY"));
    fireEvent.press(getByTestId("question-FAVORITE_SPORT"));
    fireEvent.press(getByTestId("btn-step3"));

    await findByTestId("step-4");
    fireEvent.changeText(getByTestId("input-answer-0"), "Abena");
    fireEvent.changeText(getByTestId("input-answer-1"), "Douala");
    fireEvent.changeText(getByTestId("input-answer-2"), "Basket");
    fireEvent.press(getByTestId("parent-class-class-1"));
    fireEvent.press(getByTestId("parent-student-student-1"));
    fireEvent.press(getByTestId("btn-submit-onboarding"));

    await waitFor(() =>
      expect(mockCompleteOnboarding).toHaveBeenCalledWith({
        email: "parent@ecole.cm",
        temporaryPassword: "TempPass11",
        newPassword: "NewPassWord9",
        firstName: "Lisa",
        lastName: "Mbele",
        gender: "F",
        birthDate: "1987-01-09",
        answers: [
          { questionKey: "MOTHER_MAIDEN_NAME", answer: "Abena" },
          { questionKey: "BIRTH_CITY", answer: "Douala" },
          { questionKey: "FAVORITE_SPORT", answer: "Basket" },
        ],
        parentClassId: "class-1",
        parentStudentId: "student-1",
      }),
    );

    await findByTestId("step-5");
    fireEvent.press(getByTestId("btn-go-login"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("termine le parcours phone et envoie setupToken + nouveau PIN", async () => {
    mockParams = {
      setupToken: "setup-token-phone",
      email: "teacher@ecole.cm",
      schoolSlug: "ecole-demo",
    };
    mockGetOnboardingOptions.mockResolvedValue(teacherOptions);

    const { getByTestId, findByTestId } = render(<OnboardingScreen />);

    await findByTestId("step-1");
    fireEvent.press(getByTestId("btn-step1"));

    await findByTestId("step-2");
    fireEvent.changeText(getByTestId("input-first-name"), "Jean");
    fireEvent.changeText(getByTestId("input-last-name"), "Dupont");
    fireEvent.press(getByTestId("gender-M"));
    fireEvent.changeText(getByTestId("input-birthdate"), "15011990");
    fireEvent.press(getByTestId("btn-step2"));

    await findByTestId("step-3");
    expect(getByTestId("input-new-pin").props.secureTextEntry).toBe(true);
    fireEvent.press(getByTestId("input-new-pin-toggle-visibility"));
    expect(getByTestId("input-new-pin").props.secureTextEntry).toBe(false);
    fireEvent.changeText(getByTestId("input-new-pin"), "654321");
    fireEvent.changeText(getByTestId("input-confirm-pin"), "654321");
    fireEvent.press(getByTestId("btn-step3"));

    await findByTestId("step-4");
    fireEvent.press(getByTestId("question-MOTHER_MAIDEN_NAME"));
    fireEvent.press(getByTestId("question-BIRTH_CITY"));
    fireEvent.press(getByTestId("question-FAVORITE_SPORT"));
    fireEvent.press(getByTestId("btn-step4"));

    await findByTestId("step-5");
    fireEvent.changeText(getByTestId("input-answer-0"), "Amina");
    fireEvent.changeText(getByTestId("input-answer-1"), "Yaounde");
    fireEvent.changeText(getByTestId("input-answer-2"), "Football");
    fireEvent.press(getByTestId("btn-submit-onboarding"));

    await waitFor(() =>
      expect(mockCompleteOnboarding).toHaveBeenCalledWith({
        setupToken: "setup-token-phone",
        email: "teacher@ecole.cm",
        newPin: "654321",
        firstName: "Jean",
        lastName: "Dupont",
        gender: "M",
        birthDate: "1990-01-15",
        answers: [
          { questionKey: "MOTHER_MAIDEN_NAME", answer: "Amina" },
          { questionKey: "BIRTH_CITY", answer: "Yaounde" },
          { questionKey: "FAVORITE_SPORT", answer: "Football" },
        ],
        parentClassId: undefined,
        parentStudentId: undefined,
      }),
    );
  });

  it("bloque la soumission parent sans classe ni enfant", async () => {
    const { getByTestId, findByTestId } = render(<OnboardingScreen />);

    await findByTestId("step-1");
    fireEvent.changeText(getByTestId("input-temporary-password"), "TempPass11");
    fireEvent.changeText(getByTestId("input-new-password"), "NewPassWord9");
    fireEvent.changeText(getByTestId("input-confirm-password"), "NewPassWord9");
    fireEvent.press(getByTestId("btn-step1"));

    await findByTestId("step-2");
    fireEvent.changeText(getByTestId("input-first-name"), "Lisa");
    fireEvent.changeText(getByTestId("input-last-name"), "Mbele");
    fireEvent.press(getByTestId("gender-F"));
    fireEvent.changeText(getByTestId("input-birthdate"), "09011987");
    fireEvent.press(getByTestId("btn-step2"));

    await findByTestId("step-3");
    fireEvent.press(getByTestId("question-MOTHER_MAIDEN_NAME"));
    fireEvent.press(getByTestId("question-BIRTH_CITY"));
    fireEvent.press(getByTestId("question-FAVORITE_SPORT"));
    fireEvent.press(getByTestId("btn-step3"));

    await findByTestId("step-4");
    fireEvent.changeText(getByTestId("input-answer-0"), "Abena");
    fireEvent.changeText(getByTestId("input-answer-1"), "Douala");
    fireEvent.changeText(getByTestId("input-answer-2"), "Basket");
    fireEvent.press(getByTestId("btn-submit-onboarding"));

    await waitFor(() => expect(mockCompleteOnboarding).not.toHaveBeenCalled());
    expect(getByTestId("error-parentClassId")).toBeTruthy();
    expect(getByTestId("error-parentStudentId")).toBeTruthy();
  });
});
