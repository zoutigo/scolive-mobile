import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useHeaderScroll } from "../navigation/header-scroll-context";
import { useTranslation } from "../../i18n/useTranslation";
import type { AuthUser } from "../../types/auth.types";
import { platformIndicatorsApi } from "../../api/platform-indicators.api";
import type {
  PlatformIndicators,
  ResourceApprovalIndicators,
} from "../../types/platform-indicators.types";

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

interface MiniStatCardProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function MiniStatCard({ icon, label, value, color }: MiniStatCardProps) {
  return (
    <View style={styles.miniStatCard}>
      <View style={[styles.miniStatIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as "home"} size={16} color={color} />
      </View>
      <View style={styles.statTexts}>
        <Text style={styles.miniStatValue}>{value}</Text>
        <Text style={styles.miniStatLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  );
}

interface ResourceKpiBlockProps {
  title: string;
  data: ResourceApprovalIndicators | undefined;
  t: (key: string) => string;
}

function ResourceKpiBlock({ title, data, t }: ResourceKpiBlockProps) {
  const fmt = (value: number | undefined) =>
    value === undefined ? "—" : String(value);

  return (
    <View style={styles.resourceBlock}>
      <Text style={styles.resourceBlockTitle}>{title}</Text>
      <View style={styles.miniStatsGrid}>
        <MiniStatCard
          icon="document-text-outline"
          label={t("home.platform.resources.kpi.withoutStatement")}
          value={fmt(data?.withoutStatement)}
          color={colors.notification}
        />
        <MiniStatCard
          icon="checkmark-done-outline"
          label={t("home.platform.resources.kpi.withoutCorrection")}
          value={fmt(data?.withoutCorrection)}
          color={colors.warmAccent}
        />
        <MiniStatCard
          icon="time-outline"
          label={t("home.platform.resources.kpi.statementsToApprove")}
          value={fmt(data?.statementsToApprove)}
          color={colors.accentTeal}
        />
        <MiniStatCard
          icon="shield-checkmark-outline"
          label={t("home.platform.resources.kpi.correctionsToApprove")}
          value={fmt(data?.correctionsToApprove)}
          color="#6B5EA8"
        />
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
  const { t } = useTranslation();
  const { onScroll } = useHeaderScroll();
  const platformRole = user.platformRoles[0];
  const roleColors: Record<string, string> = {
    SUPER_ADMIN: colors.notification,
    ADMIN: colors.primary,
    SALES: colors.accentTeal,
    SUPPORT: colors.warmAccent,
  };
  const roleLabelKeys: Record<string, string> = {
    SUPER_ADMIN: "home.hero.role.platformSuperAdmin",
    ADMIN: "home.hero.role.platformAdmin",
    SALES: "home.hero.role.platformSales",
    SUPPORT: "home.hero.role.platformSupport",
  };
  const badgeColor = platformRole
    ? (roleColors[platformRole] ?? colors.primary)
    : colors.primary;
  const roleLabel = platformRole
    ? t(roleLabelKeys[platformRole] ?? platformRole)
    : "";

  const [indicators, setIndicators] = useState<PlatformIndicators | null>(null);

  useEffect(() => {
    let cancelled = false;
    platformIndicatorsApi
      .getIndicators()
      .then((data) => {
        if (!cancelled) setIndicators(data);
      })
      .catch(() => {
        if (!cancelled) setIndicators(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = (value: number | undefined) =>
    value === undefined ? "—" : String(value);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Hero */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greeting} numberOfLines={1}>
            {t("home.hero.greeting")} {roleLabel}
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
      <Text style={styles.sectionTitle}>
        {t("home.platform.overview.title")}
      </Text>
      <View style={styles.statsRow}>
        <StatPill
          icon="business"
          label={t("home.platform.kpi.schools")}
          value={fmt(indicators?.schoolsCount)}
          color={colors.primary}
        />
        <StatPill
          icon="people"
          label={t("home.platform.kpi.users")}
          value={fmt(indicators?.usersCount)}
          color={colors.accentTeal}
        />
        <StatPill
          icon="person"
          label={t("home.platform.kpi.students")}
          value={fmt(indicators?.studentsCount)}
          color={colors.warmAccent}
        />
      </View>

      {/* Resource KPIs */}
      <Text style={styles.sectionTitle}>
        {t("home.platform.resources.title")}
      </Text>
      <View style={styles.resourcesRow}>
        <ResourceKpiBlock
          title={t("home.platform.resources.assessments.title")}
          data={indicators?.resources.assessments}
          t={t}
        />
        <ResourceKpiBlock
          title={t("home.platform.resources.exams.title")}
          data={indicators?.resources.exams}
          t={t}
        />
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>
        {t("home.platform.quickAccess.title")}
      </Text>
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
    overflow: "hidden",
  },
  bannerLeft: { flex: 1, minWidth: 0 },
  bannerIcon: { flexShrink: 0, marginLeft: 10, opacity: 0.7 },
  greeting: {
    fontSize: 17,
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

  resourcesRow: {
    gap: 12,
    marginBottom: 20,
  },
  resourceBlock: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
  },
  resourceBlockTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  miniStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  miniStatCard: {
    width: "47.5%",
    backgroundColor: colors.warmSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  miniStatValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  miniStatLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
    lineHeight: 12,
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
