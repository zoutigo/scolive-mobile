import {
  buildEvaluationProgress,
  buildRadarData,
  buildRadarChart,
  buildYearSubjects,
  computeYearlySnapshot,
  formatDelta,
  formatPlainEvaluationScore,
  formatScore,
  getCurrentTerm,
  isEvaluationComplete,
  sequenceShortLabel,
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
  generalAverage: StudentNotesTermSnapshot["generalAverage"] = {
    student: 13,
    class: 12,
    min: 7,
    max: 18,
  },
): StudentNotesTermSnapshot {
  return {
    term,
    label: `Trimestre ${term.slice(-1)}`,
    councilLabel: "6e A",
    generatedAtLabel: "Publié",
    generalAverage,
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

// ─── isEvaluationComplete ────────────────────────────────────────────────────

describe("isEvaluationComplete", () => {
  it("retourne true quand toutes les notes sont saisies", () => {
    expect(isEvaluationComplete({ _count: { scores: 32 } }, 32)).toBe(true);
  });

  it("retourne true même si le compte serveur dépasse l'effectif attendu", () => {
    expect(isEvaluationComplete({ _count: { scores: 33 } }, 32)).toBe(true);
  });

  it("retourne false quand des notes manquent", () => {
    expect(isEvaluationComplete({ _count: { scores: 18 } }, 32)).toBe(false);
  });

  it("retourne false quand aucun élève n'est inscrit (division par zéro évitée)", () => {
    expect(isEvaluationComplete({ _count: { scores: 0 } }, 0)).toBe(false);
  });
});

// ─── sequenceShortLabel ───────────────────────────────────────────────────────

describe("sequenceShortLabel", () => {
  it("retourne un libellé compact pour chaque séquence", () => {
    expect(sequenceShortLabel("SEQ_1")).toBe("T1-Seq1");
    expect(sequenceShortLabel("SEQ_2")).toBe("T1-Seq2");
    expect(sequenceShortLabel("SEQ_3")).toBe("T2-Seq3");
    expect(sequenceShortLabel("SEQ_4")).toBe("T2-Seq4");
    expect(sequenceShortLabel("SEQ_5")).toBe("T3-Seq5");
    expect(sequenceShortLabel("SEQ_6")).toBe("T3-Seq6");
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
        id: "subj-physique",
        subjectLabel: "Physique",
        studentAverage: 16,
        classAverage: 13,
      }),
    ];
    const data = buildRadarData(subjects);
    expect(data[0]).toEqual({
      id: "subj-physique",
      label: "Physique",
      student: 16,
      classroom: 13,
    });
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

  it("garde des identifiants d'axe uniques même si deux matières partagent le même libellé affiché", () => {
    const subjects = [
      makeSubject({
        id: "subj-anglais-general",
        subjectLabel: "Anglais",
        studentAverage: 14,
        classAverage: 12,
      }),
      makeSubject({
        id: "subj-anglais-renforce",
        subjectLabel: "Anglais",
        studentAverage: 17,
        classAverage: 15,
      }),
    ];
    const chart = buildRadarChart(subjects);
    expect(chart.axes.map((axis) => axis.label)).toEqual([
      "Anglais",
      "Anglais",
    ]);
    const axisIds = chart.axes.map((axis) => axis.id);
    expect(new Set(axisIds).size).toBe(axisIds.length);
    expect(axisIds).toEqual(["subj-anglais-general", "subj-anglais-renforce"]);
  });

  describe("computeYearlySnapshot", () => {
    it("retourne null si aucun bulletin de trimestre n'est chargé", () => {
      expect(computeYearlySnapshot([], tFr)).toBeNull();
    });

    it("moyenne uniquement les trimestres disponibles (jamais compté à 0)", () => {
      // T1 absent, T2 = 10, T3 = 16 -> annuelle = 13, pas (0+10+16)/3.
      const snapshot = computeYearlySnapshot(
        [
          makeSnapshot(
            "TERM_2",
            [makeSubject({ id: "subj-1", studentAverage: 10 })],
            { student: 10, class: 9, min: 4, max: 15 },
          ),
          makeSnapshot(
            "TERM_3",
            [makeSubject({ id: "subj-1", studentAverage: 16 })],
            { student: 16, class: 13, min: 8, max: 19 },
          ),
        ],
        tFr,
      );

      expect(snapshot?.generalAverage.student).toBe(13);
      expect(snapshot?.term).toBe("YEARLY");
      expect(snapshot?.label).toBe(tFr("notes.terms.yearly"));
    });

    it("calcule la moyenne annuelle par matière à partir des trimestres où elle est notée", () => {
      const snapshot = computeYearlySnapshot([
        makeSnapshot("TERM_1", [
          makeSubject({ id: "subj-1", studentAverage: 12 }),
        ]),
        makeSnapshot("TERM_2", [
          makeSubject({ id: "subj-1", studentAverage: 14 }),
          makeSubject({ id: "subj-2", studentAverage: 8 }),
        ]),
        makeSnapshot("TERM_3", [
          makeSubject({ id: "subj-1", studentAverage: 16 }),
        ]),
      ]);

      const subj1 = snapshot?.subjects.find((s) => s.id === "subj-1");
      const subj2 = snapshot?.subjects.find((s) => s.id === "subj-2");

      expect(subj1?.studentAverage).toBe(14); // (12+14+16)/3
      expect(subj1?.termAverages).toEqual({
        TERM_1: 12,
        TERM_2: 14,
        TERM_3: 16,
      });
      expect(subj2?.studentAverage).toBe(8); // seule donnée : T2
      expect(subj2?.termAverages).toEqual({
        TERM_1: null,
        TERM_2: 8,
        TERM_3: null,
      });
    });

    it("ignore les matières sans aucune moyenne notée pour n'importe quel trimestre", () => {
      const snapshot = computeYearlySnapshot([
        makeSnapshot("TERM_1", [
          makeSubject({ id: "subj-1", studentAverage: null }),
        ]),
      ]);

      expect(snapshot?.subjects[0]?.studentAverage).toBeNull();
    });
  });
});
