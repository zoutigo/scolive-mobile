import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { TicketListItem } from "../../types/tickets.types";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketTypeChip } from "./TicketTypeChip";

interface Props {
  ticket: TicketListItem;
  onPress: (ticket: TicketListItem) => void;
  testID?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TicketCard({ ticket, onPress, testID = "ticket-card" }: Props) {
  return (
    <TouchableOpacity
      testID={testID}
      style={styles.card}
      onPress={() => onPress(ticket)}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <TicketTypeChip type={ticket.type} />
        <TicketStatusBadge status={ticket.status} />
      </View>

      <Text style={styles.title} numberOfLines={2} testID={`${testID}-title`}>
        {ticket.title}
      </Text>

      <Text
        style={styles.description}
        numberOfLines={2}
        testID={`${testID}-description`}
      >
        {ticket.description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date} testID={`${testID}-date`}>
          {formatDate(ticket.createdAt)}
        </Text>
        <View style={styles.footerStats}>
          {ticket._count.responses > 0 && (
            <View style={styles.stat} testID={`${testID}-responses`}>
              <Ionicons
                name="chatbubble-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>{ticket._count.responses}</Text>
            </View>
          )}
          {ticket._count.votes > 0 && (
            <View style={styles.stat} testID={`${testID}-votes`}>
              <Ionicons
                name="thumbs-up-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>{ticket._count.votes}</Text>
            </View>
          )}
          {ticket.attachments.length > 0 && (
            <View style={styles.stat} testID={`${testID}-attachments`}>
              <Ionicons
                name="attach-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>{ticket.attachments.length}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  footerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
