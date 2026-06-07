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

function StatusDot({ status }: { status: UserActivationStatus }) {
  const dotColor =
    status === "ACTIVE"
      ? colors.accentTeal
      : status === "PENDING"
        ? colors.warmAccent
        : colors.notification;
  return <View style={[styles.statusDot, { backgroundColor: dotColor }]} />;
}

function NoAccountBadge() {
  return (
    <View style={styles.noAccountBadge}>
      <Text style={styles.noAccountBadgeText}>Sans compte</Text>
    </View>
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

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg }]}
      onPress={() => onPress(user)}
      activeOpacity={0.75}
      testID={testID ?? `user-card-${user.id}`}
    >
      {/* Colonne de badges rôles à gauche */}
      <View
        style={styles.rolesLeft}
        testID={`user-card-role-column-${user.id}`}
      >
        {user.roles.map((role, i) => {
          const badge = ROLE_COLORS[role as SchoolRole] ?? {
            bg: colors.primary,
            text: "#FFFFFF",
          };
          return (
            <View
              key={role}
              style={[styles.roleBadge, { backgroundColor: badge.bg }]}
              testID={i === 0 ? `user-card-primary-role-${user.id}` : undefined}
            >
              <Text style={styles.roleBadgeText} numberOfLines={1}>
                {ROLE_LABELS[role as SchoolRole] ?? role}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Infos */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName}
          </Text>
          {user.hasAccount ? (
            <StatusDot status={user.activationStatus} />
          ) : (
            <NoAccountBadge />
          )}
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
  rolesLeft: {
    width: 66,
    alignItems: "stretch",
    gap: 3,
    flexShrink: 0,
  },
  roleBadge: {
    width: 66,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  noAccountBadge: {
    backgroundColor: "#C0B6AC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  noAccountBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
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
