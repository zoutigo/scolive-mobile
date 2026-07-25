import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
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
  index?: number;
  testID?: string;
}

export function UserCard({ user, onPress, index = 0, testID }: UserCardProps) {
  const fullName = `${user.lastName} ${user.firstName}`.trim();
  const cardBg = index % 2 === 1 ? colors.warmSurface : colors.surface;
  const accentColor = getStatusAccentColor(
    user.hasAccount,
    user.activationStatus,
  );
  const uniqueRoles = Array.from(new Set(user.roles)) as SchoolRole[];

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
  card: {
    flexDirection: "row",
    alignItems: "center",
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
