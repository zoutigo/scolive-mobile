import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";

interface Props {
  balance: number;
  onPress: () => void;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function WalletSummaryLinkCard({ balance, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.card} testID="wallet-summary-card">
      <View style={styles.iconWrap}>
        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>{t("reinscription.wallet.balance")}</Text>
        <Text style={styles.balance}>{formatXaf(balance)}</Text>
      </View>
      <TouchableOpacity
        style={styles.link}
        onPress={onPress}
        testID="wallet-summary-topup-link"
      >
        <Text style={styles.linkText}>
          {t("reinscription.wallet.topUpLink")}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  label: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  balance: { fontSize: 20, fontWeight: "700", color: colors.primary },
  link: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  linkText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
