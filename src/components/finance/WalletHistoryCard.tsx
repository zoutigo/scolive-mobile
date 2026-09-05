import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { WalletTransactionEntry } from "../../types/finance.types";

interface Props {
  transactions: WalletTransactionEntry[];
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export function WalletHistoryCard({ transactions }: Props) {
  const { t } = useTranslation();

  if (transactions.length === 0) return null;

  return (
    <View style={styles.card} testID="wallet-history-card">
      <Text style={styles.title}>{t("finSituation.walletHistory.title")}</Text>
      {transactions.map((entry) => (
        <View
          key={entry.id}
          style={styles.row}
          testID={`wallet-history-row-${entry.id}`}
        >
          <View style={styles.rowLeft}>
            <Ionicons
              name={
                entry.type === "TOPUP" ? "add-circle-outline" : "school-outline"
              }
              size={18}
              color={colors.primary}
            />
            <View>
              <Text style={styles.label}>
                {entry.type === "TOPUP"
                  ? t("finSituation.wallet.transaction.topUp")
                  : t("finSituation.wallet.transaction.allocation")}
              </Text>
              <Text style={styles.date}>
                {formatDate(entry.createdAt)}
                {entry.note ? ` - ${entry.note}` : ""}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.amount,
              entry.type === "TOPUP"
                ? styles.amountTopUp
                : styles.amountNeutral,
            ]}
          >
            {entry.type === "TOPUP" ? "+" : "-"}
            {formatXaf(entry.amount)}
          </Text>
        </View>
      ))}
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
  title: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  date: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 13, fontWeight: "700" },
  amountTopUp: { color: colors.primary },
  amountNeutral: { color: colors.textPrimary },
});
