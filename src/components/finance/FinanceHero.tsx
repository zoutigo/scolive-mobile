import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

interface Props {
  balance: number;
  pending: number;
  walletTotal: number;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FinanceHero({ balance, pending, walletTotal }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <KpiBlock
          icon="wallet-outline"
          label="Solde compte"
          value={formatXaf(balance)}
          valueColor={balance >= 0 ? colors.primary : colors.notification}
          testID="finance-hero-balance"
        />
        <View style={styles.divider} />
        <KpiBlock
          icon="time-outline"
          label="À venir"
          value={formatXaf(pending)}
          valueColor={colors.warmAccent}
          testID="finance-hero-pending"
        />
        <View style={styles.divider} />
        <KpiBlock
          icon="card-outline"
          label="Porte-monnaie"
          value={formatXaf(walletTotal)}
          valueColor={colors.primary}
          testID="finance-hero-wallet"
        />
      </View>
    </View>
  );
}

function KpiBlock({
  icon,
  label,
  value,
  valueColor,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor: string;
  testID?: string;
}) {
  return (
    <View style={styles.kpi} testID={testID}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  kpi: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  divider: {
    width: 1,
    backgroundColor: colors.warmBorder,
    marginVertical: 4,
  },
});
