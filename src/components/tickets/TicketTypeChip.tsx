import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { TicketType } from "../../types/tickets.types";
import { TICKET_TYPE_LABELS } from "../../types/tickets.types";

interface Props {
  type: TicketType;
  testID?: string;
}

export function TicketTypeChip({ type, testID = "ticket-type-chip" }: Props) {
  const isBug = type === "BUG";
  return (
    <View
      testID={testID}
      style={[styles.chip, isBug ? styles.bugChip : styles.featureChip]}
    >
      <Ionicons
        name={isBug ? "bug-outline" : "bulb-outline"}
        size={11}
        color={isBug ? colors.notification : colors.warmAccent}
      />
      <Text style={[styles.label, isBug ? styles.bugText : styles.featureText]}>
        {TICKET_TYPE_LABELS[type]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bugChip: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  featureChip: {
    backgroundColor: colors.warmSurface,
    borderColor: colors.warmBorder,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
  },
  bugText: { color: colors.notification },
  featureText: { color: colors.warmAccent },
});
