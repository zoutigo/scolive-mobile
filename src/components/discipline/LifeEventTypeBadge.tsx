import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DISCIPLINE_TYPE_CONFIG,
  type StudentLifeEventType,
} from "../../types/discipline.types";

interface Props {
  type: StudentLifeEventType;
  size?: "sm" | "md";
}

export function LifeEventTypeBadge({ type, size = "md" }: Props) {
  const cfg = DISCIPLINE_TYPE_CONFIG[type];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg },
        isSmall && styles.badgeSm,
      ]}
      testID={`badge-${type}`}
      accessibilityLabel={cfg.label}
    >
      <Ionicons
        name={cfg.icon as "time-outline"}
        size={isSmall ? 11 : 13}
        color={cfg.text}
      />
      <Text
        style={[styles.label, { color: cfg.text }, isSmall && styles.labelSm]}
      >
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelSm: {
    fontSize: 11,
  },
});
