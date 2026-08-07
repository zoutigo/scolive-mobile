import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import type { ChildFinanceStatus } from "../../types/finance.types";

interface Props {
  item: ChildFinanceStatus;
  walletBalance: number;
  submitting: boolean;
  onPayAndReinscribe: (item: ChildFinanceStatus) => void;
  tourTargetId?: string;
}

function formatXaf(amount: number): string {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ChildFinanceCard({
  item,
  walletBalance,
  submitting,
  onPayAndReinscribe,
  tourTargetId,
}: Props) {
  const { t } = useTranslation();
  const required = item.requiredAmount ?? 0;
  const canReinscribe =
    item.status === "READY_TO_REINSCRIBE" &&
    walletBalance >= required &&
    !submitting;

  return (
    <View style={styles.card} testID={`child-finance-card-${item.student.id}`}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>
          {item.student.firstName} {item.student.lastName}
        </Text>
        <View
          style={[
            styles.badge,
            item.status === "ALREADY_REINSCRIBED"
              ? styles.badgeOk
              : item.status === "READY_TO_REINSCRIBE"
                ? styles.badgeWarn
                : styles.badgeNeutral,
          ]}
        >
          <Text style={styles.badgeText}>
            {t(`finSituation.children.status.${item.status}`)}
          </Text>
        </View>
      </View>

      {item.status === "READY_TO_REINSCRIBE" ? (
        <>
          <Text style={styles.required}>
            {t("finSituation.children.required")} {formatXaf(required)}
            {item.targetSchoolYearLabel
              ? ` (${item.targetSchoolYearLabel})`
              : ""}
          </Text>
          <ReinscribeButton
            tourTargetId={tourTargetId}
            canReinscribe={canReinscribe}
            onPress={() => onPayAndReinscribe(item)}
            testID={`pay-and-reinscribe-${item.student.id}`}
            label={t("finSituation.children.payAndReinscribe")}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeOk: { backgroundColor: "#DCFCE7" },
  badgeWarn: { backgroundColor: "#FEF3C7" },
  badgeNeutral: { backgroundColor: colors.background },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  required: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  button: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});

function ReinscribeButton({
  tourTargetId,
  canReinscribe,
  onPress,
  testID,
  label,
}: {
  tourTargetId?: string;
  canReinscribe: boolean;
  onPress: () => void;
  testID: string;
  label: string;
}) {
  const button = (
    <TouchableOpacity
      style={[styles.button, !canReinscribe && styles.buttonDisabled]}
      disabled={!canReinscribe}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  if (!tourTargetId) return button;
  return <OnboardingTarget id={tourTargetId}>{button}</OnboardingTarget>;
}
