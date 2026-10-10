import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  SchoolMember,
  SchoolRole,
  UserActivationStatus,
} from "../../types/users.types";

const ROLE_LABELS: Record<SchoolRole, string> = {
  SCHOOL_ADMIN: "Admin",
  SCHOOL_MANAGER: "Directeur",
  SUPERVISOR: "Superviseur",
  SCHOOL_ACCOUNTANT: "Comptable",
  SCHOOL_STAFF: "Personnel",
  SCHOOL_HEALTH_OFFICER: "Responsable santé",
  TEACHER: "Enseignant",
  PARENT: "Parent",
  STUDENT: "Élève",
};

const ROLE_COLORS: Record<SchoolRole, { bg: string; text: string }> = {
  SCHOOL_ADMIN: { bg: "#08467D", text: "#FFFFFF" },
  SCHOOL_MANAGER: { bg: "#195E56", text: "#FFFFFF" },
  SUPERVISOR: { bg: "#7B4EA0", text: "#FFFFFF" },
  SCHOOL_ACCOUNTANT: { bg: "#2E7D62", text: "#FFFFFF" },
  SCHOOL_STAFF: { bg: "#5F5A52", text: "#FFFFFF" },
  SCHOOL_HEALTH_OFFICER: { bg: "#B3261E", text: "#FFFFFF" },
  TEACHER: { bg: "#247C72", text: "#FFFFFF" },
  PARENT: { bg: "#D89B5B", text: "#FFFFFF" },
  STUDENT: { bg: "#B85C2E", text: "#FFFFFF" },
};

const NO_ACCOUNT_ACCENT = "#C0392B";

// Card left-edge accent: sole signal for account/activation status — no
// account gets a red-leaning border, distinct from the amber used for a
// pending account, so the two states never look alike at a glance.
function getStatusAccentColor(
  hasAccount: boolean,
  activationStatus: UserActivationStatus | null,
): string | null {
  if (!hasAccount) return NO_ACCOUNT_ACCENT;
  if (activationStatus === "PENDING") return colors.warmAccent;
  if (activationStatus === "SUSPENDED") return colors.notification;
  return null;
}

function RoleDot({
  role,
  userId,
  isPrimary,
}: {
  role: SchoolRole;
  userId: string;
  isPrimary: boolean;
}) {
  const badge = ROLE_COLORS[role] ?? { bg: colors.primary, text: "#FFFFFF" };
  return (
    <View
      style={[styles.roleDot, { backgroundColor: badge.bg }]}
      accessibilityLabel={ROLE_LABELS[role] ?? role}
      testID={
        isPrimary
          ? `user-card-primary-role-${userId}`
          : `user-card-role-dot-${role}-${userId}`
      }
    />
  );
}

interface UserCardProps {
  user: SchoolMember;
  onPress: (user: SchoolMember) => void;
  /** Action « Inviter dans l'école » d'une carte de membre exclu. */
  onReinvite?: (user: SchoolMember) => void;
  reinviting?: boolean;
  index?: number;
  testID?: string;
}

const EXCLUDED_ACCENT = "#B42318";

export function UserCard({
  user,
  onPress,
  onReinvite,
  reinviting = false,
  index = 0,
  testID,
}: UserCardProps) {
  const { t } = useTranslation();
  const fullName = `${user.lastName} ${user.firstName}`.trim();
  const cardBg = index % 2 === 1 ? colors.warmSurface : colors.surface;
  const accentColor = getStatusAccentColor(
    user.hasAccount,
    user.activationStatus,
  );
  const uniqueRoles = Array.from(new Set(user.roles)) as SchoolRole[];

  // Membre exclu : carte atténuée, non ouvrable ; seule action : réinviter.
  if (user.excluded) {
    return (
      <View
        style={[styles.excludedCard]}
        testID={testID ?? `user-card-${user.id}`}
        accessibilityState={{ disabled: true }}
      >
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.excludedName} numberOfLines={1}>
              {fullName}
            </Text>
            <View style={styles.excludedBadge}>
              <Text style={styles.excludedBadgeText}>
                {t("users.excluded.badge")}
              </Text>
            </View>
          </View>
          <View style={styles.roleDotsRow}>
            {uniqueRoles.map((role, i) => (
              <RoleDot
                key={role}
                role={role}
                userId={user.id}
                isPrimary={i === 0}
              />
            ))}
          </View>
          <Text
            style={styles.excludedSince}
            testID={`user-excluded-since-${user.id}`}
          >
            {t("users.excluded.since").replace(
              "{date}",
              user.excludedAt
                ? new Date(user.excludedAt).toLocaleDateString()
                : "—",
            )}
          </Text>
          {user.exclusionReason ? (
            <Text style={styles.contactText}>
              {t("users.excluded.reason").replace(
                "{reason}",
                user.exclusionReason,
              )}
            </Text>
          ) : null}
          {onReinvite ? (
            <TouchableOpacity
              style={[
                styles.reinviteButton,
                reinviting && styles.reinviteButtonDisabled,
              ]}
              onPress={() => onReinvite(user)}
              disabled={reinviting}
              testID={`action-reinvite-${user.id}`}
              accessibilityRole="button"
              accessibilityLabel={t("users.actions.reinvite")}
            >
              <Ionicons
                name="person-add-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.reinviteButtonText}>
                {t("users.actions.reinvite")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cardBg },
        accentColor
          ? { borderLeftWidth: 3, borderLeftColor: accentColor }
          : null,
      ]}
      onPress={() => onPress(user)}
      activeOpacity={0.75}
      testID={testID ?? `user-card-${user.id}`}
    >
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>

          <View
            style={styles.roleDotsRow}
            testID={`user-card-role-dots-${user.id}`}
          >
            {uniqueRoles.map((role, i) => (
              <RoleDot
                key={role}
                role={role}
                userId={user.id}
                isPrimary={i === 0}
              />
            ))}
          </View>
        </View>

        {user.email ? (
          <View style={styles.contactRow}>
            <Ionicons
              name="mail-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={styles.contactText} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        ) : null}

        {user.phone ? (
          <View style={styles.contactRow}>
            <Ionicons
              name="call-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={styles.contactText}>{user.phone}</Text>
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export { ROLE_LABELS, ROLE_COLORS };

const styles = StyleSheet.create({
  excludedCard: {
    marginHorizontal: 16,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FEF3F2",
    borderLeftWidth: 3,
    borderLeftColor: EXCLUDED_ACCENT,
  },
  excludedName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    flex: 1,
    textDecorationLine: "line-through",
  },
  excludedBadge: {
    backgroundColor: `${EXCLUDED_ACCENT}1A`,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  excludedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: EXCLUDED_ACCENT,
  },
  excludedSince: {
    fontSize: 12,
    fontWeight: "600",
    color: EXCLUDED_ACCENT,
    marginTop: 2,
  },
  reinviteButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.primary}55`,
    backgroundColor: `${colors.primary}10`,
  },
  reinviteButtonDisabled: {
    opacity: 0.5,
  },
  reinviteButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  roleDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  roleDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  contactText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
});
