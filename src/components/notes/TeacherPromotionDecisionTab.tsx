import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { promotionsApi } from "../../api/promotions.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { extractApiError } from "../../utils/api-error";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { formatScore } from "../../utils/notes";
import type { CurriculumAcademicLevel } from "../../types/curriculums.types";
import type {
  PromotionDecision,
  TermReportForDecisionRow,
} from "../../types/promotions.types";

type Props = {
  schoolSlug: string;
  classId: string;
  bottomInset: number;
};

type DecisionDraft = {
  decision: PromotionDecision;
  nextAcademicLevelId: string;
};

export function TeacherPromotionDecisionTab({
  schoolSlug,
  classId,
  bottomInset,
}: Props) {
  const { t } = useTranslation();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [rows, setRows] = useState<TermReportForDecisionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, DecisionDraft>>({});
  const [savingReportId, setSavingReportId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    setIsLoading(true);
    try {
      const [levelRows, reportRows] = await Promise.all([
        curriculumsApi.listAcademicLevels(schoolSlug),
        promotionsApi.listTermReportsForDecision(schoolSlug, classId),
      ]);
      setLevels(levelRows);
      setRows(reportRows);
      setDrafts(
        Object.fromEntries(
          reportRows.map((row) => [
            row.id,
            {
              decision: row.decision ?? "PROMOTED",
              nextAcademicLevelId: row.nextAcademicLevel?.id ?? "",
            },
          ]),
        ),
      );
    } catch (error) {
      showError({
        title: t("notes.decision.errors.load"),
        message: extractApiError(error),
      });
    } finally {
      setIsLoading(false);
    }
    // `t`/`showError` intentionally omitted: `t` is a new reference every
    // render and would retrigger this callback's identity on each render.
  }, [schoolSlug, classId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveDecision(reportId: string) {
    if (!schoolSlug) return;
    const draft = drafts[reportId];
    if (!draft) return;
    setSavingReportId(reportId);
    try {
      await promotionsApi.setTermReportDecision(schoolSlug, reportId, {
        decision: draft.decision,
        nextAcademicLevelId:
          draft.decision === "LEFT"
            ? undefined
            : draft.nextAcademicLevelId || undefined,
      });
      showSuccess({ title: t("notes.decision.success.saved"), message: "" });
      await load();
    } catch (error) {
      showError({
        title: t("notes.decision.errors.save"),
        message: extractApiError(error),
      });
    } finally {
      setSavingReportId(null);
    }
  }

  const levelOptions = useMemo(
    () => levels.map((l) => ({ value: l.id, label: l.label })),
    [levels],
  );
  const decisionOptions = useMemo(
    () => [
      { value: "PROMOTED", label: t("promotionsAdmin.decision.PROMOTED") },
      { value: "REPEATED", label: t("promotionsAdmin.decision.REPEATED") },
      { value: "LEFT", label: t("promotionsAdmin.decision.LEFT") },
    ],
    [t],
  );

  if (isLoading) {
    return (
      <View style={styles.centered} testID="decision-tab-loading">
        <LoadingBlock label={t("common.loading")} />
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.centered} testID="decision-tab-empty">
        <EmptyState
          icon="ribbon-outline"
          title={t("notes.decision.empty.title")}
          message={t("notes.decision.empty.message")}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        padding: 16,
        gap: 12,
        paddingBottom: bottomInset + 24,
      }}
      keyboardShouldPersistTaps="handled"
      testID="decision-tab"
    >
      <Text style={styles.intro}>{t("notes.decision.intro")}</Text>

      {rows.map((row) => {
        const draft = drafts[row.id];
        return (
          <View
            key={row.id}
            style={styles.card}
            testID={`decision-card-${row.id}`}
          >
            <Text style={styles.cardTitle}>
              {row.student.lastName} {row.student.firstName}
            </Text>

            <View style={styles.synthesisRow}>
              <View style={styles.synthesisCell}>
                <Text style={styles.synthesisLabel}>
                  {t("notes.decision.synthesis.term1")}
                </Text>
                <Text style={styles.synthesisValue}>
                  {formatScore(row.termAverages.TERM_1)}
                </Text>
              </View>
              <View style={styles.synthesisCell}>
                <Text style={styles.synthesisLabel}>
                  {t("notes.decision.synthesis.term2")}
                </Text>
                <Text style={styles.synthesisValue}>
                  {formatScore(row.termAverages.TERM_2)}
                </Text>
              </View>
              <View style={styles.synthesisCell}>
                <Text style={styles.synthesisLabel}>
                  {t("notes.decision.synthesis.term3")}
                </Text>
                <Text style={styles.synthesisValue}>
                  {formatScore(row.termAverages.TERM_3)}
                </Text>
              </View>
              <View style={styles.synthesisCell}>
                <Text style={styles.synthesisLabel}>
                  {t("notes.decision.synthesis.yearly")}
                </Text>
                <Text style={[styles.synthesisValue, styles.synthesisYearly]}>
                  {formatScore(row.yearlyAverage)}
                </Text>
              </View>
            </View>

            {row.rank !== null && row.classSize !== null ? (
              <Text style={styles.rankText}>
                {t("notes.decision.synthesis.rankPrefix")} {row.rank}
                {t("notes.decision.synthesis.rankSeparator")} {row.classSize}
              </Text>
            ) : null}

            <InlineSelectDropDown
              options={decisionOptions}
              value={draft?.decision ?? "PROMOTED"}
              onChange={(value) =>
                setDrafts((current) => ({
                  ...current,
                  [row.id]: {
                    ...current[row.id],
                    decision: value as PromotionDecision,
                  },
                }))
              }
              testID={`decision-card-${row.id}-decision`}
            />

            {draft?.decision !== "LEFT" ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t("promotionsAdmin.decisions.nextLevel")}
                </Text>
                <InlineSelectDropDown
                  options={levelOptions}
                  value={draft?.nextAcademicLevelId ?? ""}
                  onChange={(value) =>
                    setDrafts((current) => ({
                      ...current,
                      [row.id]: {
                        ...current[row.id],
                        nextAcademicLevelId: value,
                      },
                    }))
                  }
                  testID={`decision-card-${row.id}-level`}
                />
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                savingReportId === row.id && styles.submitButtonDisabled,
              ]}
              disabled={savingReportId === row.id}
              onPress={() => saveDecision(row.id)}
              testID={`decision-card-${row.id}-save`}
            >
              <Text style={styles.submitButtonText}>{t("common.save")}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", padding: 16 },
  intro: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  synthesisRow: { flexDirection: "row", gap: 8 },
  synthesisCell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  synthesisLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  synthesisValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  synthesisYearly: { color: colors.primary },
  rankText: { fontSize: 12, color: colors.textSecondary },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  submitButton: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 13, fontWeight: "700", color: colors.white },
});
