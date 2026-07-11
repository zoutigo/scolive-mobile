import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { resourcesApi, resourcesAdminApi } from "../../api/resources.api";
import type { ApiClientError } from "../../api/client";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { EXAM_TYPE_KEYS, SEQUENCE_LABELS } from "./ResourceCard";
import type {
  ResourceAttachment,
  ResourceDetail,
  ResourceSubmission,
} from "../../types/resources.types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function openAttachment(url?: string | null) {
  if (!url) return;
  void Linking.openURL(url);
}

export function ModerationReviewScreen(props: {
  submissionId: string;
  resourceId: string;
  part: "statement" | "correction";
}) {
  const { submissionId, resourceId, part } = props;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [detail, setDetail] = useState<ResourceDetail | null>(null);
  const [submission, setSubmission] = useState<ResourceSubmission | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isActing, setIsActing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [detailResult, submissions] = await Promise.all([
        resourcesApi.getResource(resourceId),
        resourcesApi.listSubmissions(resourceId, part),
      ]);
      setDetail(detailResult);
      setSubmission(
        submissions.find((item) => item.id === submissionId) ?? null,
      );
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [resourceId, part, submissionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const headerTitle =
    part === "statement"
      ? t("resources.moderation.reviewHeaderStatement")
      : t("resources.moderation.reviewHeaderCorrection");

  const referenceStatement =
    part === "correction" && detail?.statementStatus === "APPROVED"
      ? detail.statementContent
      : null;
  const referenceAttachments: ResourceAttachment[] =
    part === "correction"
      ? (detail?.attachments ?? []).filter((a) => a.part === "STATEMENT")
      : [];

  async function handleApprove() {
    if (!submission) return;
    setIsActing(true);
    try {
      await resourcesAdminApi.approveSubmission(submission.id);
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.moderation.approveSuccess"),
      });
      moduleBack(router);
    } catch (error) {
      const apiError = error as ApiClientError;
      showError({
        title: t("resources.toast.errorTitle"),
        message:
          apiError.statusCode === 409
            ? t("resources.moderation.conflictError")
            : extractApiError(error),
      });
      void load();
    } finally {
      setIsActing(false);
    }
  }

  async function handleReject() {
    if (!submission) return;
    setIsActing(true);
    try {
      await resourcesAdminApi.rejectSubmission(
        submission.id,
        rejectReason.trim() || undefined,
      );
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.moderation.rejectSuccess"),
      });
      moduleBack(router);
    } catch (error) {
      const apiError = error as ApiClientError;
      showError({
        title: t("resources.toast.errorTitle"),
        message:
          apiError.statusCode === 409
            ? t("resources.moderation.conflictError")
            : extractApiError(error),
      });
      void load();
    } finally {
      setIsActing(false);
    }
  }

  return (
    <View style={styles.root} testID={`resources-moderation-review-${part}`}>
      <ModuleHeader
        title={headerTitle}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="resources-moderation-review-header"
        backTestID="resources-moderation-review-back"
      />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : errorMessage || !detail || !submission ? (
        <View style={styles.centerMessage}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.warmBorder}
          />
          <Text
            style={styles.errorText}
            testID="resources-moderation-review-notfound"
          >
            {errorMessage ?? t("resources.moderation.notFound")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FormHero
            icon={
              part === "statement"
                ? "document-text-outline"
                : "checkmark-done-outline"
            }
            title={detail.title}
            subtitle={`${detail.subject.name} • ${detail.academicLevel.label}${
              detail.school ? ` • ${detail.school.name}` : ""
            }`}
            palette="teal"
            testID="resources-moderation-review-hero"
            footer={
              <View style={styles.pillsRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {detail.academicYearLabel}
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {t(EXAM_TYPE_KEYS[detail.examType] ?? detail.examType)}
                  </Text>
                </View>
                {detail.sequence ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      {SEQUENCE_LABELS[detail.sequence] ?? detail.sequence}
                    </Text>
                  </View>
                ) : null}
              </View>
            }
          />

          <Text
            style={styles.authorText}
            testID="resources-moderation-review-author"
          >
            {t("resources.moderation.proposedByLabel")}{" "}
            {submission.authorUser.firstName} {submission.authorUser.lastName}
          </Text>

          {part === "correction" ? (
            <>
              <Text style={styles.sectionLabel}>
                {t("resources.moderation.referenceStatementLabel")}
              </Text>
              <View style={styles.contentCard}>
                {referenceStatement ? (
                  <Text
                    style={styles.contentText}
                    testID="resources-moderation-review-reference"
                  >
                    {stripHtml(referenceStatement)}
                  </Text>
                ) : (
                  <Text style={styles.noContentText}>
                    {t("resources.moderation.statementNotApproved")}
                  </Text>
                )}
              </View>
              {referenceAttachments.length > 0 ? (
                <View style={styles.attachmentsList}>
                  {referenceAttachments.map((attachment, idx) => (
                    <TouchableOpacity
                      key={attachment.id ?? idx}
                      style={styles.attachmentChip}
                      onPress={() => openAttachment(attachment.fileUrl)}
                      disabled={!attachment.fileUrl}
                      testID={`resources-moderation-review-reference-attachment-${idx}`}
                    >
                      <Ionicons
                        name="document-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.attachmentText} numberOfLines={1}>
                        {attachment.fileName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          <Text style={styles.sectionLabel}>
            {t("resources.moderation.submissionContentLabel")}
          </Text>
          <View style={styles.contentCard}>
            <Text
              style={styles.contentText}
              testID="resources-moderation-review-content"
            >
              {stripHtml(submission.content)}
            </Text>
          </View>
          {submission.attachments.length > 0 ? (
            <View style={styles.attachmentsList}>
              {submission.attachments.map((attachment, idx) => (
                <TouchableOpacity
                  key={attachment.id ?? idx}
                  style={styles.attachmentChip}
                  onPress={() => openAttachment(attachment.fileUrl)}
                  disabled={!attachment.fileUrl}
                  testID={`resources-moderation-review-attachment-${idx}`}
                >
                  <Ionicons
                    name="document-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.attachmentText} numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TextInput
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder={t("resources.moderation.rejectReasonPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            style={styles.reasonInput}
            testID="resources-moderation-review-reason"
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn, isActing && styles.btnDisabled]}
              onPress={handleApprove}
              disabled={isActing}
              testID="resources-moderation-review-approve"
            >
              <Text style={styles.btnText}>
                {t("resources.moderation.approveThis")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn, isActing && styles.btnDisabled]}
              onPress={handleReject}
              disabled={isActing}
              testID="resources-moderation-review-reject"
            >
              <Text style={styles.btnText}>
                {t("resources.moderation.rejectThis")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 40 },
  centerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  pill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  authorText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 4,
  },
  contentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    padding: 16,
  },
  contentText: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  noContentText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  attachmentsList: { gap: 8 },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentText: { flex: 1, fontSize: 13, color: colors.textPrimary },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  approveBtn: { backgroundColor: colors.accentTeal },
  rejectBtn: { backgroundColor: colors.notification },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 14, fontWeight: "700", color: colors.white },
});
