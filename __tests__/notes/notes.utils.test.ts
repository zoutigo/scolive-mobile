import {
  buildEvaluationProgress,
  buildRadarData,
  buildRadarChart,
  buildYearSubjects,
  formatDelta,
  formatPlainEvaluationScore,
  formatScore,
  getCurrentTerm,
  termLabel,
} from "../../src/utils/notes";
import { translate } from "../../src/i18n/useTranslation";
import type {
  StudentNotesTermSnapshot,
  StudentSubjectNotes,
} from "../../src/types/notes.types";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeSubject(
  overrides: Partial<StudentSubjectNotes> = {},
): StudentSubjectNotes {
  return {
    id: "subj-1",
    subjectLabel: "Mathématiques",
    teachers: ["M. Dupont"],
    coefficient: 3,
    studentAverage: 14,
    classAverage: 12,
    classMin: 5,
    classMax: 19,
    appreciation: null,
    evaluations: [],
    ...overrides,
  };
}

function makeSnapshot(
  term: StudentNotesTermSnapshot["term"],
  subjects: StudentSubjectNotes[],
): StudentNotesTermSnapshot {
  return {
    term,
    label: `Trimestre ${term.slice(-1)}`,
    councilLabel: "6e A",
    generatedAtLabel: "Publié",
    generalAverage: { student: 13, class: 12, min: 7, max: 18 },
    sequences: [],
    subjects,
  };
}

