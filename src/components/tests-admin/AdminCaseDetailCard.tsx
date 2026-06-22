import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { testsAdminApi } from "../../api/tests-admin.api";
import { TestCaseFormSheet, type CaseFormValues } from "./TestCaseFormSheet";
import type { AdminCaseDetail } from "../../types/tests-admin.types";
import type { TestCasePriority } from "../../types/tests.types";

type Props = {
  testCaseId: string;
  isActive: boolean;
  onDeleted: () => void;
};

export function AdminCaseDetailCard({
  testCaseId,
  isActive,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useSuccessToastStore();
  const [detail, setDetail] = useState<AdminCaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recycling, setRecycling] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const response = await testsAdminApi.getCase(testCaseId);
      setDetail(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("testsAdmin.common.errors.loadGeneric"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isActive || detail) return;
    void load();
  }, [isActive, testCaseId]);

  async function handleEditSubmit(values: CaseFormValues) {
    setSaving(true);
    setSaveError(null);
    try {
      await testsAdminApi.updateCase(testCaseId, {
        title: values.title,
        module: values.module || null,
        objective: values.objective || null,
        preconditions: values.preconditions || null,
        expectedResult: values.expectedResult,
        priority: values.priority,
        evidenceRequired: values.evidenceRequired,
        dueAt: values.dueAt || null,
      });
      setShowEdit(false);
      showSuccess({
        title: t("testsAdmin.caseDetail.updateSuccessTitle"),
        message: t("testsAdmin.caseDetail.updateSuccessMessage"),
      });
      await load();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRecycle() {
    setRecycling(true);
    try {
      await testsAdminApi.recycleCase(testCaseId);
      showSuccess({
        title: t("testsAdmin.caseDetail.recycleSuccessTitle"),
        message: t("testsAdmin.caseDetail.recycleSuccessMessage"),
      });
      await load();
    } catch (error) {
      showError({
        title: t("testsAdmin.common.errors.submitGeneric"),
        message:
          error instanceof Error
            ? error.message
            : t("testsAdmin.common.errors.submitGeneric"),
      });
    } finally {
      setRecycling(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      t("testsAdmin.detail.deleteCaseConfirmTitle"),
      t("testsAdmin.detail.deleteCaseConfirmMessage"),
      [
        { text: t("testsAdmin.common.cancel"), style: "cancel" },
        {
          text: t("testsAdmin.detail.delete"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              await testsAdminApi.deleteCase(testCaseId);
              showSuccess({
                title: t("testsAdmin.caseDetail.deleteSuccessTitle"),
                message: t("testsAdmin.caseDetail.deleteSuccessMessage"),
              });
              onDeleted();
            })();
          },
        },
      ],
    );
  }

  if (isLoading || !detail) {
    return (
      <View style={styles.center}>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        testID={`admin-case-detail-card-${testCaseId}`}
      >
        <View style={styles.headerRow}>
          <Text style={styles.reference}>
            {t("testsAdmin.detail.referencePrefix").replace(
              "{reference}",
              String(detail.reference).padStart(6, "0"),
            )}
          </Text>
          <PriorityPill priority={detail.priority} t={t} />
        </View>
        <Text style={styles.title}>{detail.title}</Text>
        <Text style={styles.meta}>{detail.campaign.title}</Text>

        {detail.module ? (
          <Text style={styles.metaPill}>{detail.module}</Text>
        ) : null}

        <Section title={t("testsAdmin.caseForm.objectiveLabel")}>
          <Text style={styles.body}>
            {detail.objective?.trim() || t("tests.common.noValue")}
          </Text>
        </Section>

        <Section title={t("testsAdmin.caseForm.preconditionsLabel")}>
          <Text style={styles.body}>
            {detail.preconditions?.trim() || t("tests.common.noValue")}
          </Text>
        </Section>

        <Section title={t("testsAdmin.caseForm.expectedResultLabel")}>
          <Text style={styles.body}>{detail.expectedResult}</Text>
        </Section>

        <View style={styles.metaRow}>
          <Text style={styles.metaPill}>
            {t("testsAdmin.detail.executionsCount").replace(
              "{count}",
              String(detail.executionsCount),
            )}
          </Text>
          {detail.evidenceRequired ? (
            <Text style={styles.metaPill}>
              {t("testsAdmin.caseForm.evidenceRequiredLabel")}
            </Text>
          ) : null}
          {detail.recycledAt ? (
            <Text style={styles.metaPill}>
              {t("testsAdmin.detail.recycledOn").replace(
                "{date}",
                formatDate(detail.recycledAt),
              )}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowEdit(true)}
            testID={`admin-case-detail-edit-${testCaseId}`}
          >
            <Text style={styles.primaryButtonText}>
              {t("testsAdmin.detail.edit")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            disabled={recycling}
            onPress={() => void handleRecycle()}
            testID={`admin-case-detail-recycle-${testCaseId}`}
          >
            <Text style={styles.secondaryButtonText}>
              {recycling
                ? t("testsAdmin.detail.recycling")
                : t("testsAdmin.detail.recycle")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDelete}
            testID={`admin-case-detail-delete-${testCaseId}`}
          >
            <Text style={styles.secondaryButtonText}>
              {t("testsAdmin.detail.delete")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showEdit ? (
        <TestCaseFormSheet
          testCase={detail}
          saving={saving}
          error={saveError}
          onSubmit={(values) => void handleEditSubmit(values)}
          onCancel={() => setShowEdit(false)}
        />
      ) : null}
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PriorityPill({
  priority,
  t,
}: {
  priority: TestCasePriority;
  t: (key: string) => string;
}) {
  const palette = PRIORITY_PALETTE[priority];
  const labelKey = `testsAdmin.caseForm.priority.${priority.toLowerCase()}`;
  return (
    <View style={[styles.statusPill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.statusPillText, { color: palette.text }]}>
        {t(labelKey)}
      </Text>
    </View>
  );
}

const PRIORITY_PALETTE: Record<TestCasePriority, { bg: string; text: string }> =
  {
    LOW: { bg: "#F1ECE7", text: colors.textSecondary },
    MEDIUM: { bg: "#E4F5EA", text: "#20744A" },
    HIGH: { bg: "#FFF3DD", text: "#9A6700" },
    CRITICAL: { bg: "#FBE3E1", text: "#B3261E" },
  };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 14, color: colors.notification, textAlign: "center" },
  content: { padding: 16, paddingBottom: 60, gap: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  reference: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  title: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaPill: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: "#F4E9DE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    padding: 14,
    gap: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  body: { fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
});
