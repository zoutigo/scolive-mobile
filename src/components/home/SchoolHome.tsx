import React from "react";
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
import type { AuthUser, SchoolRole } from "../../types/auth.types";

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

export function SchoolHome({ user }: SchoolHomeProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { onScroll } = useHeaderScroll();
  const role = (user.activeRole ?? user.role) as SchoolRole | null;
  const roleLabelKey = role ? ROLE_LABEL_KEYS[role] : undefined;
  const roleLabel = roleLabelKey ? t(roleLabelKey) : role ?? "";

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
      <Text style={styles.sectionTitle}>Tableau de bord</Text>
      <View style={styles.statsGrid}>
        {[
          { icon: "book", label: "Classes", color: colors.primary },
          { icon: "people", label: "Élèves", color: colors.accentTeal },
          { icon: "school", label: "Enseignants", color: colors.warmAccent },
          { icon: "person-add", label: "Inscriptions", color: "#6B5EA8" },
        ].map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.statCard}
            activeOpacity={0.75}
          >
            <View
              style={[styles.statCardIcon, { backgroundColor: s.color + "18" }]}
            >
              <Ionicons name={s.icon as "home"} size={26} color={s.color} />
            </View>
            <Text style={styles.statCardValue}>—</Text>
            <Text style={styles.statCardLabel}>{s.label}</Text>
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
    padding: 16,
    alignItems: "flex-start",
    gap: 6,
  },
  statCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statCardLabel: { fontSize: 13, color: colors.textSecondary },

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
