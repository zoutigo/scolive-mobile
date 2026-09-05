import type { TranslateFn } from "../../i18n/useTranslation";
import type { StudentLifeEvent } from "../../types/discipline.types";
import type { StudentNotesTermSnapshot } from "../../types/notes.types";
import type { ParentDashboardSummaryResponse } from "../../api/auth.api";
import type { ParentChild } from "../../types/family.types";

export type ChildDisciplineSummary = {
  childId: string;
  childName: string;
  absences: number;
  unjustifiedAbsences: number;
  retards: number;
  incidents: number;
  statusLabel: string;
  statusTone: "calm" | "watch" | "alert";
  detail: string;
};

export type LatestEvaluation = {
  id: string;
  subjectLabel: string;
  score: number;
  maxScore: number;
  recordedAtLabel: string;
};

export type ChildNotesSummary = {
  childId: string;
  childName: string;
  averageLabel: string;
  termLabel: string;
  trendLabel: string;
  latestEvaluations: LatestEvaluation[];
};

export type ParentAccountItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "watch" | "alert";
};

export type ParentAccountSummary = {
  headline: string;
  detail: string;
  items: ParentAccountItem[];
};

function formatChildName(child: ParentChild) {
  return `${child.lastName} ${child.firstName}`.trim();
}

