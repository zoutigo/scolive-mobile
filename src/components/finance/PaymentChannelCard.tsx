import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { PaymentChannel } from "../../types/finance.types";

interface Props {
  item: PaymentChannel;
}

const ICON: Record<PaymentChannel["type"], keyof typeof Ionicons.glyphMap> = {
  "mobile-money": "phone-portrait-outline",
  cash: "cash-outline",
};

export function PaymentChannelCard({ item }: Props) {
  const isActive = item.status === "actif";

  return (
    <View style={styles.card} testID={`payment-channel-${item.id}`}>
      <View style={styles.left}>
        <View
          style={[
            styles.iconWrap,
            isActive ? styles.iconActive : styles.iconInactive,
          ]}
        >
          <Ionicons
            name={ICON[item.type]}
            size={20}
            color={isActive ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>{item.label}</Text>
          {item.number ? (
            <Text style={styles.number}>{item.number}</Text>
          ) : null}
        </View>
      </View>
      <View
        style={[
          styles.statusBadge,
          isActive ? styles.statusActive : styles.statusInactive,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            isActive ? styles.statusTextActive : styles.statusTextInactive,
          ]}
        >
          {isActive ? "Actif" : "Inactif"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconActive: {
    backgroundColor: "#EAF4FF",
  },
  iconInactive: {
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  number: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: "#E6F4F1",
  },
  statusInactive: {
    backgroundColor: colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusTextActive: {
    color: colors.accentTeal,
  },
  statusTextInactive: {
    color: colors.textSecondary,
  },
});
