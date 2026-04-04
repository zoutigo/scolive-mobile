import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { MessageListItem } from "../../types/messaging.types";

interface Props {
  item: MessageListItem;
  onPress: (item: MessageListItem) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function senderInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "?";
  return `${(firstName ?? "")[0] ?? ""}${(lastName ?? "")[0] ?? ""}`.toUpperCase();
}

function senderLabel(item: MessageListItem): string {
  if (item.folder === "sent" || item.folder === "drafts") {
    if (item.recipientsCount === 1) return "1 destinataire";
    return `${item.recipientsCount} destinataires`;
  }
  if (!item.sender) return "Expéditeur inconnu";
  return `${item.sender.lastName} ${item.sender.firstName}`;
}

export function MessageRow({ item, onPress }: Props) {
  const isUnread = item.unread && item.folder === "inbox";
  const displayDate = formatDate(item.sentAt ?? item.createdAt);
  const initials = senderInitials(
    item.sender?.firstName,
    item.sender?.lastName,
  );

  return (
    <TouchableOpacity
      style={[styles.row, isUnread && styles.rowUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
      testID={`message-row-${item.id}`}
    >
      {/* Avatar */}
      <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
        {item.folder === "sent" || item.folder === "drafts" ? (
          <Ionicons
            name={item.status === "DRAFT" ? "create-outline" : "send"}
            size={16}
            color={isUnread ? colors.white : colors.primary}
          />
        ) : (
          <Text style={[styles.initials, isUnread && styles.initialsUnread]}>
            {initials}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.sender, isUnread && styles.senderUnread]}
            numberOfLines={1}
          >
            {senderLabel(item)}
          </Text>
          <Text style={[styles.date, isUnread && styles.dateUnread]}>
            {displayDate}
          </Text>
        </View>
        <Text
          style={[styles.subject, isUnread && styles.subjectUnread]}
          numberOfLines={1}
        >
          {item.status === "DRAFT" && (
            <Text style={styles.draftTag}>Brouillon · </Text>
          )}
          {item.subject || "(sans objet)"}
        </Text>
        {item.preview ? (
          <Text style={styles.preview} numberOfLines={1}>
            {item.preview}
          </Text>
        ) : null}
        {item.attachments.length > 0 ? (
          <View style={styles.attachmentBadge}>
            <Ionicons
              name="attach-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={styles.attachmentBadgeLabel}>
              {item.attachments.length}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Unread dot */}
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    gap: 12,
  },
  rowUnread: {
    backgroundColor: colors.warmSurface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(12,95,168,0.10)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarUnread: {
    backgroundColor: colors.primary,
  },
  initials: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  initialsUnread: {
    color: colors.white,
  },
  content: { flex: 1, gap: 3 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sender: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    flex: 1,
  },
  senderUnread: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  date: { fontSize: 12, color: colors.textSecondary, flexShrink: 0 },
  dateUnread: { color: colors.primary, fontWeight: "600" },
  subject: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  subjectUnread: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  preview: {
    fontSize: 13,
    color: colors.textSecondary,
    opacity: 0.75,
  },
  attachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  attachmentBadgeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  draftTag: {
    color: colors.warmAccent,
    fontWeight: "600",
    fontStyle: "italic",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
});