function parseRecordedAt(value: string) {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const slashMatch = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(value);
  if (!slashMatch) {
    return null;
  }

  const day = Number(slashMatch[1]);
  const month = Number(slashMatch[2]) - 1;
  const year = slashMatch[3]
    ? Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3])
    : new Date().getFullYear();
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(value: string) {
  const normalized = parseRecordedAt(value);
  if (!normalized) {
    return value;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(normalized);
}

function formatAverage(value: number | null, t: TranslateFn) {
  if (value === null) {
    return t("home.parent.dashboard.notes.averagePending");
  }
  return `${value.toFixed(1).replace(".", ",")}/20`;
}

export function getCurrentTerm(
  date = new Date(),
): "TERM_1" | "TERM_2" | "TERM_3" {
  const month = date.getMonth() + 1;
  if (month >= 9 && month <= 12) {
    return "TERM_1";
  }
  if (month >= 1 && month <= 3) {
    return "TERM_2";
  }
  return "TERM_3";
}

export function buildDisciplineSummary(
  child: ParentChild,
  lifeEvents: StudentLifeEvent[],
  t: TranslateFn,
): ChildDisciplineSummary {
  const absences = lifeEvents.filter((entry) => entry.type === "ABSENCE");
  const retards = lifeEvents.filter((entry) => entry.type === "RETARD");
  const incidents = lifeEvents.filter(
    (entry) => entry.type === "SANCTION" || entry.type === "PUNITION",
  );
  const unjustifiedAbsences = absences.filter(
    (entry) => entry.justified === false,
  ).length;

  let statusLabel = t("home.parent.dashboard.status.calm");
  let statusTone: ChildDisciplineSummary["statusTone"] = "calm";
  let detail = t("home.parent.dashboard.detail.none");

  if (unjustifiedAbsences > 0 || incidents.length >= 2) {
    statusLabel = t("home.parent.dashboard.status.alert");
    statusTone = "alert";
    detail =
      unjustifiedAbsences > 0
        ? t("home.parent.dashboard.detail.unjustifiedAbsences").replace(
            "{count}",
            String(unjustifiedAbsences),
          )
        : t("home.parent.dashboard.detail.incidentsRecorded").replace(
            "{count}",
            String(incidents.length),
          );
  } else if (
    absences.length > 0 ||
    retards.length > 1 ||
    incidents.length > 0
  ) {
    statusLabel = t("home.parent.dashboard.status.watch");
    statusTone = "watch";
    detail =
      absences.length > 0
        ? t("home.parent.dashboard.detail.absencesRecorded").replace(
            "{count}",
            String(absences.length),
          )
        : t("home.parent.dashboard.detail.retardsThisTerm").replace(
            "{count}",
            String(retards.length),
          );
  }

  return {
    childId: child.id,
    childName: formatChildName(child),
    absences: absences.length,
    unjustifiedAbsences,
    retards: retards.length,
    incidents: incidents.length,
    statusLabel,
    statusTone,
    detail,
  };
}

export function buildNotesSummary(
  child: ParentChild,
  snapshots: StudentNotesTermSnapshot[],
  t: TranslateFn,
): ChildNotesSummary {
  const currentTerm = getCurrentTerm();
  const snapshot =
    snapshots.find((entry) => entry.term === currentTerm) ??
    snapshots[0] ??
    null;

  if (!snapshot) {
    return {
      childId: child.id,
      childName: formatChildName(child),
      averageLabel: t("home.parent.dashboard.notes.averagePending"),
      termLabel: t("home.parent.dashboard.notes.termCurrent"),
      trendLabel: t("home.parent.dashboard.notes.nonePublished"),
      latestEvaluations: [],
    };
  }

  const latestEvaluations = snapshot.subjects
    .flatMap((subject) =>
      subject.evaluations.map((evaluation) => ({
        subjectLabel: subject.subjectLabel,
        evaluation,
      })),
    )
    .sort((left, right) => {
      const leftDate =
        parseRecordedAt(left.evaluation.recordedAt)?.getTime() ?? 0;
      const rightDate =
        parseRecordedAt(right.evaluation.recordedAt)?.getTime() ?? 0;
      return rightDate - leftDate;
    })
    .slice(0, 3)
    .map(({ subjectLabel, evaluation }) => {
      const score = evaluation.score;
      if (typeof score !== "number" || !Number.isFinite(score)) {
        return null;
      }
      return {
        id: evaluation.id,
        subjectLabel,
        score,
        maxScore: evaluation.maxScore,
        recordedAtLabel: formatDateLabel(evaluation.recordedAt),
      };
    })
    .filter(
      (evaluation): evaluation is LatestEvaluation => evaluation !== null,
    );

  const average = snapshot.generalAverage.student;
  let trendLabel = t("home.parent.dashboard.notes.trendConfirm");
  if (average !== null && average >= 14) {
    trendLabel = t("home.parent.dashboard.notes.trendVeryGood");
  } else if (average !== null && average >= 10) {
    trendLabel = t("home.parent.dashboard.notes.trendGood");
  } else if (average !== null) {
    trendLabel = t("home.parent.dashboard.notes.trendWatch");
  }

  return {
    childId: child.id,
    childName: formatChildName(child),
    averageLabel: formatAverage(average, t),
    termLabel: snapshot.label || t("home.parent.dashboard.notes.termCurrent"),
    trendLabel,
    latestEvaluations,
  };
}

export function buildAccountSummary(
  payload: ParentDashboardSummaryResponse,
  t: TranslateFn,
): ParentAccountSummary {
  const unreadMessages = payload.unreadMessages;
  const pendingPayments = payload.payments.pendingCount ?? 0;
  const latePayments = payload.payments.overdueCount ?? 0;
  const recentDocuments = payload.documents.recentCount;
  const pendingActions = [
    payload.payments.connected && pendingPayments > 0,
    unreadMessages > 0,
    recentDocuments > 0,
  ].filter(Boolean).length;

  const latestDocumentLabel =
    payload.documents.latest[0]?.title ??
    (payload.documents.totalPublishedCount > 0
      ? t("home.parent.dashboard.documentsPublished").replace(
          "{count}",
          String(payload.documents.totalPublishedCount),
        )
      : t("home.parent.dashboard.documentsNone"));

  return {
    headline:
      pendingActions === 0
        ? t("home.parent.dashboard.accountHeadlineOk")
        : t("home.parent.dashboard.accountHeadlinePending")
            .replace("{count}", String(pendingActions))
            .replace("{suffix}", pendingActions > 1 ? "s" : ""),
    detail:
      payload.payments.connected && latePayments > 0
        ? t("home.parent.dashboard.accountDetailLate")
        : t("home.parent.dashboard.accountDetailNeutral"),
    items: [
      {
        id: "payments",
        label: t("home.parent.dashboard.paymentsLabel"),
        value: payload.payments.connected ? String(pendingPayments) : "--",
        detail: payload.payments.connected
          ? pendingPayments > 0
            ? t("home.parent.dashboard.paymentsDetail")
                .replace("{lateCount}", String(latePayments))
                .replace(
                  "{pendingCount}",
                  String(pendingPayments - latePayments),
                )
            : t("home.parent.dashboard.paymentsAllOk")
          : payload.payments.detail,
        tone:
          payload.payments.connected && latePayments > 0
            ? "alert"
            : payload.payments.connected && pendingPayments > 0
              ? "watch"
              : "neutral",
      },
      {
        id: "messages",
        label: t("home.parent.dashboard.unreadMessagesLabel"),
        value: String(unreadMessages),
        detail:
          unreadMessages > 0
            ? t("home.parent.dashboard.unreadMessagesHintPositive")
            : t("home.parent.dashboard.unreadMessagesHintNeutral"),
        tone: unreadMessages > 0 ? "watch" : "neutral",
      },
      {
        id: "documents",
        label: t("home.parent.dashboard.documentsLabel"),
        value: String(recentDocuments),
        detail:
          recentDocuments > 0 ? latestDocumentLabel : payload.documents.detail,
        tone: recentDocuments > 0 ? "neutral" : "watch",
      },
    ],
  };
}
