import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { resourcesApi } from "../../api/resources.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import {
  RichEditorField,
  type RichEditorFieldRef,
} from "../editor/RichEditorField";
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

const ACTIVE_STATUSES = new Set(["DRAFT", "AWAITING"]);

export function ResourceDetailScreen(props: {
  resourceId: string;
  part: "statement" | "correction";
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const { resourceId, part } = props;

  const memberships = user?.memberships ?? [];
  const canContribute = memberships.some(
    (m) => m.role === "TEACHER" || m.role === "SCHOOL_ADMIN",
  );

  const [detail, setDetail] = useState<ResourceDetail | null>(null);
  const [mySubmissions, setMySubmissions] = useState<ResourceSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [draftAttachments, setDraftAttachments] = useState<
    ResourceAttachment[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<RichEditorFieldRef>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [detailResult, submissionsResult] = await Promise.all([
        resourcesApi.getResource(resourceId),
        canContribute
          ? resourcesApi.listSubmissions(resourceId, part)
          : Promise.resolve<ResourceSubmission[]>([]),
      ]);
      setDetail(detailResult);
      setMySubmissions(submissionsResult);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [resourceId, part, canContribute]);

  useEffect(() => {
    void load();
  }, [load]);

  const headerTitle =
    part === "statement"
      ? t("resources.contribution.statementHeader")
      : t("resources.contribution.correctionHeader");
  const approvedContent =
    part === "statement" ? detail?.statementContent : detail?.correctionContent;
  const approvedStatus =
    part === "statement" ? detail?.statementStatus : detail?.correctionStatus;
  const hasApprovedContent = approvedStatus === "APPROVED" && !!approvedContent;
  const attachments = (detail?.attachments ?? []).filter(
    (attachment) =>
      attachment.part === (part === "statement" ? "STATEMENT" : "CORRECTION"),
  );

  const activeSubmission = mySubmissions.find((s) =>
    ACTIVE_STATUSES.has(s.status),
  );
  const lastResolvedSubmission = mySubmissions
    .slice()
    .reverse()
    .find((s) => s.status === "REJECTED" || s.status === "DISCARDED");

  const correctionLocked =
    part === "correction" && detail?.statementStatus !== "APPROVED";

  useEffect(() => {
    if (activeSubmission && activeSubmission.status === "DRAFT") {
      setDraftContent(activeSubmission.content);
      setDraftAttachments(activeSubmission.attachments);
    }
  }, [activeSubmission?.id, activeSubmission?.status]);

  async function openAttachment(url?: string | null) {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) return;
      await Linking.openURL(url);
    } catch {
      // ignore, l'ouverture externe n'est pas critique
    }
  }

  async function handleAddAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uploaded = await Promise.all(
        result.assets.map((asset) =>
          resourcesApi.uploadAttachment({
            uri: asset.uri,
            mimeType: asset.mimeType ?? "application/octet-stream",
            fileName: asset.name,
          }),
        ),
      );
      setDraftAttachments((current) => [...current, ...uploaded]);
    } catch {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(new Error("resources.errors.addAttachment")),
      });
    }
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    try {
      const html = (await editorRef.current?.getContentHtml()) ?? draftContent;
      const submission = await resourcesApi.saveSubmissionDraft(
        resourceId,
        part,
        { content: html.trim(), attachments: draftAttachments },
      );
      setMySubmissions((current) => {
        const others = current.filter((s) => s.id !== submission.id);
        return [...others, submission];
      });
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.contribution.draftSaved"),
      });
    } catch (error) {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit() {
    if (!activeSubmission || activeSubmission.status !== "DRAFT") return;
    setIsSaving(true);
    try {
      await resourcesApi.submitSubmission(resourceId, activeSubmission.id);
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.contribution.submitted"),
      });
      await load();
    } catch (error) {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function statusLabel(status: ResourceSubmission["status"]) {
    switch (status) {
      case "DRAFT":
        return t("resources.contribution.statusDraft");
      case "AWAITING":
        return t("resources.contribution.statusAwaiting");
      case "APPROVED":
        return t("resources.contribution.statusApproved");
      case "REJECTED":
        return t("resources.contribution.statusRejected");
      case "DISCARDED":
        return t("resources.contribution.statusDiscarded");
      default:
        return status;
    }
  }

  const showContributionForm =
    canContribute &&
    !correctionLocked &&
    (!activeSubmission || activeSubmission.status === "DRAFT");

  return (
    <View style={styles.root} testID={`resources-detail-screen-${part}`}>
      <ModuleHeader
        title={headerTitle}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID={`resources-detail-header-${part}`}
        backTestID={`resources-detail-back-${part}`}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : errorMessage || !detail ? (
        <View style={styles.centerMessage}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.warmBorder}
          />
          <Text style={styles.errorText}>
            {errorMessage ?? t("resources.detail.notFound")}
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flexOne}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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
              testID={`resources-detail-hero-${part}`}
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

            <Text style={styles.sectionLabel}>
              {t("resources.contribution.approvedLabel")}
            </Text>
            {hasApprovedContent ? (
              <>
                <View style={styles.contentCard}>
                  <Text
                    style={styles.contentText}
                    testID={`resources-detail-content-${part}`}
                  >
                    {stripHtml(approvedContent ?? "")}
                  </Text>
                </View>
                {attachments.length > 0 ? (
                  <View style={styles.attachmentsList}>
                    {attachments.map((attachment, idx) => (
                      <TouchableOpacity
                        key={attachment.id ?? idx}
                        style={styles.attachmentChip}
                        onPress={() => openAttachment(attachment.fileUrl)}
                        disabled={!attachment.fileUrl}
                        testID={`resources-detail-attachment-${part}-${idx}`}
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
            ) : (
              <Text
                style={styles.noContentText}
                testID={`resources-detail-no-approved-${part}`}
              >
                {t("resources.contribution.noApprovedYet")}
              </Text>
            )}

            {correctionLocked ? (
              <View
                style={styles.lockedBanner}
                testID="resources-detail-correction-locked"
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.lockedText}>
                  {t("resources.contribution.correctionLocked")}
                </Text>
              </View>
            ) : null}

            {canContribute && !correctionLocked ? (
              <>
                <Text style={styles.sectionLabel}>
                  {t("resources.contribution.myContributionLabel")}
                </Text>

                {activeSubmission && activeSubmission.status === "AWAITING" ? (
                  <View
                    style={styles.statusBanner}
                    testID={`resources-detail-my-status-${part}`}
                  >
                    <Text style={styles.statusBannerText}>
                      {statusLabel(activeSubmission.status)}
                    </Text>
                  </View>
                ) : null}

                {lastResolvedSubmission &&
                (!activeSubmission || activeSubmission.status === "DRAFT") ? (
                  <View
                    style={styles.statusBanner}
                    testID={`resources-detail-last-resolved-${part}`}
                  >
                    <Text style={styles.statusBannerText}>
                      {statusLabel(lastResolvedSubmission.status)}
                    </Text>
                    {lastResolvedSubmission.status === "REJECTED" &&
                    lastResolvedSubmission.reason ? (
                      <Text style={styles.statusBannerReason}>
                        {t("resources.contribution.rejectedReasonLabel")}{" "}
                        {lastResolvedSubmission.reason}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {showContributionForm ? (
                  <>
                    <RichEditorField
                      ref={editorRef}
                      initialHtml={draftContent}
                      placeholder={t(
                        "resources.contribution.contentPlaceholder",
                      )}
                      insertingPlaceholder={t(
                        "resources.contribution.insertingImage",
                      )}
                      colorPresets={[]}
                      labels={{
                        colorMenuTitle: t(
                          "resources.contribution.colorMenu.title",
                        ),
                        colorMenuMessage: t(
                          "resources.contribution.colorMenu.message",
                        ),
                        cancel: t("resources.common.cancel"),
                      }}
                      onUploadInlineImage={(file) =>
                        resourcesApi.uploadInlineImage({
                          uri: file.uri,
                          mimeType: file.mimeType,
                          fileName: file.name,
                        })
                      }
                      minHeight={160}
                      toolbarTestID={`resources-detail-editor-toolbar-${part}`}
                      editorTestID={`resources-detail-editor-${part}`}
                    />
                    <TouchableOpacity
                      style={styles.addAttachmentBtn}
                      onPress={handleAddAttachment}
                      testID={`resources-detail-add-attachment-${part}`}
                    >
                      <Ionicons
                        name="attach-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.addAttachmentText}>
                        {t("resources.contribution.addAttachment")}
                      </Text>
                    </TouchableOpacity>
                    {draftAttachments.length > 0 ? (
                      <View style={styles.attachmentsList}>
                        {draftAttachments.map((attachment, idx) => (
                          <View
                            key={`${attachment.fileName}-${idx}`}
                            style={styles.attachmentChip}
                            testID={`resources-detail-draft-attachment-${part}-${idx}`}
                          >
                            <Ionicons
                              name="document-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={styles.attachmentText}
                              numberOfLines={1}
                            >
                              {attachment.fileName}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                setDraftAttachments((current) =>
                                  current.filter((_, i) => i !== idx),
                                )
                              }
                              hitSlop={8}
                              testID={`resources-detail-draft-attachment-${part}-${idx}-remove`}
                            >
                              <Ionicons
                                name="close-circle"
                                size={16}
                                color={colors.textSecondary}
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.contributionActions}>
                      <TouchableOpacity
                        style={[
                          styles.saveDraftBtn,
                          isSaving && styles.btnDisabled,
                        ]}
                        onPress={handleSaveDraft}
                        disabled={isSaving}
                        testID={`resources-detail-save-draft-${part}`}
                      >
                        <Text style={styles.saveDraftBtnText}>
                          {t("resources.contribution.saveDraft")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.submitBtn,
                          (isSaving ||
                            !activeSubmission ||
                            activeSubmission.status !== "DRAFT") &&
                            styles.btnDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={
                          isSaving ||
                          !activeSubmission ||
                          activeSubmission.status !== "DRAFT"
                        }
                        testID={`resources-detail-submit-${part}`}
                      >
                        {isSaving ? (
                          <ActivityIndicator
                            color={colors.white}
                            size="small"
                          />
                        ) : (
                          <Text style={styles.submitBtnText}>
                            {t("resources.contribution.submit")}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flexOne: { flex: 1 },
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
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
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
  contentText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  noContentText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.warmSurface,
    borderRadius: 8,
    padding: 12,
  },
  lockedText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  statusBanner: {
    backgroundColor: colors.warmSurface,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statusBannerReason: {
    fontSize: 12,
    color: colors.textSecondary,
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
  addAttachmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addAttachmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  contributionActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  saveDraftBtn: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  saveDraftBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: "700", color: colors.white },
});
