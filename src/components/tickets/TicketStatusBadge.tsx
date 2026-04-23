import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme";
import type { TicketStatus } from "../../types/tickets.types";
import { TICKET_STATUS_LABELS } from "../../types/tickets.types";

const STATUS_STYLES: Record<
  TicketStatus,
  { bg: string; text: string; border: string }
> = {
  OPEN: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  IN_PROGRESS: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  ANSWERED: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  RESOLVED: { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
  CLOSED: { bg: "#F9FAFB", text: colors.textSecondary, border: "#E5E7EB" },
};

interface Props {
  status: TicketStatus;
  testID?: string;
}

export function TicketStatusBadge({
  status,
  testID = "ticket-status-badge",
}: Props) {
  const s = STATUS_STYLES[status];
  return (
    <View
      testID={testID}
      style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}
    >
      <Text style={[styles.label, { color: s.text }]}>
        {TICKET_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
