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

interface StudentHomeProps {
  user: AuthUser;
  schoolSlug: string | null;
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function StudentHome({ user, schoolSlug }: StudentHomeProps) {
  const now = new Date();
  const dayLabel = DAY_LABELS[now.getDay()];
  const dateStr = `${dayLabel} ${now.getDate()} ${MONTH_LABELS[now.getMonth()]}`;

  const schoolDisplay = schoolSlug
    ? schoolSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Mon établissement";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.bannerName}>{user.firstName}</Text>
          <View style={styles.schoolRow}>
            <Ionicons name="business" size={13} color={colors.primary} />
            <Text style={styles.schoolLabel}>{schoolDisplay}</Text>
          </View>
        </View>
        <View style={styles.bannerRight}>
          <View
            style={[styles.rolePill, { backgroundColor: colors.accentTeal }]}
          >
            <Text style={styles.rolePillText}>Élève</Text>
          </View>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        {[
          {
            icon: "ribbon",
            label: "Moyenne",
            value: "—",
            color: colors.primary,
          },
          {
            icon: "book",
            label: "Matières",
            value: "—",
            color: colors.accentTeal,
          },
          {
            icon: "checkmark-circle",
            label: "Homework",
            value: "—",
            color: colors.warmAccent,
          },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <View
              style={[styles.statIcon, { backgroundColor: s.color + "18" }]}
            >
              <Ionicons name={s.icon as "home"} size={20} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>
              {s.value}
            </Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Today's timetable */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cours du jour</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>Emploi du temps</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.emptyBlock}>
          <Ionicons
            name="calendar-outline"
            size={36}
            color={colors.warmBorder}
          />
          <Text style={styles.emptyTitle}>Aucun cours aujourd'hui</Text>
          <Text style={styles.emptySub}>Profitez de votre journée !</Text>
        </View>
      </View>

      {/* Recent grades */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dernières notes</Text>
        <TouchableOpacity>
          <Text style={styles.sectionLink}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.emptyBlock}>
          <Ionicons name="ribbon-outline" size={36} color={colors.warmBorder} />
          <Text style={styles.emptyTitle}>Aucune note récente</Text>
          <Text style={styles.emptySub}>
            Vos dernières évaluations apparaîtront ici
          </Text>
        </View>
      </View>

      {/* Quick links */}
      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>
        Accès rapides
      </Text>
      <View style={styles.quickRow}>
        {[
          { icon: "journal-outline", label: "Homework", color: colors.primary },
          { icon: "chatbubble-outline", label: "Messages", color: "#6B5EA8" },
          {
            icon: "document-outline",
            label: "Documents",
            color: colors.warmAccent,
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickBtn}
            activeOpacity={0.75}
          >
            <View
              style={[styles.quickIcon, { backgroundColor: item.color + "18" }]}
            >
              <Ionicons
                name={item.icon as "home"}
                size={22}
                color={item.color}
              />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
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
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  bannerLeft: { flex: 1 },
  bannerRight: { alignItems: "flex-end", gap: 8 },
  greeting: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  bannerName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  schoolRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  schoolLabel: { fontSize: 12, color: colors.primary, fontWeight: "500" },
  rolePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  rolePillText: { color: colors.white, fontSize: 11, fontWeight: "600" },
  dateText: { fontSize: 12, color: colors.textSecondary },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionLink: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    marginBottom: 16,
    overflow: "hidden",
  },
  emptyBlock: {
    alignItems: "center",
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
});
