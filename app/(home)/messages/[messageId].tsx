import React, { useEffect, useRef, useState } from "react";
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
import { useBadgesStore } from "../../../src/store/badges.store";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { ConfirmDialog } from "../../../src/components/ConfirmDialog";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { SwipePager } from "../../../src/components/SwipePager";
import {
  useTranslation,
  type TranslateFn,
} from "../../../src/i18n/useTranslation";
import type {
  FolderKey,
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

/** Construit le libellé de boîte de message affiché dans le header, sans
 * jamais répéter le sujet du message courant (déjà visible dans le hero).
 * Pour le dossier inbox, le compteur non-lus/total est isolé dans `highlight`
 * afin d'être affiché en couleur chaude par `ModuleHeader`. */
function buildMailboxHeaderLabel(params: {
  t: TranslateFn;
  folder: FolderKey;
  userLabel: string;
  unreadCount: number;
  total: number;
}): { label: string; highlight?: string } {
  const { t, folder, userLabel, unreadCount, total } = params;
  const totalLabel = String(total);

  if (folder === "sent") {
    return {
      label: t("messaging.detail.header.sent")
        .replace("{user}", userLabel)
        .replace("{total}", totalLabel),
    };
  }
  if (folder === "drafts") {
    return {
      label: t("messaging.detail.header.drafts")
        .replace("{user}", userLabel)
        .replace("{total}", totalLabel),
    };
  }
  if (folder === "archive") {
    return {
      label: t("messaging.detail.header.archive")
        .replace("{user}", userLabel)
        .replace("{total}", totalLabel),
    };
  }
  return {
    label: t("messaging.detail.header.inboxPrefix").replace(
      "{user}",
      userLabel,
    ),
    highlight: `${unreadCount}/${total}`,
  };
}

export default function MessageDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { messageId } = useLocalSearchParams<{ messageId: string }>();
  const { user } = useAuthStore();
  const { folder, messages, meta, unreadCount } = useMessagingStore();

  // Liste des messages parcourable par swipe, figée à l'ouverture pour que
  // la navigation reste stable même si le store évolue en arrière-plan
  // (ex: badge non-lu qui se met à jour pendant la lecture).
  const [ids] = useState<string[]>(() => {
    const fromStore = messages.map((m) => m.id);
    return fromStore.includes(messageId) ? fromStore : [messageId];
  });
  const initialIndex = Math.max(0, ids.indexOf(messageId));

  const userLabel = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const { label: headerLabel, highlight: headerHighlight } =
    buildMailboxHeaderLabel({
      t,
      folder,
      userLabel,
      unreadCount,
      total: meta?.total ?? ids.length,
    });

  function handleExit() {
    router.back();
  }

  const content = (
    <View style={styles.root}>
      <ModuleHeader
        title={headerLabel}
        titleHighlight={headerHighlight}
        onBack={handleExit}
        topInset={insets.top}
        testID="message-detail-header"
        backTestID="msg-back-btn"
        titleTestID="message-detail-header-title"
        titleUppercase={false}
      />

      <SwipePager
        ids={ids}
        initialIndex={initialIndex}
        renderWindow={1}
        testID="message-detail-pager"
        renderPage={(id, isActive) => (
          <MessageDetailPage id={id} isActive={isActive} onExit={handleExit} />
        )}
      />
    </View>
  );

  return <AppShell showHeader={false}>{content}</AppShell>;
}

