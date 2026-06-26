import { translate, type TranslateFn } from "../i18n/useTranslation";

const tFr: TranslateFn = (key) => translate("fr", key);

import type {
  EvaluationRow,
  StudentEvaluation,
  StudentNotesTerm,
  StudentNotesSequence,
  StudentNotesTermSnapshot,
  StudentSubjectNotes,
} from "../types/notes.types";

export function formatScore(value: number | null) {
  if (value === null) {
    return "-";
  }
  return value % 1 === 0 ? `${value}` : value.toFixed(2).replace(".", ",");
}

export function formatDelta(
  studentValue: number | null,
  classValue: number | null,
  t: TranslateFn = tFr,
) {
  if (studentValue === null || classValue === null) {
    return null;
  }

  const delta = studentValue - classValue;
  if (Math.abs(delta) < 0.01) {
    return t("notes.delta.atClassLevel");
  }

  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${delta.toFixed(2).replace(".", ",")} ${t("notes.delta.vsClass")}`;
}

export function formatEvaluationLabel(evaluation: StudentEvaluation) {
  const weightLabel = evaluation.weight ? ` x${evaluation.weight}` : "";
  return `${formatScore(evaluation.score)}/${formatScore(evaluation.maxScore)}${weightLabel}`;
}

export function formatPlainEvaluationScore(
  evaluation: StudentEvaluation,
  t: TranslateFn = tFr,
) {
  if (evaluation.status === "ABSENT") {
    return { score: t("notes.scoreStatus.absent"), maxScore: null };
  }
  if (evaluation.status === "EXCUSED") {
    return { score: t("notes.scoreStatus.excused"), maxScore: null };
  }
  if (evaluation.status === "NOT_GRADED") {
    return { score: t("notes.scoreStatus.notGraded"), maxScore: null };
  }
  return {
    score: formatScore(evaluation.score),
    maxScore: formatScore(evaluation.maxScore),
  };
}

export function termLabel(term: StudentNotesTerm, t: TranslateFn = tFr) {
  switch (term) {
    case "TERM_1":
      return t("notes.terms.term1");
    case "TERM_2":
      return t("notes.terms.term2");
    case "TERM_3":
      return t("notes.terms.term3");
  }
}

const SEQUENCE_KEY_MAP: Record<StudentNotesSequence, string> = {
  SEQ_1: "notes.sequences.seq1",
  SEQ_2: "notes.sequences.seq2",
  SEQ_3: "notes.sequences.seq3",
  SEQ_4: "notes.sequences.seq4",
  SEQ_5: "notes.sequences.seq5",
  SEQ_6: "notes.sequences.seq6",
};

export function sequenceLabel(
  sequence: StudentNotesSequence,
  t: TranslateFn = tFr,
) {
  return t(SEQUENCE_KEY_MAP[sequence]);
}

export function sequenceToTerm(
  sequence: StudentNotesSequence,
): StudentNotesTerm {
  if (sequence === "SEQ_1" || sequence === "SEQ_2") return "TERM_1";
  if (sequence === "SEQ_3" || sequence === "SEQ_4") return "TERM_2";
  return "TERM_3";
}

export function isEvenSequence(sequence: StudentNotesSequence): boolean {
  return sequence === "SEQ_2" || sequence === "SEQ_4" || sequence === "SEQ_6";
}

export const ALL_SEQUENCES: StudentNotesSequence[] = [
  "SEQ_1",
  "SEQ_2",
  "SEQ_3",
  "SEQ_4",
  "SEQ_5",
  "SEQ_6",
];

export function getCurrentTerm(date = new Date()): StudentNotesTerm {
  const month = date.getMonth() + 1;
  if (month >= 9 && month <= 12) {
    return "TERM_1";
  }
  if (month >= 1 && month <= 3) {
    return "TERM_2";
  }
  return "TERM_3";
}

export function buildRadarData(snapshot: StudentNotesTermSnapshot) {
  const eligibleSubjects = snapshot.subjects.filter(
    (subject) =>
      subject.studentAverage !== null && subject.classAverage !== null,
  );

  return eligibleSubjects.map((subject) => ({
    label: subject.subjectLabel,
    student: subject.studentAverage ?? 0,
    classroom: subject.classAverage ?? 0,
  }));
}

export function buildRadarChart(snapshot: StudentNotesTermSnapshot) {
  const data = buildRadarData(snapshot);
  const center = 110;
  const radius = 78;
  const angleStep = (Math.PI * 2) / Math.max(data.length, 1);

  const axes = data.map((item, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const endX = center + Math.cos(angle) * radius;
    const endY = center + Math.sin(angle) * radius;
    const labelX = center + Math.cos(angle) * (radius + 22);
    const labelY = center + Math.sin(angle) * (radius + 22);
    const axisWidth = Math.sqrt(
      (endX - center) * (endX - center) + (endY - center) * (endY - center),
    );
    return {
      label: item.label,
      angle,
      endX,
      endY,
      labelX,
      labelY,
      left: (center + endX) / 2 - axisWidth / 2,
      top: (center + endY) / 2,
      width: axisWidth,
    };
  });

  const buildSeries = (kind: "student" | "classroom") =>
    data.map((item, index) => {
      const angle = -Math.PI / 2 + index * angleStep;
      const value = kind === "student" ? item.student : item.classroom;
      const normalizedRadius = (value / 20) * radius;
      const x = center + Math.cos(angle) * normalizedRadius;
      const y = center + Math.sin(angle) * normalizedRadius;
      return {
        x,
        y,
        angle,
      };
    });

  const buildSegments = (points: Array<{ x: number; y: number }>) =>
    points.map((point, index) => {
      const next = points[(index + 1) % points.length];
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const width = Math.sqrt(dx * dx + dy * dy);
      return {
        left: (point.x + next.x) / 2 - width / 2,
        top: (point.y + next.y) / 2,
        width,
        angle: `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`,
      };
    });

  const studentPoints = buildSeries("student");
  const classPoints = buildSeries("classroom");

  return {
    center,
    radius,
    rings: [0.28, 0.48, 0.68, 0.88, 1],
    axes,
    data,
    studentPoints,
    classPoints,
    studentSegments: buildSegments(studentPoints),
    classSegments: buildSegments(classPoints),
  };
}

export function getBestSubject(subjects: StudentSubjectNotes[]) {
  return [...subjects]
    .filter((subject) => subject.studentAverage !== null)
    .sort((a, b) => (b.studentAverage ?? 0) - (a.studentAverage ?? 0))[0];
}

export function getWatchSubject(subjects: StudentSubjectNotes[]) {
  return [...subjects]
    .filter((subject) => subject.studentAverage !== null)
    .sort((a, b) => (a.studentAverage ?? 99) - (b.studentAverage ?? 99))[0];
}

export function formatEvaluationDate(
  value: string | null | undefined,
  t: TranslateFn = tFr,
) {
  if (!value) {
    return t("notes.dateNotSet");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("fr-FR");
}

export function sortEvaluations(items: EvaluationRow[]) {
  return [...items].sort((a, b) => {
    const aDate = new Date(a.scheduledAt ?? a.createdAt).getTime();
    const bDate = new Date(b.scheduledAt ?? b.createdAt).getTime();
    return bDate - aDate;
  });
}

export function buildEvaluationProgress(
  evaluation: Pick<EvaluationRow, "_count">,
  studentCount: number,
) {
  return `${evaluation._count.scores}/${studentCount}`;
}
