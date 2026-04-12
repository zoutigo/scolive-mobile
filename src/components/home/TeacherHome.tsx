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
import type { AuthUser } from "../../types/auth.types";

interface TeacherHomeProps {
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

export function TeacherHome({ user, schoolSlug }: TeacherHomeProps) {
  const router = useRouter();
  const now = new Date();
  const dayLabel = DAY_LABELS[now.getDay()];
  const dateStr = `${dayLabel} ${now.getDate()} ${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;

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
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.bannerName}>
              {user.firstName} {user.lastName}
            </Text>
          </View>
          <View
            style={[styles.rolePill, { backgroundColor: colors.accentTeal }]}
          >
            <Text style={styles.rolePillText}>Enseignant(e)</Text>
          </View>
        </View>
        <View style={styles.schoolRow}>
          <Ionicons name="business" size={13} color={colors.textSecondary} />
          <Text style={styles.schoolLabel}>{schoolDisplay}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        {[
          {
            icon: "calendar",
            label: "Mes classes",
            color: colors.primary,
            onPress: () => router.push("/(home)/timetable"),
          },
          {
            icon: "journal",
            label: "Cahier de notes",
            color: colors.accentTeal,
          },
          {
            icon: "chatbubble",
            label: "Messages",
            color: "#6B5EA8",
            badge: "2",
          },
        ].map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.statCard}
            activeOpacity={0.75}
            onPress={s.onPress}
          >
            <View
              style={[styles.statIcon, { backgroundColor: s.color + "18" }]}
            >
              <Ionicons name={s.icon as "home"} size={22} color={s.color} />
              {s.badge && (
                <View style={[styles.iconBadge, { backgroundColor: s.color }]}>
                  <Text style={styles.iconBadgeText}>{s.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's schedule placeholder */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Emploi du temps du jour</Text>
        <TouchableOpacity onPress={() => router.push("/(home)/timetable")}>
          <Text style={styles.sectionLink}>Voir tout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleEmpty}>
          <Ionicons
            name="calendar-outline"
            size={36}
            color={colors.warmBorder}
          />
          <Text style={styles.scheduleEmptyText}>
            Aucun cours planifié aujourd'hui
          </Text>
          <Text style={styles.scheduleEmptySub}>
            Consultez votre emploi du temps complet
          </Text>
        </View>
      </View>

      {/* My classes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes classes</Text>
        <TouchableOpacity onPress={() => router.push("/(home)/timetable")}>
          <Text style={styles.sectionLink}>Gérer</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.classesCard}>
        <View style={styles.classesEmpty}>
          <Ionicons name="book-outline" size={36} color={colors.warmBorder} />
          <Text style={styles.scheduleEmptyText}>
            Vos classes apparaîtront ici
          </Text>
        </View>
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
    gap: 10,
  },
  bannerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: { fontSize: 13, color: colors.textSecondary },
  bannerName: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  rolePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePillText: { color: colors.white, fontSize: 11, fontWeight: "600" },
  schoolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  schoolLabel: { fontSize: 12, color: colors.textSecondary, flex: 1 },
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
    gap: 8,
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeText: { color: colors.white, fontSize: 9, fontWeight: "700" },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },

  scheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    marginBottom: 20,
    overflow: "hidden",
  },
  scheduleEmpty: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  scheduleEmptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  scheduleEmptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
  },

  classesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  classesEmpty: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
});
