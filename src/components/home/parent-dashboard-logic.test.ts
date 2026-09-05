import { translate } from "../../i18n/useTranslation";
import type { StudentLifeEvent } from "../../types/discipline.types";
import type { ParentDashboardSummaryResponse } from "../../api/auth.api";
import type { ParentChild } from "../../types/family.types";
import {
  buildAccountSummary,
  buildDisciplineSummary,
  buildNotesSummary,
} from "./parent-dashboard-logic";

const tFr = (key: string) => translate("fr", key);
const tEn = (key: string) => translate("en", key);

const child: ParentChild = {
  id: "student-1",
  firstName: "Remi",
  lastName: "Ntamack",
};

function lifeEvent(overrides: Partial<StudentLifeEvent>): StudentLifeEvent {
  return {
    id: "evt",
    schoolId: "school-1",
    studentId: "student-1",
    classId: null,
    schoolYearId: null,
    authorUserId: "author-1",
    type: "ABSENCE",
    occurredAt: "2026-03-01T08:00:00.000Z",
    durationMinutes: null,
    justified: null,
    reason: "Absence",
    ...overrides,
  } as StudentLifeEvent;
}

describe("parent dashboard card logic", () => {
  it("builds a discipline summary with alert state for unjustified absences", () => {
    const lifeEvents = [
      lifeEvent({ id: "evt-1", type: "ABSENCE", justified: false }),
      lifeEvent({
        id: "evt-2",
        type: "RETARD",
        justified: true,
        occurredAt: "2026-03-02T08:10:00.000Z",
      }),
    ];

    const summary = buildDisciplineSummary(child, lifeEvents, tFr);

    expect(summary.childName).toBe("Ntamack Remi");
    expect(summary.absences).toBe(1);
    expect(summary.retards).toBe(1);
    expect(summary.statusTone).toBe("alert");
    expect(summary.statusLabel).toBe("Priorité parent");
    expect(summary.detail).toBe("1 absence(s) à justifier.");
  });

  it("builds a discipline summary translated to English", () => {
    const lifeEvents = [
      lifeEvent({ id: "evt-1", type: "ABSENCE", justified: false }),
    ];

    const summary = buildDisciplineSummary(child, lifeEvents, tEn);

    expect(summary.statusLabel).toBe("Parent priority");
    expect(summary.detail).toBe("1 unjustified absence(s) to clear.");
  });

  it("builds a calm discipline summary when there is nothing to report", () => {
    const summary = buildDisciplineSummary(child, [], tFr);

    expect(summary.statusTone).toBe("calm");
    expect(summary.statusLabel).toBe("Situation sereine");
    expect(summary.detail).toBe(
      "Aucun signal disciplinaire notable sur la période.",
    );
  });

  it("builds a compact notes summary from the latest numeric evaluations only", () => {
    const snapshots = [
      {
        term: "TERM_1" as const,
        label: "1er trimestre",
        councilLabel: "",
        generatedAtLabel: "",
        generalAverage: { student: 14.2, class: 12, min: 5, max: 18 },
        sequences: [],
        subjects: [
          {
            id: "subj-1",
            subjectLabel: "Anglais",
            teachers: [],
            coefficient: 2,
            studentAverage: 14,
            classAverage: 12,
            classMin: 5,
            classMax: 18,
            evaluations: [
              {
                id: "valid-1",
                label: "Devoir 1",
                score: 14,
                maxScore: 20,
                recordedAt: "2026-03-10T08:00:00.000Z",
                countsForAverage: true,
                isFinalExam: false,
              },
              {
                id: "invalid-1",
                label: "Devoir 2",
                score: undefined as unknown as number,
                maxScore: 20,
                recordedAt: "2026-03-11T08:00:00.000Z",
                countsForAverage: true,
                isFinalExam: false,
              },
            ],
          },
          {
            id: "subj-2",
            subjectLabel: "Chimie",
            teachers: [],
            coefficient: 2,
            studentAverage: 11.5,
            classAverage: 10,
            classMin: 4,
            classMax: 17,
            evaluations: [
              {
                id: "valid-2",
                label: "Devoir 3",
                score: 11.5,
                maxScore: 20,
                recordedAt: "2026-03-12T08:00:00.000Z",
                countsForAverage: true,
                isFinalExam: false,
              },
            ],
          },
        ],
      },
    ];

    const summary = buildNotesSummary(child, snapshots, tFr);

    expect(summary.averageLabel).toMatch(/\/20$/);
    expect(summary.latestEvaluations).toHaveLength(2);
    expect(summary.latestEvaluations[0]?.subjectLabel).toBeTruthy();
    expect(
      summary.latestEvaluations.every(
        (entry) => typeof entry.score === "number",
      ),
    ).toBe(true);
  });

  it("falls back to a pending state when there is no snapshot for the child", () => {
    const summary = buildNotesSummary(child, [], tFr);

    expect(summary.averageLabel).toBe("En attente");
    expect(summary.trendLabel).toBe("Aucune évaluation publiée");
    expect(summary.latestEvaluations).toHaveLength(0);
  });

  it("builds an account summary from backend counts and document metadata", () => {
    const payload: ParentDashboardSummaryResponse = {
      unreadMessages: 3,
      payments: {
        connected: false,
        pendingCount: null,
        overdueCount: null,
        detail: "Le module comptable n'est pas encore connecte.",
      },
      documents: {
        recentCount: 2,
        totalPublishedCount: 5,
        detail: "2 bulletins publies sur les 90 derniers jours.",
        latest: [
          {
            id: "report-1",
            title: "2eme trimestre - Remi Ntamack",
            publishedAt: "2026-03-12T09:00:00.000Z",
          },
        ],
      },
    };

    const summary = buildAccountSummary(payload, tFr);

    expect(summary.headline).toBe("2 points à traiter");
    expect(summary.items.find((item) => item.id === "payments")?.value).toBe(
      "--",
    );
    expect(summary.items.find((item) => item.id === "messages")?.value).toBe(
      "3",
    );
    expect(
      summary.items.find((item) => item.id === "documents")?.detail,
    ).toContain("2eme trimestre - Remi Ntamack");
  });

  it("marks the account summary as alert when real payment counts report overdue items", () => {
    const payload: ParentDashboardSummaryResponse = {
      unreadMessages: 1,
      payments: {
        connected: true,
        pendingCount: 3,
        overdueCount: 1,
        detail: "",
      },
      documents: {
        recentCount: 0,
        totalPublishedCount: 4,
        detail: "Aucun bulletin publie recemment.",
        latest: [],
      },
    };

    const summary = buildAccountSummary(payload, tFr);
    const paymentsItem = summary.items.find((item) => item.id === "payments");

    expect(summary.headline).toBe("2 points à traiter");
    expect(summary.detail).toContain("règlement");
    expect(paymentsItem?.value).toBe("3");
    expect(paymentsItem?.tone).toBe("alert");
    expect(paymentsItem?.detail).toBe("1 en retard, 2 en attente");
  });
});
