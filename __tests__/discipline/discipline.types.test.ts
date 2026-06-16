import {
  buildLifeEventPayload,
  computeDisciplineSummary,
  createDisciplineFormSchema,
  DISCIPLINE_TYPE_CONFIG,
  getDisciplineTypeLabel,
  getDisciplineTypePluralLabel,
  STUDENT_LIFE_EVENT_TYPES,
  typeHasJustified,
} from "../../src/types/discipline.types";
import { translate } from "../../src/i18n/useTranslation";
import {
  makeEventsByTypes,
  makeLifeEvent,
} from "../../test-utils/discipline.fixtures";

const tFr = (key: string) => translate("fr", key);
const tEn = (key: string) => translate("en", key);

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

  describe("createDisciplineFormSchema", () => {
    it("accepte une saisie valide", () => {
      const schema = createDisciplineFormSchema(tFr);
      expect(
        schema.safeParse({
          type: "ABSENCE",
          occurredAt: "2026-04-09T08:30",
          reason: "Absence justifiee",
          durationMinutes: "45",
          justified: true,
          comment: "RAS",
        }).success,
      ).toBe(true);
    });

    it("rejette un motif vide avec un message localise (fr)", () => {
      const schema = createDisciplineFormSchema(tFr);
      const result = schema.safeParse({
        type: "ABSENCE",
        occurredAt: "2026-04-09T08:30",
        reason: "   ",
        durationMinutes: "",
        justified: false,
        comment: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        tFr("discipline.validation.reasonRequired"),
      );
    });

    it("rejette un motif vide avec un message localise (en)", () => {
      const schema = createDisciplineFormSchema(tEn);
      const result = schema.safeParse({
        type: "ABSENCE",
        occurredAt: "2026-04-09T08:30",
        reason: "   ",
        durationMinutes: "",
        justified: false,
        comment: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        tEn("discipline.validation.reasonRequired"),
      );
      expect(result.error?.issues[0]?.message).not.toBe(
        tFr("discipline.validation.reasonRequired"),
      );
    });

    it("rejette une date vide avec un message localise", () => {
      const schemaFr = createDisciplineFormSchema(tFr);
      const resultFr = schemaFr.safeParse({
        type: "ABSENCE",
        occurredAt: "",
        reason: "Absence",
        durationMinutes: "",
        justified: false,
        comment: "",
      });

      expect(resultFr.success).toBe(false);
      expect(resultFr.error?.issues[0]?.message).toBe(
        tFr("discipline.validation.dateRequired"),
      );

      const schemaEn = createDisciplineFormSchema(tEn);
      const resultEn = schemaEn.safeParse({
        type: "ABSENCE",
        occurredAt: "",
        reason: "Absence",
        durationMinutes: "",
        justified: false,
        comment: "",
      });

      expect(resultEn.success).toBe(false);
      expect(resultEn.error?.issues[0]?.message).toBe(
        tEn("discipline.validation.dateRequired"),
      );
    });

    it("rejette une date invalide avec un message localise", () => {
      const schema = createDisciplineFormSchema(tFr);
      const result = schema.safeParse({
        type: "RETARD",
        occurredAt: "not-a-date",
        reason: "Retard",
        durationMinutes: "",
        justified: true,
        comment: "",
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        tFr("discipline.validation.dateInvalid"),
      );
    });

    it("rejette une duree negative ou non numerique avec un message localise", () => {
      const schema = createDisciplineFormSchema(tFr);
      const negative = schema.safeParse({
        type: "SANCTION",
        occurredAt: "2026-04-09T08:30",
        reason: "Sanction",
        durationMinutes: "-2",
        justified: false,
        comment: "",
      });
      const alpha = schema.safeParse({
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
        tFr("discipline.validation.durationPositive"),
      );
    });
  });

  describe("buildLifeEventPayload", () => {
    it("transforme la saisie formulaire en payload API", () => {
      const schema = createDisciplineFormSchema(tFr);
      const payload = buildLifeEventPayload(
        {
          type: "ABSENCE",
          occurredAt: "2026-04-09T08:30",
          reason: "  Absence justifiee  ",
          durationMinutes: "45",
          justified: true,
          comment: "  Billet recu ",
        },
        schema,
      );

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
      const schema = createDisciplineFormSchema(tFr);
      const payload = buildLifeEventPayload(
        {
          type: "SANCTION",
          occurredAt: "2026-04-09T08:30",
          reason: "Comportement inapproprie",
          durationMinutes: "",
          justified: true,
          comment: "   ",
        },
        schema,
      );

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
      const schema = createDisciplineFormSchema(tFr);
      expect(() =>
        buildLifeEventPayload(
          {
            type: "ABSENCE",
            occurredAt: "bad",
            reason: "",
            durationMinutes: "abc",
            justified: false,
            comment: "",
          },
          schema,
        ),
      ).toThrow();
    });
  });

  describe("getDisciplineTypeLabel / getDisciplineTypePluralLabel", () => {
    it("retourne un libelle localise non vide pour chaque type, dans chaque langue", () => {
      for (const type of STUDENT_LIFE_EVENT_TYPES) {
        const labelFr = getDisciplineTypeLabel(tFr, type);
        const labelEn = getDisciplineTypeLabel(tEn, type);
        const pluralFr = getDisciplineTypePluralLabel(tFr, type);
        const pluralEn = getDisciplineTypePluralLabel(tEn, type);

        expect(labelFr.length).toBeGreaterThan(0);
        expect(labelEn.length).toBeGreaterThan(0);
        expect(pluralFr.length).toBeGreaterThan(0);
        expect(pluralEn.length).toBeGreaterThan(0);
      }

      // Le libelle des retards differe bien entre fr et en
      expect(getDisciplineTypeLabel(tFr, "RETARD")).not.toBe(
        getDisciplineTypeLabel(tEn, "RETARD"),
      );
    });

    it("expose une configuration visuelle (couleurs/icone) pour chaque type", () => {
      for (const type of STUDENT_LIFE_EVENT_TYPES) {
        const cfg = DISCIPLINE_TYPE_CONFIG[type];
        expect(cfg.bg).toBeTruthy();
        expect(cfg.text).toBeTruthy();
        expect(cfg.accent).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
      }
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