const tFr = (key: string) => translate("fr", key);
const tEn = (key: string) => translate("en", key);

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
    expect(formatDelta(15, 12.5, tFr)).toBe("+2,50 pts vs classe");
    expect(formatDelta(15, 12.5, tEn)).toBe("+2,50 pts vs class");
  });

  it("retourne le libellé neutre quand l'écart est insignifiant", () => {
    expect(formatDelta(12, 12.005, tFr)).toBe("Au niveau de la classe");
    expect(formatDelta(12, 12.005, tEn)).toBe("At class level");
  });

  it("traduit correctement les statuts spéciaux", () => {
    expect(
      formatPlainEvaluationScore(
        {
          id: "e1",
          label: "Interro",
          score: null,
          maxScore: 20,
          recordedAt: "12/04/2026",
          status: "ABSENT",
        },
        tFr,
      ),
    ).toEqual({ score: "Abs", maxScore: null });
    expect(
      formatPlainEvaluationScore(
        {
          id: "e1",
          label: "Interro",
          score: null,
          maxScore: 20,
          recordedAt: "12/04/2026",
          status: "ABSENT",
        },
        tEn,
      ),
    ).toEqual({ score: "Abs", maxScore: null });
  });

  it("retourne le libellé de trimestre attendu", () => {
    expect(termLabel("TERM_2", tFr)).toBe("Trimestre 2");
    expect(termLabel("TERM_2", tEn)).toBe("Term 2");
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

// ─── buildYearSubjects ────────────────────────────────────────────────────────

describe("buildYearSubjects — agrégation annuelle", () => {
  it("retourne un tableau vide si aucun snapshot", () => {
    expect(buildYearSubjects([])).toEqual([]);
  });

  it("retourne les matières d'un seul snapshot sans modification", () => {
    const subj = makeSubject({ studentAverage: 14, classAverage: 12 });
    const result = buildYearSubjects([makeSnapshot("TERM_1", [subj])]);
    expect(result).toHaveLength(1);
    expect(result[0].studentAverage).toBeCloseTo(14);
    expect(result[0].classAverage).toBeCloseTo(12);
  });

  it("moyenne les scores élève et classe sur les trimestres disponibles", () => {
    const subj1 = makeSubject({
      id: "subj-1",
      studentAverage: 14,
      classAverage: 12,
    });
    const subj2 = makeSubject({
      id: "subj-1",
      studentAverage: 16,
      classAverage: 13,
    });
    const result = buildYearSubjects([
      makeSnapshot("TERM_1", [subj1]),
      makeSnapshot("TERM_2", [subj2]),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].studentAverage).toBeCloseTo(15);
    expect(result[0].classAverage).toBeCloseTo(12.5);
  });

  it("garde le min global et le max global parmi tous les trimestres", () => {
    const subj1 = makeSubject({ id: "subj-1", classMin: 4, classMax: 17 });
    const subj2 = makeSubject({ id: "subj-1", classMin: 6, classMax: 20 });
    const result = buildYearSubjects([
      makeSnapshot("TERM_1", [subj1]),
      makeSnapshot("TERM_2", [subj2]),
    ]);
    expect(result[0].classMin).toBe(4);
    expect(result[0].classMax).toBe(20);
  });

  it("ignore les studentAverage null dans la moyenne", () => {
    const subj1 = makeSubject({ id: "subj-1", studentAverage: null });
    const subj2 = makeSubject({ id: "subj-1", studentAverage: 16 });
    const result = buildYearSubjects([
      makeSnapshot("TERM_1", [subj1]),
      makeSnapshot("TERM_2", [subj2]),
    ]);
    expect(result[0].studentAverage).toBeCloseTo(16);
  });

  it("retourne null si aucun trimestre n'a de moyenne élève", () => {
    const subj = makeSubject({ id: "subj-1", studentAverage: null });
    const result = buildYearSubjects([
      makeSnapshot("TERM_1", [subj]),
      makeSnapshot("TERM_2", [{ ...subj, studentAverage: null }]),
    ]);
    expect(result[0].studentAverage).toBeNull();
  });

  it("agrège plusieurs matières distinctes sans les fusionner", () => {
    const maths = makeSubject({
      id: "maths",
      subjectLabel: "Maths",
      studentAverage: 14,
    });
    const svt = makeSubject({
      id: "svt",
      subjectLabel: "SVT",
      studentAverage: 12,
    });
    const result = buildYearSubjects([makeSnapshot("TERM_1", [maths, svt])]);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id).sort()).toEqual(["maths", "svt"]);
  });

  it("une matière absente dans un trimestre ne crée pas de doublon", () => {
    const maths = makeSubject({
      id: "maths",
      subjectLabel: "Maths",
      studentAverage: 14,
    });
    const svt = makeSubject({
      id: "svt",
      subjectLabel: "SVT",
      studentAverage: 12,
    });
    const result = buildYearSubjects([
      makeSnapshot("TERM_1", [maths, svt]),
      makeSnapshot("TERM_2", [maths]),
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((s) => s.id === "maths")?.studentAverage).toBeCloseTo(
      14,
    );
    expect(result.find((s) => s.id === "svt")?.studentAverage).toBeCloseTo(12);
  });
});

// ─── buildRadarData ───────────────────────────────────────────────────────────

describe("buildRadarData — données pour le radar", () => {
  it("filtre les matières sans moyenne", () => {
    const subjects = [
      makeSubject({ id: "s1", studentAverage: 14, classAverage: 12 }),
      makeSubject({ id: "s2", studentAverage: null, classAverage: 12 }),
      makeSubject({ id: "s3", studentAverage: 14, classAverage: null }),
    ];
    const data = buildRadarData(subjects);
    expect(data).toHaveLength(1);
    expect(data[0].student).toBe(14);
  });

  it("mappe correctement student/classroom", () => {
    const subjects = [
      makeSubject({
        subjectLabel: "Physique",
        studentAverage: 16,
        classAverage: 13,
      }),
    ];
    const data = buildRadarData(subjects);
    expect(data[0]).toEqual({ label: "Physique", student: 16, classroom: 13 });
  });
});

// ─── buildRadarChart ──────────────────────────────────────────────────────────

describe("buildRadarChart — géométrie du radar", () => {
  it("retourne des données vides pour un tableau de matières vide", () => {
    const chart = buildRadarChart([]);
    expect(chart.data).toHaveLength(0);
    expect(chart.axes).toHaveLength(0);
    expect(chart.studentPoints).toHaveLength(0);
  });

  it("produit autant d'axes que de matières éligibles", () => {
    const subjects = [
      makeSubject({ id: "s1", studentAverage: 14, classAverage: 12 }),
      makeSubject({
        id: "s2",
        subjectLabel: "Physique",
        studentAverage: 10,
        classAverage: 11,
      }),
    ];
    const chart = buildRadarChart(subjects);
    expect(chart.axes).toHaveLength(2);
    expect(chart.studentPoints).toHaveLength(2);
    expect(chart.classPoints).toHaveLength(2);
  });

  it("normalise le centre à 110 et le rayon à 78", () => {
    const subjects = [makeSubject({ studentAverage: 14, classAverage: 12 })];
    const chart = buildRadarChart(subjects);
    expect(chart.center).toBe(110);
    expect(chart.radius).toBe(78);
  });
});
