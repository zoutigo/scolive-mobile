import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

function initials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export function ChildReenrollmentCard({
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
  const hasPromotion = Boolean(
    item.nextAcademicLevelLabel &&
    (item.previousLevelLabel || item.previousClassLabel),
  );

  return (
    <View
      style={[
        styles.card,
        isReady && styles.cardReady,
        isConfirmed && styles.cardConfirmed,
      ]}
      testID={`child-reenrollment-card-${item.student.id}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials(item.student.firstName, item.student.lastName)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {item.student.firstName} {item.student.lastName}
          </Text>
          {hasPromotion ? (
            <Text style={styles.promotion} numberOfLines={1}>
              {item.previousLevelLabel ?? item.previousClassLabel ?? "—"}
              {"  →  "}
              {item.nextAcademicLevelLabel}
            </Text>
          ) : null}
        </View>
        {isConfirmed ? (
          <View style={styles.confirmedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#166534" />
            <Text style={styles.confirmedBadgeText}>
              {t("finSituation.children.status.ALREADY_REINSCRIBED")}
            </Text>
          </View>
        ) : null}
      </View>

      {item.student.dateOfBirth ? (
        <Text style={styles.meta}>
          {t("finSituation.children.dateOfBirth").replace(
            "{date}",
            formatDate(item.student.dateOfBirth),
          )}
        </Text>
      ) : null}

      {!isConfirmed ? (
        <View
          style={[styles.statusBanner, isReady && styles.statusBannerReady]}
        >
          <Text
            style={[
              styles.statusBannerText,
              isReady && styles.statusBannerTextReady,
            ]}
          >
            {t(`finSituation.children.status.${item.status}`)}
          </Text>
        </View>
      ) : null}

      {isReady ? (
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>
            {t("finSituation.children.required")}
          </Text>
          <Text style={styles.amountValue}>
            {formatXaf(required)}
            {item.targetSchoolYearLabel
              ? ` · ${item.targetSchoolYearLabel}`
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

          {item.targetSchoolYearStartsAt ? (
            <Text style={styles.schoolYearStart}>
              {t("finSituation.children.schoolYearStart").replace(
                "{date}",
                formatDate(item.targetSchoolYearStartsAt),
              )}
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
        </View>
      ) : null}

      {isConfirmed ? (
        <View style={styles.confirmedBlock}>
          <Text style={styles.confirmedTitle}>
            {t("finSituation.children.confirmed.title")}
          </Text>
          <Text style={styles.confirmedMessage}>
            {t("finSituation.children.confirmed.message")}
          </Text>
          {item.targetSchoolYearStartsAt ? (
            <Text style={styles.confirmedMessage}>
              {t("finSituation.children.schoolYearStart").replace(
                "{date}",
                formatDate(item.targetSchoolYearStartsAt),
              )}
            </Text>
          ) : null}
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
    gap: 10,
  },
  cardReady: {
    borderColor: colors.warmAccent,
  },
  cardConfirmed: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  confirmedBadge: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  promotion: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBanner: {
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusBannerReady: {
    backgroundColor: "#FEF3C7",
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statusBannerTextReady: {
    color: "#92400E",
  },
  amountBlock: {
    borderRadius: 10,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  deadline: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  deadlineUrgent: {
    color: "#991B1B",
  },
  schoolYearStart: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  insufficientBalance: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991B1B",
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    padding: 8,
    marginTop: 2,
  },
  button: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
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
