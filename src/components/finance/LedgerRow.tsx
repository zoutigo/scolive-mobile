import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme";
import type { LedgerEntry } from "../../types/finance.types";

interface Props {
  item: LedgerEntry;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function LedgerRow({ item }: Props) {
  const isPending = item.status === "a-venir";

  return (
    <View style={styles.row} testID={`ledger-row-${item.id}`}>
      <View style={styles.left}>
        <Text style={styles.label} numberOfLines={2}>
          {item.label}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{item.date}</Text>
          {isPending && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>À venir</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.amounts}>
        <Text
          style={[
            styles.amount,
            item.debit > 0 ? styles.debit : styles.placeholder,
          ]}
        >
          {item.debit > 0 ? `- ${formatXaf(item.debit)}` : "—"}
        </Text>
        <Text
          style={[
            styles.amount,
            item.credit > 0 ? styles.credit : styles.placeholder,
          ]}
        >
          {item.credit > 0 ? `+ ${formatXaf(item.credit)}` : "—"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.warmHighlight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warmAccent,
  },
  amounts: {
    alignItems: "flex-end",
    gap: 2,
  },
  amount: {
    fontSize: 13,
    fontWeight: "600",
  },
  debit: {
    color: colors.notification,
  },
  credit: {
    color: colors.accentTeal,
  },
  placeholder: {
    color: colors.border,
  },
});
