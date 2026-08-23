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
  onViewSupplies?: () => void;
  tourTargetId?: string;
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

function daysUntil(value: string): number {
  const deadline = new Date(value);
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil(
    (Date.UTC(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      msPerDay,
  );
}

export function ChildFinanceCard({
  item,
  walletBalance,
  submitting,
  onPayAndReinscribe,
  onViewSupplies,
  tourTargetId,
}: Props) {
  const { t } = useTranslation();
  const required = item.requiredAmount ?? 0;
  const isReady = item.status === "READY_TO_REINSCRIBE";
  const isConfirmed = item.status === "ALREADY_REINSCRIBED";
  const insufficientBalance = isReady && walletBalance < required;
  const canReinscribe = isReady && !insufficientBalance && !submitting;
  const daysLeft = item.reinscriptionDeadline
    ? daysUntil(item.reinscriptionDeadline)
    : null;

  return (
    <View
      style={[styles.card, isConfirmed && styles.cardConfirmed]}
      testID={`child-finance-card-${item.student.id}`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={2}>
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

      {item.student.dateOfBirth ? (
        <Text style={styles.meta}>
          {t("finSituation.children.dateOfBirth").replace(
            "{date}",
            formatDate(item.student.dateOfBirth),
          )}
        </Text>
      ) : null}

      {item.nextAcademicLevelLabel ? (
        <Text style={styles.meta}>
          {item.previousLevelLabel ?? item.previousClassLabel ?? "—"}
          {"  →  "}
          {item.nextAcademicLevelLabel}
        </Text>
      ) : null}

      {isReady ? (
        <>
          <Text style={styles.required}>
            {t("finSituation.children.required")} {formatXaf(required)}
            {item.targetSchoolYearLabel
              ? ` (${item.targetSchoolYearLabel})`
              : ""}
          </Text>

          {daysLeft !== null ? (
            <Text
              style={[styles.deadline, daysLeft <= 3 && styles.deadlineUrgent]}
            >
              {daysLeft >= 0
                ? t("finSituation.children.daysLeft").replace(
                    "{count}",
                    String(daysLeft),
                  )
                : t("finSituation.children.deadlinePassed")}
              {" — "}
              {formatDate(item.reinscriptionDeadline as string)}
            </Text>
          ) : null}

          {insufficientBalance ? (
            <Text
              style={styles.insufficientBalance}
              testID={`insufficient-balance-${item.student.id}`}
            >
              {t("finSituation.children.insufficientBalance").replace(
                "{amount}",
                formatXaf(required - walletBalance),
              )}
            </Text>
          ) : null}

          <ReinscribeButton
            tourTargetId={tourTargetId}
            canReinscribe={canReinscribe}
            onPress={() => onPayAndReinscribe(item)}
            testID={`pay-and-reinscribe-${item.student.id}`}
            label={t("finSituation.children.payAndReinscribe")}
          />
        </>
      ) : null}

      {isConfirmed ? (
        <View style={styles.confirmedBlock}>
          <Text style={styles.confirmedTitle}>
            {t("finSituation.children.confirmed.title")}
          </Text>
          <Text style={styles.confirmedMessage}>
            {t("finSituation.children.confirmed.message")}
          </Text>
          {onViewSupplies ? (
            <TouchableOpacity
              onPress={onViewSupplies}
              testID={`view-supplies-${item.student.id}`}
            >
              <Text style={styles.confirmedLink}>
                {t("finSituation.children.confirmed.viewSupplies")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
    gap: 6,
  },
  cardConfirmed: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
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
    marginTop: 4,
  },
  deadline: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  deadlineUrgent: {
    color: "#991B1B",
  },
  insufficientBalance: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991B1B",
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    padding: 8,
  },
  button: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
  confirmedBlock: {
    marginTop: 4,
    gap: 4,
  },
  confirmedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
  },
  confirmedMessage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  confirmedLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentTealDark,
    marginTop: 2,
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
