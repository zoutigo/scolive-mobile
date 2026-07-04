import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { testsAdminApi } from "../../api/tests-admin.api";
import { RequestReworkSheet } from "./RequestReworkSheet";
import { ReviewExecutionSheet } from "./ReviewExecutionSheet";
import { TestCaseContentSheet } from "./TestCaseContentSheet";
import { QuickMessageSheet } from "./QuickMessageSheet";
import type {
  AdminTestExecutionDetail,
  AdminTesterRow,
} from "../../types/tests-admin.types";
import type { TestExecutionStatus } from "../../types/tests.types";

type Props = {
  executionId: string;
  isActive: boolean;
  testers?: AdminTesterRow[];
};

export function AdminExecutionDetailCard({
  executionId,
  isActive,
  testers = [],
}: Props) {
  const { t, locale } = useTranslation();
  const [detail, setDetail] = useState<AdminTestExecutionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showReworkSheet, setShowReworkSheet] = useState(false);
  const [isSavingRework, setIsSavingRework] = useState(false);
  const [reworkError, setReworkError] = useState<string | null>(null);
  const [showCaseContent, setShowCaseContent] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const response = await testsAdminApi.getExecution(executionId);
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
  }, [isActive, executionId]);

  async function handleMarkReviewed(note: string) {
    setIsSavingReview(true);
    try {
      await testsAdminApi.reviewExecution(executionId, {
        reviewed: true,
        note: note || undefined,
      });
      setShowReviewSheet(false);
      setReviewError(null);
      await load();
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setIsSavingReview(false);
    }
  }

  async function handleUnmarkReviewed() {
    setIsSavingReview(true);
    try {
      await testsAdminApi.reviewExecution(executionId, { reviewed: false });
      await load();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setIsSavingReview(false);
    }
  }

  async function handleRequestRework(note: string) {
    setIsSavingRework(true);
    try {
      await testsAdminApi.requestRework(executionId, {
        requested: true,
        note: note || undefined,
      });
      setShowReworkSheet(false);
      setReworkError(null);
      await load();
    } catch (error) {
      setReworkError(
        error instanceof Error
          ? error.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setIsSavingRework(false);
    }
  }

  async function handleCancelRework() {
    setIsSavingRework(true);
    try {
      await testsAdminApi.requestRework(executionId, { requested: false });
      await load();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setIsSavingRework(false);
    }
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

  const tester = testers.find((item) => item.id === detail.user.id) ?? null;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{detail.testCase.title}</Text>
          <StatusPill
            status={detail.status}
            label={statusLabel(t, detail.status)}
          />
        </View>
        <Text style={styles.meta}>
          {t("testsAdmin.executions.cardTester").replace(
            "{name}",
            detail.user.fullName,
          )}
        </Text>

        <View style={styles.metaRow}>
          <TouchableOpacity
            style={styles.secondaryButtonInline}
            onPress={() => setShowCaseContent(true)}
            testID={`admin-execution-view-case-${executionId}`}
          >
            <Text style={styles.secondaryButtonInlineText}>
              {t("testsAdmin.executions.detail.viewCase")}
            </Text>
          </TouchableOpacity>
          {tester ? (
            <TouchableOpacity
              style={styles.secondaryButtonInline}
              onPress={() => setShowQuickMessage(true)}
              testID={`admin-execution-quick-message-${executionId}`}
            >
              <Text style={styles.secondaryButtonInlineText}>
                {t("testsAdmin.executions.detail.quickMessage")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {t("testsAdmin.executions.cardCampaign").replace(
            "{title}",
            detail.campaign.title,
          )}
        </Text>
        <Text style={styles.meta}>
          {formatDateTime(detail.executedAt, locale)}
        </Text>

        <Section title={t("testsAdmin.executions.detail.resultLabel")}>
          <Text style={styles.body}>
            {detail.resultText?.trim() || t("tests.common.noValue")}
          </Text>
        </Section>

        {detail.comment ? (
          <Section title={t("testsAdmin.executions.detail.commentLabel")}>
            <Text style={styles.body}>{detail.comment}</Text>
          </Section>
        ) : null}

        {detail.deviceInfo || detail.appVersion ? (
          <View style={styles.metaRow}>
            {detail.deviceInfo ? (
              <Text style={styles.metaPill}>
                {t("testsAdmin.executions.detail.deviceLabel")}:{" "}
                {detail.deviceInfo}
              </Text>
            ) : null}
            {detail.appVersion ? (
              <Text style={styles.metaPill}>
                {t("testsAdmin.executions.detail.versionLabel")}:{" "}
                {detail.appVersion}
              </Text>
            ) : null}
          </View>
        ) : null}

        {detail.attachments.length > 0 ? (
          <Section title={t("testsAdmin.executions.detail.attachmentsLabel")}>
            <View style={styles.imageRow}>
              {detail.attachments.map((attachment) => (
                <Image
                  key={attachment.id}
                  source={{ uri: attachment.url }}
                  style={styles.previewImage}
                />
              ))}
            </View>
          </Section>
        ) : null}

        <View style={styles.card}>
          {detail.adminReviewedAt ? (
            <>
              <Text style={styles.reviewedText}>
                {t("testsAdmin.executions.detail.reviewedBy")
                  .replace("{name}", detail.adminReviewedBy?.fullName ?? "")
                  .replace(
                    "{date}",
                    formatDateTime(detail.adminReviewedAt, locale),
                  )}
              </Text>
              {detail.adminReviewNote ? (
                <Text style={styles.body}>{detail.adminReviewNote}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => void handleUnmarkReviewed()}
                disabled={isSavingReview}
                testID="admin-execution-unmark-reviewed-btn"
              >
                <Text style={styles.secondaryButtonText}>
                  {t("testsAdmin.executions.review.unmark")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowReviewSheet(true)}
              disabled={isSavingReview}
              testID="admin-execution-mark-reviewed-btn"
            >
              <Text style={styles.primaryButtonText}>
                {t("testsAdmin.executions.review.markReviewed")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          {detail.reworkRequestedAt ? (
            <>
              <Text style={styles.reworkText}>
                {t("testsAdmin.executions.rework.requestedBy")
                  .replace("{name}", detail.reworkRequestedBy?.fullName ?? "")
                  .replace(
                    "{date}",
                    formatDateTime(detail.reworkRequestedAt, locale),
                  )}
              </Text>
              {detail.reworkNote ? (
                <Text style={styles.body}>{detail.reworkNote}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => void handleCancelRework()}
                disabled={isSavingRework}
                testID="admin-execution-cancel-rework-btn"
              >
                <Text style={styles.secondaryButtonText}>
                  {t("testsAdmin.executions.rework.cancel")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowReworkSheet(true)}
              disabled={isSavingRework}
              testID="admin-execution-request-rework-btn"
            >
              <Text style={styles.secondaryButtonText}>
                {t("testsAdmin.executions.rework.request")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showReviewSheet ? (
        <ReviewExecutionSheet
          saving={isSavingReview}
          error={reviewError}
          onSubmit={(note) => void handleMarkReviewed(note)}
          onCancel={() => setShowReviewSheet(false)}
        />
      ) : null}

      {showReworkSheet ? (
        <RequestReworkSheet
          saving={isSavingRework}
          error={reworkError}
          onSubmit={(note) => void handleRequestRework(note)}
          onCancel={() => setShowReworkSheet(false)}
        />
      ) : null}

      {showCaseContent ? (
        <TestCaseContentSheet
          testCaseId={detail.testCase.id}
          onClose={() => setShowCaseContent(false)}
        />
      ) : null}

      {showQuickMessage && tester ? (
        <QuickMessageSheet
          tester={tester}
          initialSubject={detail.testCase.title}
          onClose={() => setShowQuickMessage(false)}
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

function StatusPill({
  status,
  label,
}: {
  status: TestExecutionStatus;
  label: string;
}) {
  const palette = STATUS_PALETTE[status] ?? STATUS_PALETTE.TODO;
  return (
    <View style={[styles.statusPill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.statusPillText, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

const STATUS_PALETTE: Record<
  TestExecutionStatus,
  { bg: string; text: string }
> = {
  PASSED: { bg: "#E4F5EA", text: "#20744A" },
  FAILED: { bg: "#FBE3E1", text: "#B3261E" },
  BLOCKED: { bg: "#FFF3DD", text: "#9A6700" },
  SKIPPED: { bg: "#F1ECE7", text: colors.textSecondary },
  IN_PROGRESS: { bg: "#E4F5EA", text: "#20744A" },
  TODO: { bg: "#F1ECE7", text: colors.textSecondary },
};

function statusLabel(t: (key: string) => string, value: TestExecutionStatus) {
  switch (value) {
    case "PASSED":
      return t("tests.status.passed");
    case "FAILED":
      return t("tests.status.failed");
    case "BLOCKED":
      return t("tests.status.blocked");
    case "SKIPPED":
      return t("tests.status.skipped");
    case "IN_PROGRESS":
      return t("tests.status.inProgress");
    default:
      return t("tests.status.todo");
  }
}

function formatDateTime(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  meta: { fontSize: 13, color: colors.textSecondary },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaPill: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: "#F4E9DE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  reviewedText: { fontSize: 13, fontWeight: "700", color: "#20744A" },
  reworkText: { fontSize: 13, fontWeight: "700", color: "#B3261E" },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  previewImage: {
    width: 92,
    height: 92,
    borderRadius: 10,
    backgroundColor: "#EEE7DE",
  },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  secondaryButton: {
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
  secondaryButtonInline: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonInlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
