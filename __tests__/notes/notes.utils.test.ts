import {
  buildEvaluationProgress,
  formatDelta,
  formatPlainEvaluationScore,
  formatScore,
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
