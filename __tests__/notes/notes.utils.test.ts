import {
  buildEvaluationProgress,
  formatDelta,
  formatPlainEvaluationScore,
  formatScore,
  getCurrentTerm,
  termLabel,
} from "../../src/utils/notes";

describe("notes utils", () => {
  it("formate une note entière sans décimales", () => {
    expect(formatScore(14)).toBe("14");
  });

  it("formate une note décimale avec virgule", () => {
    expect(formatScore(14.5)).toBe("14,50");
  });

  it("retourne '-' pour une note nulle", () => {
    expect(formatScore(null)).toBe("-");
  });

  it("calcule l'écart positif avec la classe", () => {
    expect(formatDelta(15, 12.5)).toBe("+2,50 pts vs classe");
  });

  it("retourne le libellé neutre quand l'écart est insignifiant", () => {
    expect(formatDelta(12, 12.005)).toBe("Au niveau de la classe");
  });

  it("traduit correctement les statuts spéciaux", () => {
    expect(
      formatPlainEvaluationScore({
        id: "e1",
        label: "Interro",
        score: null,
        maxScore: 20,
        recordedAt: "12/04/2026",
        status: "ABSENT",
      }),
    ).toEqual({ score: "Abs", maxScore: null });
  });

  it("retourne le libellé de trimestre attendu", () => {
    expect(termLabel("TERM_2")).toBe("Trimestre 2");
  });

  it("calcule la progression des scores", () => {
    expect(buildEvaluationProgress({ _count: { scores: 18 } }, 32)).toBe(
      "18/32",
    );
  });
});

// ─── Cohérence trimestre automatique ─────────────────────────────────────────

describe("getCurrentTerm — détection automatique du trimestre", () => {
  it("septembre → TERM_1", () => {
    expect(getCurrentTerm(new Date("2026-09-01"))).toBe("TERM_1");
  });
  it("octobre → TERM_1", () => {
    expect(getCurrentTerm(new Date("2026-10-15"))).toBe("TERM_1");
  });
  it("décembre → TERM_1", () => {
    expect(getCurrentTerm(new Date("2026-12-31"))).toBe("TERM_1");
  });
  it("janvier → TERM_2", () => {
    expect(getCurrentTerm(new Date("2026-01-15"))).toBe("TERM_2");
  });
  it("mars → TERM_2", () => {
    expect(getCurrentTerm(new Date("2026-03-31"))).toBe("TERM_2");
  });
  it("avril → TERM_3", () => {
    expect(getCurrentTerm(new Date("2026-04-01"))).toBe("TERM_3");
  });
  it("août → TERM_3", () => {
    expect(getCurrentTerm(new Date("2026-08-31"))).toBe("TERM_3");
  });
  it("frontière sept/août : le 1er sept est TERM_1, le 31 août est TERM_3", () => {
    expect(getCurrentTerm(new Date("2026-09-01"))).toBe("TERM_1");
    expect(getCurrentTerm(new Date("2026-08-31"))).toBe("TERM_3");
  });
});
