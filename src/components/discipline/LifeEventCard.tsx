import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  DISCIPLINE_TYPE_CONFIG,
  type StudentLifeEvent,
} from "../../types/discipline.types";
import { LifeEventTypeBadge } from "./LifeEventTypeBadge";

interface Props {
  event: StudentLifeEvent;
  headline?: string | null;
  /** Affiché si true — réservé aux vues teacher/admin. */
  showActions?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (event: StudentLifeEvent) => void;
  onDelete?: (event: StudentLifeEvent) => void;
}

export function LifeEventCard({
  event,
  headline,
  showActions = false,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const cfg = DISCIPLINE_TYPE_CONFIG[event.type];

  const date = new Date(event.occurredAt);
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const authorName = `${event.authorUser.lastName} ${event.authorUser.firstName}`;
  const hasExtra =
    event.durationMinutes != null ||
    event.justified != null ||
    event.comment ||
    event.class?.name ||
    event.schoolYear?.label;

  return (
    <View
      style={[styles.card, { borderLeftColor: cfg.accent }]}
      testID={`life-event-card-${event.id}`}
    >
      {/* En-tête */}
      <View style={styles.header}>
        <LifeEventTypeBadge type={event.type} size="sm" />
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>
      </View>

      {/* Motif */}
      {headline ? (
        <Text style={styles.headline} numberOfLines={1}>
          {headline}
        </Text>
      ) : null}
      <Text style={styles.reason} numberOfLines={expanded ? undefined : 2}>
        {event.reason}
      </Text>

      {/* Informations supplémentaires (expandable) */}
      {hasExtra && (
        <TouchableOpacity
          style={styles.expandRow}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
          testID={`expand-event-${event.id}`}
          accessibilityLabel={
            expanded ? "Réduire les détails" : "Voir les détails"
          }
        >
          <Text style={styles.expandLabel}>
            {expanded ? "Masquer les détails" : "Voir les détails"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      {expanded && (
        <View style={styles.details}>
          {event.durationMinutes != null && (
            <DetailRow
              icon="timer-outline"
              label="Durée"
              value={`${event.durationMinutes} min`}
            />
          )}
          {event.justified != null && (
            <DetailRow
              icon={
                event.justified
                  ? "checkmark-circle-outline"
                  : "close-circle-outline"
              }
              label="Justifié"
              value={event.justified ? "Oui" : "Non"}
              valueColor={
                event.justified ? colors.accentTeal : colors.notification
              }
            />
          )}
          {event.class?.name && (
            <DetailRow
              icon="book-outline"
              label="Classe"
              value={event.class.name}
            />
          )}
          {event.schoolYear?.label && (
            <DetailRow
              icon="calendar-outline"
              label="Année scolaire"
              value={event.schoolYear.label}
            />
          )}
          {event.comment && (
            <View style={styles.commentRow}>
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.commentText}>{event.comment}</Text>
            </View>
          )}
        </View>
      )}

      {/* Footer : auteur + actions */}
      <View style={styles.footer}>
        <View style={styles.authorRow}>
          <Ionicons
            name="person-outline"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={styles.authorText}>{authorName}</Text>
        </View>

        {showActions && (
          <View style={styles.actions}>
            {canEdit && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onEdit?.(event)}
                testID={`edit-event-${event.id}`}
                accessibilityLabel="Modifier cet événement"
              >
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => onDelete?.(event)}
                testID={`delete-event-${event.id}`}
                accessibilityLabel="Supprimer cet événement"
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.notification}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Sous-composant : ligne de détail ──────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons
        name={icon as "time-outline"}
        size={13}
        color={colors.textSecondary}
      />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderLeftWidth: 4,
    padding: 14,
    gap: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: { alignItems: "flex-end" },
  dateText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  timeText: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  reason: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  headline: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  expandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  expandLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  details: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 100,
  },
  detailValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  commentRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  commentText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    fontStyle: "italic",
    lineHeight: 17,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  authorText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  deleteBtn: {
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF5F5",
  },
});
