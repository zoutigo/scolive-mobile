import {
  accountChangePasswordSchema,
  accountPersonalProfileSchema,
  accountRecoverySchema,
  formatDateInput,
  normalizePhoneInput,
  parseDateToISO,
  toLocalPhoneDisplay,
} from "../../src/components/account/account.schemas";

describe("account schemas", () => {
  it("valide un profil personnel conforme", () => {
    const result = accountPersonalProfileSchema.safeParse({
      firstName: "Remi",
      lastName: "Ntamack",
      gender: "M",
      phone: "650123456",
    });

    expect(result.success).toBe(true);
  });

  it("rejette un mot de passe trop simple", () => {
    const result = accountChangePasswordSchema.safeParse({
      currentPassword: "Current12",
      newPassword: "simple",
      confirmNewPassword: "simple",
    });

    expect(result.success).toBe(false);
  });

  it("exige trois questions distinctes et les champs parent", () => {
    const result = accountRecoverySchema.safeParse({
      birthDate: "05/04/2026",
      selectedQuestions: ["A", "A", "B"],
      answers: {
        A: "ok",
        B: "ok",
      },
      isParent: true,
      parentClassId: "",
      parentStudentId: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Les 3 questions doivent être différentes.",
        "La classe de votre enfant est obligatoire.",
        "Le nom de votre enfant est obligatoire.",
      ]),
    );
  });

  it("normalise téléphone et date comme attendu par le mobile", () => {
    expect(normalizePhoneInput("+237 650-12-34-56")).toBe("237650123");
    expect(toLocalPhoneDisplay("237650123456")).toBe("650123456");
    expect(formatDateInput("05042026")).toBe("05/04/2026");
    expect(parseDateToISO("05/04/2026")).toBe("2026-04-05");
  });
});
