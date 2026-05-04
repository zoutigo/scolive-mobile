import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  DISCIPLINE_TYPE_CONFIG,
  type DisciplineSummary,
  type StudentLifeEvent,
  type StudentLifeEventType,
} from "../../types/discipline.types";
import { DisciplineSummaryKpis } from "./DisciplineSummaryKpis";
import { LifeEventCard } from "./LifeEventCard";

type Props = {
  summary: DisciplineSummary;
  events: StudentLifeEvent[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptySub?: string;
  testID?: string;
};

export function DisciplineSummaryOverview({
  summary,
  events,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  emptyTitle = "Tout va bien !",
  emptySub = "Aucun événement de vie scolaire enregistré sur l'année en cours.",
  testID = "discipline-summary-overview",
}: Props) {
  const [activeFilter, setActiveFilter] = useState<StudentLifeEventType | null>(
    null,
  );

  if (isLoading) {
    return (
      <View style={styles.centered} testID={`${testID}-loading`}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleFilterPress = (type: StudentLifeEventType) => {
    setActiveFilter((current) => (current === type ? null : type));
  };

  const displayedEvents = activeFilter
    ? events.filter((e) => e.type === activeFilter)
    : events;

  const hasAny = events.length > 0;
  const sectionTitle = activeFilter
    ? `Derniers événements : ${DISCIPLINE_TYPE_CONFIG[activeFilter].pluralLabel}`
    : "Derniers événements";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      testID={testID}
    >
      <Text style={styles.sectionTitle} testID="school-year-section-title">
        Cette année scolaire
      </Text>

      <DisciplineSummaryKpis
        summary={summary}
        onFilterPress={handleFilterPress}
      />

      {summary.unjustifiedAbsences > 0 ? (
        <View style={styles.alertBanner} testID="unjustified-banner">
          <Ionicons
            name="warning-outline"
            size={18}
            color={colors.notification}
          />
          <Text style={styles.alertText}>
            <Text style={styles.alertStrong}>
              {summary.unjustifiedAbsences} absence
              {summary.unjustifiedAbsences > 1 ? "s" : ""}
            </Text>{" "}
            non justifiée{summary.unjustifiedAbsences > 1 ? "s" : ""} cette
            année.
          </Text>
        </View>
      ) : null}

      {hasAny ? (
        <>
          <View style={styles.sectionRow}>
            <Text
              style={styles.sectionTitle}
              testID="events-section-title"
              numberOfLines={1}
            >
              {sectionTitle}
            </Text>
            {activeFilter ? (
              <TouchableOpacity
                onPress={() => setActiveFilter(null)}
                testID="btn-see-all"
              >
                <Text style={styles.sectionLink}>Tout voir</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {displayedEvents.length > 0 ? (
            displayedEvents.map((event) => (
              <LifeEventCard key={event.id} event={event} />
            ))
          ) : (
            <View style={styles.filterEmpty} testID="filter-empty">
              <Ionicons
                name="funnel-outline"
                size={32}
                color={colors.warmBorder}
              />
              <Text style={styles.filterEmptyText}>
                Aucun événement de ce type.
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState} testID="synthese-empty">
          <View style={styles.emptyIconWrap}>
            <Ionicons
              name="shield-checkmark-outline"
              size={48}
              color={colors.warmBorder}
            />
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySub}>{emptySub}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    padding: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: colors.notification,
    lineHeight: 19,
  },
  alertStrong: {
    fontWeight: "700",
  },
  filterEmpty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  filterEmptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 20,
  },
});
