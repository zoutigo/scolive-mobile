import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { AuthUser } from "../../types/auth.types";

interface PlatformHomeProps {
  user: AuthUser;
}

interface StatPillProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function StatPill({ icon, label, value, color }: StatPillProps) {
  return (
    <View style={[styles.statPill, { borderLeftColor: color }]}>
      <Ionicons name={icon as "home"} size={20} color={color} />
      <View style={styles.statTexts}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

interface ActionCardProps {
  icon: string;
  label: string;
  subtitle: string;
  color: string;
}

function ActionCard({ icon, label, subtitle, color }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as "home"} size={24} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export function PlatformHome({ user }: PlatformHomeProps) {
  const platformRole = user.platformRoles[0];
  const roleColors: Record<string, string> = {
    SUPER_ADMIN: colors.notification,
    ADMIN: colors.primary,
    SALES: colors.accentTeal,
    SUPPORT: colors.warmAccent,
  };
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super administrateur",
    ADMIN: "Administrateur",
    SALES: "Commercial",
    SUPPORT: "Support",
  };
  const badgeColor = platformRole
    ? (roleColors[platformRole] ?? colors.primary)
    : colors.primary;
  const roleLabel = platformRole
    ? (roleLabels[platformRole] ?? platformRole)
    : "";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.bannerName}>
            {user.firstName} {user.lastName}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>
        <View style={styles.bannerIcon}>
          <Ionicons
            name="shield-checkmark"
            size={42}
            color={colors.primary + "30"}
          />
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
      <View style={styles.statsRow}>
        <StatPill
          icon="business"
          label="Écoles"
          value="—"
          color={colors.primary}
        />
        <StatPill
          icon="people"
          label="Utilisateurs"
          value="—"
          color={colors.accentTeal}
        />
        <StatPill
          icon="person"
          label="Élèves"
          value="—"
          color={colors.warmAccent}
        />
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Accès rapides</Text>
      <View style={styles.actionsGrid}>
        <ActionCard
          icon="business-outline"
          label="Gérer les écoles"
          subtitle="Réseau d'établissements"
          color={colors.primary}
        />
        <ActionCard
          icon="people-outline"
          label="Utilisateurs"
          subtitle="Comptes et accès"
          color={colors.accentTeal}
        />
        <ActionCard
          icon="book-outline"
          label="Classes"
          subtitle="Organisation scolaire"
          color={colors.warmAccent}
        />
        <ActionCard
          icon="bar-chart-outline"
          label="Indicateurs"
          subtitle="Statistiques plateforme"
          color="#6B5EA8"
        />
        <ActionCard
          icon="person-add-outline"
          label="Inscriptions"
          subtitle="Gestion des dossiers"
          color="#3A8FAF"
        />
        <ActionCard
          icon="layers-outline"
          label="Curriculums"
          subtitle="Programmes scolaires"
          color="#5E8A3A"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },

  banner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  bannerLeft: { flex: 1 },
  bannerIcon: { opacity: 0.7 },
  greeting: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bannerName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  roleBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderLeftWidth: 3,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statTexts: { flex: 1 },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    lineHeight: 18,
  },
  actionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
