import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../../../src/theme";
import { messagingApi } from "../../../src/api/messaging.api";
import { useMessagingStore } from "../../../src/store/messaging.store";
import { useAuthStore } from "../../../src/store/auth.store";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { ConfirmDialog } from "../../../src/components/ConfirmDialog";
import {
  AppShell,
} from "../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { useTranslation } from "../../../src/i18n/useTranslation";
import type {
  MessageAttachment,
  MessageDetail,
} from "../../../src/types/messaging.types";

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<img[^>]+>/gi, "") // images handled separately
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMediaUrl(url: string): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  const match = apiUrl.match(/^https?:\/\/([^:/]+)/);
  const apiHost = match?.[1] ?? "";
  if (apiHost && apiHost !== "localhost") {
    return url.replace(/\blocalhost\b/g, apiHost);
  }
  return url;
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) urls.push(normalizeMediaUrl(match[1]));
  }
  return urls;
}

function formatFullDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function initials(firstName?: string, lastName?: string): string {
  return (
    `${(firstName ?? "")[0] ?? ""}${(lastName ?? "")[0] ?? ""}`.toUpperCase() ||
    "?"
  );
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return "document-text-outline";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  ) {
    return "grid-outline";
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return "easel-outline";
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return "document-outline";
  }
  if (mimeType.startsWith("image/")) {
    return "image-outline";
  }
  return "attach-outline";
}

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} o`;
  if (sizeBytes < 1024 * 1024)
    return `${Math.round(sizeBytes / 102.4) / 10} Ko`;
  return `${Math.round(sizeBytes / (1024 * 102.4)) / 10} Mo`;
}

export default function MessageDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const { schoolSlug } = useAuthStore();
  const { markLocalRead, markLocalUnread, removeLocal } = useMessagingStore();
  const showFeedbackToast = useSuccessToastStore((state) => state.show);

  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecipients, setShowRecipients] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!schoolSlug || !messageId) return;
    setIsLoading(true);
    messagingApi
      .get(schoolSlug, messageId)
      .then((m) => {
        setMessage(m);
        // Mark as read if unread inbox message
        if (m.recipientState && !m.recipientState.readAt) {
          messagingApi.markRead(schoolSlug, messageId, true).catch(() => {});
          markLocalRead(messageId);
        }
      })
      .catch(() => {
        Alert.alert(
          t("messaging.detail.errors.loadFailedTitle"),
          t("messaging.detail.errors.loadFailedMessage"),
        );
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [schoolSlug, messageId, markLocalRead, router]);

  async function handleArchiveToggle() {
    if (!schoolSlug || !message) return;
    const isArchived = message.isSender
      ? !!message.senderArchivedAt
      : !!message.recipientState?.archivedAt;
    setIsBusy(true);
    try {
      await messagingApi.archive(schoolSlug, message.id, !isArchived);
      showFeedbackToast({
        variant: "success",
        title: !isArchived
          ? t("messaging.toasts.archivedTitle")
          : t("messaging.toasts.unarchivedTitle"),
        message: !isArchived
          ? t("messaging.toasts.archivedMessage")
          : t("messaging.toasts.unarchivedMessage"),
      });
      removeLocal(message.id);
      router.back();
    } catch {
      showFeedbackToast({
        variant: "error",
        title: t("messaging.toasts.archiveErrorTitle"),
        message: t("messaging.toasts.archiveErrorMessage"),
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleMarkUnread() {
    if (!schoolSlug || !message || message.isSender) return;
    setIsBusy(true);
    try {
      await messagingApi.markRead(schoolSlug, message.id, false);
      markLocalUnread(message.id);
      setMessage((current) =>
        current
          ? {
              ...current,
              recipientState: current.recipientState
                ? { ...current.recipientState, readAt: null }
                : current.recipientState,
            }
          : current,
      );
      router.back();
    } catch {
      Alert.alert(
        t("messaging.detail.errors.markUnreadFailedTitle"),
        t("messaging.detail.errors.markUnreadFailedMessage"),
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!schoolSlug || !message) return;
    setIsBusy(true);
    try {
      await messagingApi.remove(schoolSlug, message.id);
      showFeedbackToast({
        variant: "success",
        title: t("messaging.toasts.deletedTitle"),
        message: t("messaging.toasts.deletedMessage"),
      });
      removeLocal(message.id);
      router.back();
    } catch {
      showFeedbackToast({
        variant: "error",
        title: t("messaging.toasts.deleteErrorTitle"),
        message: t("messaging.toasts.deleteErrorMessage"),
      });
    } finally {
      setIsBusy(false);
      setConfirmDelete(false);
    }
  }

  function handleReply() {
    if (!message) return;
    router.push({
      pathname: "/(home)/messages/compose",
      params: {
        replyToSubject: message.subject,
        replyToSenderId: message.sender?.id ?? "",
        replyToSenderLabel: message.sender
          ? `${message.sender.lastName} ${message.sender.firstName}`
          : "",
      },
    });
  }

  async function openAttachment(attachment: MessageAttachment) {
    try {
      const supported = await Linking.canOpenURL(attachment.url);
      if (!supported) {
        throw new Error("UNSUPPORTED_ATTACHMENT_URL");
      }
      await Linking.openURL(attachment.url);
    } catch {
      Alert.alert(
        t("messaging.detail.errors.openAttachmentFailedTitle"),
        t("messaging.detail.errors.openAttachmentFailedMessage"),
      );
    }
  }

  const isArchived = message
    ? message.isSender
      ? !!message.senderArchivedAt
      : !!message.recipientState?.archivedAt
    : false;

  if (isLoading) {
    const loadingContent = (
      <View style={styles.root}>
        <ModuleHeader
          title={t("messaging.title")}
          onBack={() => router.back()}
          topInset={insets.top}
          testID="message-detail-header"
          backTestID="msg-back-btn"
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );

    return <AppShell showHeader={false}>{loadingContent}</AppShell>;
  }

  if (!message) return null;

  const bodyText = htmlToText(message.body);
  const inlineImages = extractImageUrls(message.body);
  const displayDate = formatFullDate(message.sentAt ?? message.createdAt);

  const content = (
    <View style={styles.root}>
      {/* Header */}
      <ModuleHeader
        title={message.subject}
        onBack={() => router.back()}
        topInset={insets.top}
        testID="message-detail-header"
        backTestID="msg-back-btn"
      />

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.subject}>
              {message.subject || t("messaging.list.noSubject")}
            </Text>
            {message.status === "DRAFT" && (
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {t("messaging.detail.draftBadge")}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {message.sender ? (
              <View style={styles.senderAvatar}>
                <Text style={styles.senderInitials}>
                  {initials(message.sender.firstName, message.sender.lastName)}
                </Text>
              </View>
            ) : (
              <View style={styles.senderAvatarMuted}>
                <Ionicons
                  name="mail-open-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </View>
            )}
            <View style={styles.metaContent}>
              {message.isSender ? (
                <Text style={styles.metaFrom}>
                  {t("messaging.detail.fromLabel")}
                  <Text style={styles.metaName}>
                    {t("messaging.detail.fromYou")}
                  </Text>
                </Text>
              ) : message.sender ? (
                <Text style={styles.metaFrom}>
                  {t("messaging.detail.fromLabel")}
                  <Text style={styles.metaName}>
                    {message.sender.lastName} {message.sender.firstName}
                  </Text>
                </Text>
              ) : null}
              <Text style={styles.metaDate}>{displayDate}</Text>
            </View>
          </View>

          <View style={styles.summaryInfoRow}>
            <TouchableOpacity
              style={styles.recipientsToggle}
              onPress={() => setShowRecipients((v) => !v)}
              testID="recipients-toggle"
            >
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.recipientsCount}>
                {message.recipients.length === 1
                  ? t("messaging.detail.recipientsToggleSingular")
                  : t("messaging.detail.recipientsTogglePlural").replace(
                      "{count}",
                      String(message.recipients.length),
                    )}
              </Text>
              <Ionicons
                name={showRecipients ? "chevron-up" : "chevron-down"}
                size={14}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.datePill}>
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.datePillText}>
                {message.sentAt
                  ? t("messaging.detail.sentPill")
                  : t("messaging.detail.createdPill")}
              </Text>
            </View>
          </View>
        </View>

        {showRecipients && (
          <View style={styles.meta}>
            <Text style={styles.recipientsSectionTitle}>
              {t("messaging.detail.recipientsSectionTitle")}
            </Text>
            <View style={styles.recipientsList}>
              {message.recipients.map((r) => (
                <View key={r.id} style={styles.recipientRow}>
                  <View style={styles.recipientAvatar}>
                    <Text style={styles.recipientInitial}>
                      {initials(r.firstName, r.lastName)}
                    </Text>
                  </View>
                  <View style={styles.recipientInfo}>
                    <Text style={styles.recipientName}>
                      {r.lastName} {r.firstName}
                    </Text>
                    <Text style={styles.recipientEmail}>{r.email}</Text>
                  </View>
                  {r.readAt && (
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color={colors.accentTeal}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Body */}
        <View style={styles.bodyCard}>
          {bodyText.length > 0 && (
            <Text style={styles.bodyText}>{bodyText}</Text>
          )}

          {/* Inline images */}
          {inlineImages.length > 0 && (
            <View
              style={[
                styles.inlineImages,
                bodyText.length > 0 && { marginTop: 16 },
              ]}
            >
              {inlineImages.map((url, idx) => (
                <Image
                  key={`${url}-${idx}`}
                  source={{ uri: url }}
                  style={styles.inlineImage}
                  resizeMode="contain"
                  testID={`inline-image-${idx}`}
                />
              ))}
            </View>
          )}
        </View>

        {message.attachments.length > 0 && (
          <View style={styles.attachmentsCard}>
            <Text style={styles.attachmentsTitle}>
              {t("messaging.detail.attachmentsTitle")}
            </Text>
            {message.attachments.map((attachment) => (
              <TouchableOpacity
                key={attachment.id}
                style={styles.attachmentRow}
                onPress={() => void openAttachment(attachment)}
                testID={`attachment-row-${attachment.id}`}
              >
                <View style={styles.attachmentIcon}>
                  <Ionicons
                    name={fileIcon(attachment.mimeType) as "attach-outline"}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.attachmentMeta}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                  <Text style={styles.attachmentInfo}>
                    {formatAttachmentSize(attachment.sizeBytes)} ·{" "}
                    {attachment.mimeType}
                  </Text>
                </View>
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomActionBarWrap,
          { paddingBottom: Math.max(insets.bottom, 8) + 8 },
        ]}
      >
        <View style={styles.bottomActionBar} testID="message-detail-action-bar">
          {!message.isSender && (
            <TouchableOpacity
              style={styles.bottomActionBtn}
              onPress={handleReply}
              disabled={isBusy}
              testID="reply-btn"
            >
              <Ionicons
                name="return-down-back-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.bottomActionLabel}>
                {t("messaging.actions.reply")}
              </Text>
            </TouchableOpacity>
          )}

          {!message.isSender && !!message.recipientState?.readAt && (
            <TouchableOpacity
              style={styles.bottomActionBtn}
              onPress={handleMarkUnread}
              disabled={isBusy}
              testID="mark-unread-btn"
            >
              <Ionicons
                name="mail-unread-outline"
                size={18}
                color={colors.warmAccent}
              />
              <Text
                style={[
                  styles.bottomActionLabel,
                  styles.bottomActionLabelWarning,
                ]}
              >
                {t("messaging.actions.markUnread")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={handleArchiveToggle}
            disabled={isBusy}
            testID="archive-btn"
          >
            <Ionicons
              name={isArchived ? "archive" : "archive-outline"}
              size={18}
              color={colors.accentTeal}
            />
            <Text
              style={[styles.bottomActionLabel, styles.bottomActionLabelTeal]}
            >
              {isArchived
                ? t("messaging.actions.unarchive")
                : t("messaging.actions.archive")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={() => setConfirmDelete(true)}
            disabled={isBusy}
            testID="delete-btn"
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.notification}
            />
            <Text
              style={[styles.bottomActionLabel, styles.bottomActionLabelDanger]}
            >
              {t("messaging.actions.delete")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm delete */}
      <ConfirmDialog
        visible={confirmDelete}
        variant="danger"
        icon="trash-outline"
        title={t("messaging.actions.deleteDialog.title")}
        message={t("messaging.actions.deleteDialog.message")}
        confirmLabel={t("messaging.actions.deleteDialog.confirm")}
        cancelLabel={t("messaging.actions.deleteDialog.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );

  return <AppShell showHeader={false}>{content}</AppShell>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 136, gap: 14 },

  bottomActionBarWrap: {
    backgroundColor: "rgba(247, 242, 234, 0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  bottomActionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#7B5E45",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
  },
  bottomActionBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  bottomActionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    color: colors.primary,
    includeFontPadding: false,
  },
  bottomActionLabelWarning: { color: colors.warmAccent },
  bottomActionLabelTeal: { color: colors.accentTeal },
  bottomActionLabelDanger: { color: colors.notification },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  subject: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 30,
  },
  statusPill: {
    backgroundColor: "rgba(224, 115, 42, 0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warmAccent,
  },

  meta: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
    gap: 10,
  },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  senderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  senderAvatarMuted: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  senderInitials: { color: colors.white, fontSize: 15, fontWeight: "700" },
  metaContent: { flex: 1, gap: 4 },
  metaFrom: { fontSize: 14, color: colors.textSecondary },
  metaName: { fontWeight: "700", color: colors.textPrimary },
  metaDate: { fontSize: 12, color: colors.textSecondary },
  summaryInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  recipientsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(12,95,168,0.08)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  recipientsCount: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.warmSurface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  recipientsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recipientsList: { gap: 8, paddingTop: 4 },
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.warmSurface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  recipientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(12,95,168,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  recipientInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  recipientInfo: { flex: 1 },
  recipientName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  recipientEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  bodyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 18,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  inlineImages: {
    gap: 10,
  },
  inlineImage: {
    width: "100%",
    minHeight: 160,
    maxHeight: 360,
    borderRadius: 8,
    backgroundColor: colors.warmBorder,
  },
  attachmentsCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 12,
  },
  attachmentsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.warmSurface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(12,95,168,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentMeta: {
    flex: 1,
    gap: 2,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  attachmentInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