function MessageDetailPage({
  id,
  isActive,
  onExit,
}: {
  id: string;
  isActive: boolean;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const {
    markLocalRead,
    markLocalUnread,
    removeLocal,
    keepUnreadIds,
    setFolder,
  } = useMessagingStore();
  const showFeedbackToast = useSuccessToastStore((state) => state.show);

  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const hasAutoMarkedRead = useRef(false);

  useEffect(() => {
    if (!schoolSlug) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadFailed(false);
    messagingApi
      .get(schoolSlug, id)
      .then((m) => {
        if (!cancelled) setMessage(m);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolSlug, id]);

  // Marque le message lu uniquement quand il devient visible à l'écran (page
  // active du swipe), sans jamais écraser un choix explicite "non lu" de
  // l'utilisateur (`keepUnreadIds`).
  useEffect(() => {
    if (!schoolSlug || !message || !isActive) return;
    if (!message.recipientState || message.recipientState.readAt) return;
    if (keepUnreadIds.has(id)) return;
    if (hasAutoMarkedRead.current) return;
    hasAutoMarkedRead.current = true;

    messagingApi.markRead(schoolSlug, id, true).catch(() => {});
    markLocalRead(id);
    void useBadgesStore.getState().loadSummary(schoolSlug);
    setMessage((current) =>
      current && current.recipientState
        ? {
            ...current,
            recipientState: {
              ...current.recipientState,
              readAt: new Date().toISOString(),
            },
          }
        : current,
    );
  }, [schoolSlug, message, isActive, id, keepUnreadIds, markLocalRead]);

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
      void useBadgesStore.getState().loadSummary(schoolSlug);
      // Après un désarchivage, bascule sur le dossier d'origine pour que
      // l'écran de liste recharge inbox/sent et montre le message restauré.
      if (isArchived) {
        setFolder(message.isSender ? "sent" : "inbox");
      }
      onExit();
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
      void useBadgesStore.getState().loadSummary(schoolSlug);
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
      showFeedbackToast({
        variant: "success",
        title: t("messaging.toasts.markedUnreadTitle"),
        message: t("messaging.toasts.markedUnreadMessage"),
      });
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
      void useBadgesStore.getState().loadSummary(schoolSlug);
      onExit();
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
    const senderLabel = message.sender
      ? `${message.sender.firstName} ${message.sender.lastName}`
      : "";
    router.push({
      pathname: "/(home)/messages/compose",
      params: {
        replyToSubject: message.subject,
        replyToSenderId: message.sender?.id ?? "",
        replyToSenderLabel: message.sender
          ? `${message.sender.lastName} ${message.sender.firstName}`
          : "",
        quoteHeader: t("messaging.detail.reply.quoteHeader")
          .replace(
            "{date}",
            formatFullDate(message.sentAt ?? message.createdAt),
          )
          .replace("{sender}", senderLabel),
        quoteBodyHtml: message.body,
      },
    });
  }

  function handleForward() {
    if (!message) return;
    const senderLabel = message.isSender
      ? t("messaging.detail.fromYou")
      : message.sender
        ? `${message.sender.firstName} ${message.sender.lastName}`
        : "";
    const recipientsLabel = message.recipients
      .map((r) => `${r.firstName} ${r.lastName}`)
      .join(", ");

    const quoteHeader = [
      t("messaging.detail.forward.quoteHeader"),
      t("messaging.detail.forward.quoteFrom").replace("{sender}", senderLabel),
      t("messaging.detail.forward.quoteDate").replace(
        "{date}",
        formatFullDate(message.sentAt ?? message.createdAt),
      ),
      t("messaging.detail.forward.quoteSubject").replace(
        "{subject}",
        message.subject || t("messaging.list.noSubject"),
      ),
      t("messaging.detail.forward.quoteTo").replace(
        "{recipients}",
        recipientsLabel,
      ),
    ].join("\n");

    router.push({
      pathname: "/(home)/messages/compose",
      params: {
        forwardSubject: message.subject,
        quoteHeader,
        quoteBodyHtml: message.body,
        forwardAttachments: JSON.stringify(
          message.attachments.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
          })),
        ),
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

  if (isLoading) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (loadFailed || !message) {
    return (
      <View style={styles.root}>
        <View style={styles.center} testID={`message-detail-error-${id}`}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={colors.notification}
          />
          <Text style={styles.errorText}>
            {t("messaging.detail.errors.loadFailedMessage")}
          </Text>
        </View>
      </View>
    );
  }

  const isArchived = message.isSender
    ? !!message.senderArchivedAt
    : !!message.recipientState?.archivedAt;

  const bodyText = htmlToText(message.body);
  const inlineImages = extractImageUrls(message.body);
  const displayDate = formatFullDate(message.sentAt ?? message.createdAt);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryCard}>
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
                  size={16}
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
            {message.status === "DRAFT" && (
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {t("messaging.detail.draftBadge")}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.subject} numberOfLines={2}>
            {message.subject || t("messaging.list.noSubject")}
          </Text>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={styles.recipientsToggleCompact}
              onPress={() => setShowRecipients((v) => !v)}
              testID={`recipients-toggle-${id}`}
              accessibilityLabel={
                message.recipients.length === 1
                  ? t("messaging.detail.recipientsToggleSingular")
                  : t("messaging.detail.recipientsTogglePlural").replace(
                      "{count}",
                      String(message.recipients.length),
                    )
              }
            >
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.recipientsCountCompact}>
                {message.recipients.length}
              </Text>
              <Ionicons
                name={showRecipients ? "chevron-up" : "chevron-down"}
                size={14}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <View
              style={styles.heroActionIcons}
              testID={`message-detail-action-bar-${id}`}
            >
              {!message.isSender && (
                <TouchableOpacity
                  style={[
                    styles.heroActionIconBtn,
                    styles.heroActionIconBtnBlue,
                  ]}
                  onPress={handleReply}
                  disabled={isBusy}
                  testID={`reply-btn-${id}`}
                  accessibilityLabel={t("messaging.actions.reply")}
                >
                  <Ionicons
                    name="return-down-back-outline"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.heroActionIconBtn, styles.heroActionIconBtnBlue]}
                onPress={handleForward}
                disabled={isBusy}
                testID={`forward-btn-${id}`}
                accessibilityLabel={t("messaging.actions.forward")}
              >
                <Ionicons
                  name="arrow-redo-outline"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {!message.isSender && !!message.recipientState?.readAt && (
                <TouchableOpacity
                  style={[
                    styles.heroActionIconBtn,
                    styles.heroActionIconBtnWarm,
                  ]}
                  onPress={handleMarkUnread}
                  disabled={isBusy}
                  testID={`mark-unread-btn-${id}`}
                  accessibilityLabel={t("messaging.actions.markUnread")}
                >
                  <Ionicons
                    name="mail-unread-outline"
                    size={18}
                    color={colors.warmAccent}
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.heroActionIconBtn, styles.heroActionIconBtnTeal]}
                onPress={handleArchiveToggle}
                disabled={isBusy}
                testID={`archive-btn-${id}`}
                accessibilityLabel={
                  isArchived
                    ? t("messaging.actions.unarchive")
                    : t("messaging.actions.archive")
                }
              >
                <Ionicons
                  name={isArchived ? "archive" : "archive-outline"}
                  size={18}
                  color={colors.accentTeal}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.heroActionIconBtn,
                  styles.heroActionIconBtnDanger,
                ]}
                onPress={() => setConfirmDelete(true)}
                disabled={isBusy}
                testID={`delete-btn-${id}`}
                accessibilityLabel={t("messaging.actions.delete")}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.notification}
                />
              </TouchableOpacity>
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
                  testID={`inline-image-${id}-${idx}`}
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
                testID={`attachment-row-${id}-${attachment.id}`}
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
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 14 },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  subject: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    lineHeight: 21,
  },
  statusPill: {
    backgroundColor: "rgba(224, 115, 42, 0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
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
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  senderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  senderAvatarMuted: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  senderInitials: { color: colors.white, fontSize: 13, fontWeight: "700" },
  metaContent: { flex: 1, gap: 2 },
  metaFrom: { fontSize: 13, color: colors.textSecondary },
  metaName: { fontWeight: "700", color: colors.textPrimary },
  metaDate: { fontSize: 12, color: colors.textSecondary },

  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  recipientsToggleCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(12,95,168,0.08)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexShrink: 0,
  },
  recipientsCountCompact: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },
  heroActionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  heroActionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  heroActionIconBtnBlue: { backgroundColor: "rgba(12,95,168,0.10)" },
  heroActionIconBtnWarm: { backgroundColor: "rgba(224,115,42,0.14)" },
  heroActionIconBtnTeal: { backgroundColor: "rgba(56,173,169,0.12)" },
  heroActionIconBtnDanger: { backgroundColor: "rgba(180,35,24,0.10)" },

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
