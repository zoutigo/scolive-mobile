import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { financeApi } from "../../api/finance.api";
import type {
  ChildInstallmentBreakdown,
  InstallmentStatus,
} from "../../types/finance.types";

interface Props {
  studentId: string;
  schoolYearId: string;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) return "";
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

const STATUS_STYLES: Record<InstallmentStatus, { bg: string; color: string }> =
  {
    PAID: { bg: "#DCFCE7", color: "#166534" },
    PARTIAL: { bg: "#FEF3C7", color: "#92400E" },
    OVERDUE: { bg: "#FEE2E2", color: "#991B1B" },
    UPCOMING: { bg: "#F1F5F9", color: "#475569" },
  };

export function InstallmentBreakdownCard({ studentId, schoolYearId }: Props) {
  const { t } = useTranslation();
  const { schoolSlug } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [breakdown, setBreakdown] = useState<ChildInstallmentBreakdown | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!expanded && !breakdown && schoolSlug) {
      setLoading(true);
      try {
        const result = await financeApi.getMyChildInstallmentBreakdown(
          schoolSlug,
          studentId,
          schoolYearId,
        );
        setBreakdown(result);
      } catch {
        setBreakdown(null);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((value) => !value);
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={toggle}
        testID={`installment-toggle-${studentId}`}
      >
        <Text style={styles.toggleLabel}>
          {expanded
            ? t("reinscription.installments.hide")
            : t("reinscription.installments.show")}
        </Text>
      </TouchableOpacity>

      {expanded ? (
        loading ? (
          <Text style={styles.loading}>{t("common.loading")}</Text>
        ) : breakdown ? (
          <View style={styles.list} testID={`installment-list-${studentId}`}>
            {breakdown.installments.map((installment) => {
              const statusStyle = STATUS_STYLES[installment.status];
              return (
                <View
                  key={installment.id}
                  style={styles.row}
                  testID={`installment-row-${studentId}-${installment.rank}`}
                >
                  <View style={styles.rowMain}>
                    <Text style={styles.rowLabel}>
                      {installment.rank}. {installment.label}
                    </Text>
                    {installment.dueDate ? (
                      <Text style={styles.rowDueDate}>
                        {t("reinscription.installments.dueDate")}{" "}
                        {formatDate(installment.dueDate)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowAmount}>
                      {formatXaf(installment.amount)}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: statusStyle.color }]}
                      >
                        {t(
                          `reinscription.installments.status.${installment.status}`,
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.loading}>
            {t("reinscription.installments.error")}
          </Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  toggleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accentTealDark,
  },
  loading: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  list: { marginTop: 8, gap: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  rowMain: { flex: 1, gap: 2 },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowDueDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
