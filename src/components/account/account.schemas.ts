import { z } from "zod";

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const accountPersonalProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire."),
  lastName: z.string().trim().min(1, "Le nom est obligatoire."),
  gender: z.enum(["M", "F", "OTHER"], {
    message: "Le genre est obligatoire.",
  }),
  phone: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Numéro invalide (9 chiffres attendus)."),
});

export const accountChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Le mot de passe actuel est obligatoire."),
    newPassword: z
      .string()
      .regex(
        PASSWORD_COMPLEXITY_REGEX,
        "Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.",
      ),
    confirmNewPassword: z.string().min(1, "Confirmez le nouveau mot de passe."),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: "La confirmation du nouveau mot de passe ne correspond pas.",
    path: ["confirmNewPassword"],
  });

export const accountChangePinSchema = z
  .object({
    currentPin: z
      .string()
      .regex(/^\d{6}$/, "Le PIN actuel doit contenir 6 chiffres."),
    newPin: z
      .string()
      .regex(/^\d{6}$/, "Le nouveau PIN doit contenir 6 chiffres."),
    confirmNewPin: z.string().min(1, "Confirmez le nouveau PIN."),
  })
  .refine((value) => value.newPin === value.confirmNewPin, {
    message: "La confirmation du nouveau PIN ne correspond pas.",
    path: ["confirmNewPin"],
  });

export const accountRecoverySchema = z
  .object({
    birthDate: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Format attendu : JJ/MM/AAAA."),
    selectedQuestions: z
      .array(z.string())
      .length(3, "Choisissez exactement 3 questions.")
      .refine((value) => new Set(value).size === 3, {
        message: "Les 3 questions doivent être différentes.",
      }),
    answers: z.record(z.string(), z.string().trim().min(2)),
    isParent: z.boolean(),
    parentClassId: z.string().optional(),
    parentStudentId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    for (const questionKey of value.selectedQuestions) {
      const answer = value.answers[questionKey];
      if (!answer || answer.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["answers", questionKey],
          message: "Chaque réponse doit contenir au moins 2 caractères.",
        });
      }
    }

    if (value.isParent && !value.parentClassId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parentClassId"],
        message: "La classe de votre enfant est obligatoire.",
      });
    }

    if (value.isParent && !value.parentStudentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parentStudentId"],
        message: "Le nom de votre enfant est obligatoire.",
      });
    }
  });

export function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 9);
}

export function toLocalPhoneDisplay(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("237") && digits.length >= 12) {
    return digits.slice(3, 12);
  }
  return digits.slice(0, 9);
}

export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseDateToISO(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return `${year}-${month}-${day}`;
}
