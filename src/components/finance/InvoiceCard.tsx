import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { Invoice } from "../../types/finance.types";

interface Props {
  item: Invoice;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_CONFIG: Record<
  Invoice["status"],
  { label: string; bg: string; text: string }
> = {
  payee: { label: "Payée", bg: "#E6F4F1", text: colors.accentTeal },
  "en-attente": {
    label: "En attente",
    bg: colors.warmHighlight,
    text: colors.warmAccent,
  },
  retard: { label: "Retard", bg: "#FDECEA", text: colors.notification },
};

export function InvoiceCard({ item }: Props) {
  const cfg = STATUS_CONFIG[item.status];

  return (
    <View style={styles.card} testID={`invoice-card-${item.id}`}>
      <View style={styles.top}>
        <View style={styles.docInfo}>
          <Ionicons
            name="document-text-outline"
            size={18}
            color={colors.primary}
          />
          <View style={styles.docText}>
            <Text style={styles.docName} numberOfLines={1}>
              {item.document}
            </Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.text }]}>
            {cfg.label}
          </Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.amount}>{formatXaf(item.amount)}</Text>
        <TouchableOpacity style={styles.dlBtn} activeOpacity={0.75}>
          <Ionicons name="download-outline" size={14} color={colors.primary} />
          <Text style={styles.dlLabel}>Télécharger</Text>
        </TouchableOpacity>
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
    gap: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  docInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  docText: {
    flex: 1,
    gap: 2,
  },
  docName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  dlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dlLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
});
