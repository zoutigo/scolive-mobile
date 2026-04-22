import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { WalletEntry } from "../../types/finance.types";

interface Props {
  item: WalletEntry;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function WalletCard({ item }: Props) {
  const pct = item.cap > 0 ? Math.min(item.balance / item.cap, 1) : 0;
  const fillColor =
    pct > 0.7
      ? colors.accentTeal
      : pct > 0.3
        ? colors.warmAccent
        : colors.notification;

  return (
    <View style={styles.card} testID={`wallet-card-${item.id}`}>
      <View style={styles.header}>
        <Ionicons name="card-outline" size={20} color={colors.primary} />
        <Text style={styles.label}>{item.label}</Text>
      </View>
      <Text style={styles.balance}>{formatXaf(item.balance)}</Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${pct * 100}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.cap}>Plafond : {formatXaf(item.cap)}</Text>
        <Text style={styles.lastOp}>Dernière op. : {item.lastOperation}</Text>
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
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  balance: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cap: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  lastOp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
