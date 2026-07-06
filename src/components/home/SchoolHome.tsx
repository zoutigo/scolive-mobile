import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useHeaderScroll } from "../navigation/header-scroll-context";
import { useTranslation } from "../../i18n/useTranslation";
import { dashboardApi } from "../../api/dashboard.api";
import type { AuthUser, SchoolRole } from "../../types/auth.types";
import type { SchoolDashboardKpis } from "../../types/dashboard.types";

interface SchoolHomeProps {
  user: AuthUser;
  schoolSlug: string | null;
}

const ROLE_LABEL_KEYS: Partial<Record<SchoolRole, string>> = {
  SCHOOL_ADMIN: "home.hero.role.schoolAdmin",
  SCHOOL_MANAGER: "home.hero.role.schoolManager",
  SUPERVISOR: "home.hero.role.supervisor",
  SCHOOL_ACCOUNTANT: "home.hero.role.accountant",
  SCHOOL_STAFF: "home.hero.role.staff",
};

interface QuickLinkProps {
  icon: string;
  label: string;
  color: string;
  count?: string;
  onPress?: () => void;
}

function QuickLink({ icon, label, color, count, onPress }: QuickLinkProps) {
  return (
    <TouchableOpacity
      style={styles.quickLink}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[styles.qlIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as "home"} size={22} color={color} />
      </View>
      <Text style={styles.qlLabel}>{label}</Text>
      {count !== undefined && (
        <View style={[styles.qlBadge, { backgroundColor: color }]}>
          <Text style={styles.qlBadgeText}>{count}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function SchoolHome({ user, schoolSlug }: SchoolHomeProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { onScroll } = useHeaderScroll();
  const role = (user.activeRole ?? user.role) as SchoolRole | null;
  const roleLabelKey = role ? ROLE_LABEL_KEYS[role] : undefined;
  const roleLabel = roleLabelKey ? t(roleLabelKey) : (role ?? "");
  const [kpis, setKpis] = useState<SchoolDashboardKpis | null>(null);

  useEffect(() => {
    if (!schoolSlug) return;
    let cancelled = false;
    dashboardApi
      .getSchoolKpis(schoolSlug)
      .then((data) => {
        if (!cancelled) setKpis(data);
      })
      .catch(() => {
        if (!cancelled) setKpis(null);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolSlug]);

  const dashboardTitle = kpis?.academicYear
    ? t("home.school.dashboard.title").replace(
        "{year}",
        kpis.academicYear.label,
      )
    : t("home.school.dashboard.title").replace("{year}", "").trim();

  const statCards = [
    {
      icon: "book",
      label: t("home.school.kpi.classes"),
      value: kpis?.classesCount,
      color: colors.primary,
    },
    {
      icon: "people",
      label: t("home.school.kpi.students"),
      value: kpis?.studentsCount,
      color: colors.accentTeal,
    },
    {
      icon: "school",
      label: t("home.school.kpi.teachers"),
      value: kpis?.teachersCount,
      color: colors.warmAccent,
    },
    {
      icon: "heart",
      label: t("home.school.kpi.parents"),
      value: kpis?.parentsCount,
      color: "#6B5EA8",
    },
    {
      icon: "book-outline",
      label: t("home.school.kpi.subjects"),
      value: kpis?.subjectsCount,
      color: "#3A8FAF",
    },
    {
      icon: "business",
      label: t("home.school.kpi.rooms"),
      value: kpis?.roomsCount,
      color: "#D08B3A",
    },
  ] as const;

  function handleQuickLinkPress(label: string) {
    if (label === "Fil d'actualité") {
      router.push("/(home)/feed");
      return;
    }

    if (label === "Messagerie") {
      router.push("/(home)/messages");
      return;
    }

    if (label === "Emploi du temps") {
      router.push("/(home)/timetable");
      return;
    }

    if (label === "Notes") {
      router.push("/(home)/notes");
    }
  }

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
        <Text style={styles.greeting} numberOfLines={1}>
          {t("home.hero.greeting")} {roleLabel}
        </Text>
        <View style={[styles.rolePill, { backgroundColor: colors.primary }]}>
          <Text style={styles.rolePillText}>{roleLabel}</Text>
        </View>
      </View>

      {/* Stats grid */}
      <Text style={styles.sectionTitle}>{dashboardTitle}</Text>
      <View style={styles.statsGrid}>
        {statCards.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.statCard}
            activeOpacity={0.75}
          >
            <View
              style={[styles.statCardIcon, { backgroundColor: s.color + "18" }]}
            >
              <Ionicons name={s.icon as "home"} size={22} color={s.color} />
            </View>
            <View style={styles.statCardTextWrap}>
              <Text style={styles.statCardLabel} numberOfLines={1}>
                {s.label}
              </Text>
              <Text style={styles.statCardValue}>
                {s.value === undefined ? "—" : s.value}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick access */}
      <Text style={styles.sectionTitle}>Navigation rapide</Text>
      <View style={styles.quickLinks}>
        <QuickLink
          icon="calendar-outline"
          label="Emploi du temps"
          color={colors.primary}
          onPress={() => handleQuickLinkPress("Emploi du temps")}
        />
        <QuickLink
          icon="newspaper-outline"
          label="Fil d'actualité"
          color={colors.accentTeal}
          onPress={() => handleQuickLinkPress("Fil d'actualité")}
        />
        <QuickLink
          icon="people-outline"
          label="Élèves"
          color={colors.accentTeal}
        />
        <QuickLink
          icon="ribbon-outline"
          label="Notes"
          color={colors.warmAccent}
          onPress={() => handleQuickLinkPress("Notes")}
        />
        <QuickLink
          icon="chatbubble-outline"
          label="Messagerie"
          color="#6B5EA8"
          count="3"
          onPress={() => handleQuickLinkPress("Messagerie")}
        />
        <QuickLink
          icon="person-add-outline"
          label="Inscriptions"
          color="#3A8FAF"
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
    justifyContent: "space-between",
    overflow: "hidden",
  },
  greeting: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rolePill: {
    flexShrink: 0,
    marginLeft: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePillText: { color: colors.white, fontSize: 11, fontWeight: "600" },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardTextWrap: {
    flex: 1,
    minWidth: 0,
    height: 40,
    justifyContent: "center",
    gap: 2,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statCardLabel: { fontSize: 12, color: colors.textSecondary },

  quickLinks: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  qlIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qlLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  qlBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  qlBadgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
});
