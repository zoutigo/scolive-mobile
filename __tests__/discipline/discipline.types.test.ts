import {
  buildLifeEventPayload,
  computeDisciplineSummary,
  disciplineFormSchema,
  typeHasJustified,
} from "../../src/types/discipline.types";
import {
  makeEventsByTypes,
  makeLifeEvent,
} from "../../test-utils/discipline.fixtures";

describe("discipline.types", () => {
  describe("computeDisciplineSummary", () => {
    it("calcule les compteurs et conserve le premier evenement de chaque type", () => {
      const events = [
        makeLifeEvent({ id: "a1", type: "ABSENCE", justified: false }),
        makeLifeEvent({ id: "r1", type: "RETARD", justified: true }),
        makeLifeEvent({ id: "s1", type: "SANCTION", justified: null }),
        makeLifeEvent({ id: "p1", type: "PUNITION", justified: null }),
        makeLifeEvent({ id: "a2", type: "ABSENCE", justified: true }),
      ];

      expect(computeDisciplineSummary(events)).toMatchObject({
        absences: 2,
        retards: 1,
        sanctions: 1,
        punitions: 1,
        lastAbsence: { id: "a1" },
        lastRetard: { id: "r1" },
        lastSanction: { id: "s1" },
        lastPunition: { id: "p1" },
        unjustifiedAbsences: 1,
      });
    });

    it("retourne une synthese vide sans evenement", () => {
      expect(computeDisciplineSummary([])).toMatchObject({
        absences: 0,
        retards: 0,
        sanctions: 0,
        punitions: 0,
        lastAbsence: null,
        lastRetard: null,
        lastSanction: null,
        lastPunition: null,
        unjustifiedAbsences: 0,
      });
    });
  });

  describe("typeHasJustified", () => {
    it("active le champ justifie uniquement pour absences et retards", () => {
      expect(typeHasJustified("ABSENCE")).toBe(true);
      expect(typeHasJustified("RETARD")).toBe(true);
      expect(typeHasJustified("SANCTION")).toBe(false);
      expect(typeHasJustified("PUNITION")).toBe(false);
    });
  });

  describe("disciplineFormSchema", () => {
    it("accepte une saisie valide", () => {
      expect(
        disciplineFormSchema.safeParse({
          type: "ABSENCE",
          occurredAt: "2026-04-09T08:30",
          reason: "Absence justifiee",
          durationMinutes: "45",
          justified: true,
          comment: "RAS",
        }).success,
      ).toBe(true);
    });

    it("rejette un motif vide", () => {
      const result = disciplineFormSchema.safeParse({
        type: "ABSENCE",
        occurredAt: "2026-04-09T08:30",
        reason: "   ",
        durationMinutes: "",
        justified: false,
        comment: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Le motif est obligatoire.",
      );
    });

    it("rejette une date vide", () => {
      const result = disciplineFormSchema.safeParse({
        type: "ABSENCE",
        occurredAt: "",
        reason: "Absence",
        durationMinutes: "",
        justified: false,
        comment: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("La date est obligatoire.");
    });

    it("rejette une date invalide", () => {
      const result = disciplineFormSchema.safeParse({
        type: "RETARD",
        occurredAt: "not-a-date",
        reason: "Retard",
        durationMinutes: "",
        justified: true,
        comment: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("La date est invalide.");
    });

    it("rejette une duree negative ou non numerique", () => {
      const negative = disciplineFormSchema.safeParse({
        type: "SANCTION",
        occurredAt: "2026-04-09T08:30",
        reason: "Sanction",
        durationMinutes: "-2",
        justified: false,
        comment: "",
      });
      const alpha = disciplineFormSchema.safeParse({
        type: "SANCTION",
        occurredAt: "2026-04-09T08:30",
        reason: "Sanction",
        durationMinutes: "abc",
        justified: false,
        comment: "",
      });

      expect(negative.success).toBe(false);
      expect(alpha.success).toBe(false);
      expect(negative.error?.issues[0]?.message).toBe(
        "La durée doit être un entier positif.",
      );
    });
  });

  describe("buildLifeEventPayload", () => {
    it("transforme la saisie formulaire en payload API", () => {
      const payload = buildLifeEventPayload({
        type: "ABSENCE",
        occurredAt: "2026-04-09T08:30",
        reason: "  Absence justifiee  ",
        durationMinutes: "45",
        justified: true,
        comment: "  Billet recu ",
      });

      expect(payload).toEqual({
        type: "ABSENCE",
        occurredAt: new Date("2026-04-09T08:30").toISOString(),
        reason: "Absence justifiee",
        durationMinutes: 45,
        justified: true,
        comment: "Billet recu",
      });
    });

    it("omet les champs optionnels non applicables", () => {
      const payload = buildLifeEventPayload({
        type: "SANCTION",
        occurredAt: "2026-04-09T08:30",
        reason: "Comportement inapproprie",
        durationMinutes: "",
        justified: true,
        comment: "   ",
      });

      expect(payload).toEqual({
        type: "SANCTION",
        occurredAt: new Date("2026-04-09T08:30").toISOString(),
        reason: "Comportement inapproprie",
        durationMinutes: undefined,
        justified: undefined,
        comment: undefined,
      });
    });

    it("leve une erreur zod sur une saisie invalide", () => {
      expect(() =>
        buildLifeEventPayload({
          type: "ABSENCE",
          occurredAt: "bad",
          reason: "",
          durationMinutes: "abc",
          justified: false,
          comment: "",
        }),
      ).toThrow();
    });
  });

  it("permet de fabriquer rapidement un jeu d'evenements representatif", () => {
    const events = makeEventsByTypes([
      "ABSENCE",
      "RETARD",
      "SANCTION",
      "PUNITION",
    ]);

    expect(events.map((event) => event.type)).toEqual([
      "ABSENCE",
      "RETARD",
      "SANCTION",
      "PUNITION",
    ]);
  });
});
