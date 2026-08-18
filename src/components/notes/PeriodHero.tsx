import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import {
  formatDelta,
  formatScore,
  getBestSubject,
  getWatchSubject,
} from "../../utils/notes";
import type {
  StudentNotesTermSnapshot,
  YearlyNotesSnapshot,
} from "../../types/notes.types";

// Carte "hero" de synthèse d'une période (trimestre) : moyenne élève/classe,
// meilleure matière, matière à surveiller. `compactStats`+`inlineHeader`
// donnent la variante compacte utilisée dans les bulletins (enseignant ET
// parent) ; la variante par défaut (large) est utilisée dans l'onglet Notes.

export function PeriodHero({
  snapshot,
  compactStats = false,
  showPublished = true,
  inlineHeader = false,
}: {
  snapshot: StudentNotesTermSnapshot | YearlyNotesSnapshot;
  compactStats?: boolean;
  showPublished?: boolean;
  inlineHeader?: boolean;
}) {
  const { t } = useTranslation();
  const bestSubject = getBestSubject(snapshot.subjects);
  const watchSubject = getWatchSubject(snapshot.subjects);
  const stats = [
    {
      id: "student-avg",
      label: t("notes.period.statStudentAvg"),
      value: formatScore(snapshot.generalAverage.student),
      hint: formatDelta(
        snapshot.generalAverage.student,
        snapshot.generalAverage.class,
        t,
      ),
      icon: "medal-outline" as const,
    },
    {
      id: "class-avg",
      label: t("notes.period.statClassAvg"),
      value: formatScore(snapshot.generalAverage.class),
      hint: `${t("notes.period.amplitude")} ${formatScore(snapshot.generalAverage.min)} - ${formatScore(snapshot.generalAverage.max)}`,
      icon: "analytics-outline" as const,
    },
    {
      id: "best-subject",
      label: t("notes.period.statBestSubject"),
      value: bestSubject?.subjectLabel ?? "-",
      hint:
        bestSubject?.studentAverage != null
          ? `${formatScore(bestSubject.studentAverage)}/20`
          : t("notes.period.noData"),
      icon: "sparkles-outline" as const,
    },
    {
      id: "watch-subject",
      label: t("notes.period.statWatchSubject"),
      value: watchSubject?.subjectLabel ?? "-",
      hint:
        watchSubject?.studentAverage != null
          ? `${formatScore(watchSubject.studentAverage)}/20`
          : t("notes.period.noData"),
      icon: "bar-chart-outline" as const,
    },
  ];

  return (
    <View style={styles.hero} testID="notes-period-hero">
      <View style={styles.heroTintPrimary} />
      <View style={styles.heroTintAccent} />
      <View style={styles.heroHeader}>
        {inlineHeader ? (
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroBadge}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.heroBadgeText}>
                {t("notes.period.badge")}
              </Text>
            </View>
            <Text style={styles.heroTitleInline} numberOfLines={1}>
              {snapshot.label}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.heroBadge}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.heroBadgeText}>
                {t("notes.period.badge")}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{snapshot.label}</Text>
          </>
        )}
        <Text style={styles.heroSubtitle}>{snapshot.councilLabel}</Text>
      </View>

      {showPublished ? (
        <View style={styles.publishedCard}>
          <Text style={styles.publishedLabel}>
            {t("notes.period.published")}
          </Text>
          <Text style={styles.publishedValue}>{snapshot.generatedAtLabel}</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.heroStatsGrid,
          compactStats && styles.heroStatsGridCompact,
        ]}
      >
        {stats.map((stat) => (
          <View
            key={stat.id}
            style={[
              styles.heroStatCard,
              compactStats && styles.heroStatCardCompact,
            ]}
            testID={`notes-period-stat-${stat.id}`}
          >
            <View style={styles.heroStatHeader}>
              <Text style={styles.heroStatLabel} numberOfLines={1}>
                {stat.label}
              </Text>
              <View
                style={[
                  styles.heroStatIcon,
                  compactStats && styles.heroStatIconCompact,
                ]}
              >
                <Ionicons
                  name={stat.icon}
                  size={compactStats ? 12 : 16}
                  color={colors.primary}
                />
              </View>
            </View>
            <Text style={styles.heroStatValue} numberOfLines={1}>
              {stat.value}
            </Text>
            <Text
              style={styles.heroStatHint}
              numberOfLines={compactStats ? 2 : undefined}
            >
              {stat.hint ?? "-"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#cfdfee",
    backgroundColor: "#f8fbff",
    padding: 14,
    gap: 12,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    overflow: "hidden",
    position: "relative",
  },
  heroTintPrimary: {
    position: "absolute",
    top: -18,
    right: -8,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(12,95,168,0.07)",
  },
  heroTintAccent: {
    position: "absolute",
    bottom: -30,
    left: -16,
    width: 170,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(36,124,114,0.06)",
  },
  heroHeader: { gap: 5 },
  heroHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroTitleInline: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.warmAccent,
    fontSize: 15,
    fontWeight: "800",
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "#bed5ea",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  heroSubtitle: { color: colors.textSecondary, fontSize: 11, lineHeight: 15 },
  publishedCard: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "#d7e4ee",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  publishedLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  publishedValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  heroStatsGrid: { gap: 10 },
  heroStatsGridCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroStatCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "#d9e5ef",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
    minHeight: 92,
  },
  heroStatCardCompact: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 74,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  heroStatIconCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  heroStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroStatLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  heroStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#edf5fb",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  heroStatHint: { color: colors.textSecondary, fontSize: 11, lineHeight: 15 },
});
