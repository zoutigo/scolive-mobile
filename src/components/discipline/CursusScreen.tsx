/**
 * Écran Cursus — historique discipline multi-années / multi-classes d'un
 * élève, pour la vue Parent.
 *
 * Équivalent mobile de `scolive-web/.../children/[childId]/cursus/page.tsx` :
 * synthèse (nb années/classes + compteurs par type) + liste groupée par
 * année scolaire puis classe, filtrable par année / classe / type.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { disciplineApi } from "../../api/discipline.api";
import {
  DISCIPLINE_TYPE_CONFIG,
  STUDENT_LIFE_EVENT_TYPES,
  computeDisciplineSummary,
  getDisciplineTypePluralLabel,
  type StudentLifeEvent,
} from "../../types/discipline.types";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { OnboardingScrollView } from "../onboarding/OnboardingScrollView";
import { PageHelpModal } from "../help/PageHelpModal";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import {
  SearchableDropdown,
  type SearchableDropdownItem,
} from "../pickers/SearchableDropdown";
import { LifeEventCard } from "./LifeEventCard";
import {
  CURSUS_TOUR_ID,
  CURSUS_TOUR_STEPS,
  CURSUS_TOUR_TARGETS,
} from "./cursus-tour.config";

const ALL_ID = "ALL";

type CursusGroup = {
  key: string;
  yearLabel: string;
  className: string;
  events: StudentLifeEvent[];
};

export type CursusScreenProps = {
  studentId: string;
  studentLabel: string;
  onBack: () => void;
};

export function CursusScreen({
  studentId,
  studentLabel,
  onBack,
}: CursusScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { schoolSlug } = useAuthStore();

  const [events, setEvents] = useState<StudentLifeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  const [yearFilter, setYearFilter] = useState<string>(ALL_ID);
  const [classFilter, setClassFilter] = useState<string>(ALL_ID);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_ID);

  useOnboardingTourTrigger({
    tourId: CURSUS_TOUR_ID,
    role: "parent",
    steps: CURSUS_TOUR_STEPS,
  });

  const load = useCallback(async () => {
    if (!schoolSlug || !studentId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await disciplineApi.list(schoolSlug, studentId, {
        scope: "all",
        limit: 500,
      });
      setEvents(result);
    } catch {
      setErrorMessage(t("discipline.cursus.error"));
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const yearOptions: SearchableDropdownItem[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const event of events) {
      const id = event.schoolYearId ?? "none";
      const label = event.schoolYear?.label ?? t("discipline.cursus.notDefined.year");
      map.set(id, label);
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => b.label.localeCompare(a.label));
  }, [events, t]);

  const classOptions: SearchableDropdownItem[] = useMemo(() => {
    const map = new Map<string, string>();
    for (const event of events) {
      const id = event.classId ?? "none";
      const label = event.class?.name ?? t("discipline.cursus.notDefined.class");
      map.set(id, label);
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [events, t]);

  const typeOptions: SearchableDropdownItem[] = useMemo(
    () =>
      STUDENT_LIFE_EVENT_TYPES.map((type) => ({
        id: type,
        label: getDisciplineTypePluralLabel(t, type),
      })),
    [t],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (yearFilter !== ALL_ID && (event.schoolYearId ?? "none") !== yearFilter) {
        return false;
      }
      if (classFilter !== ALL_ID && (event.classId ?? "none") !== classFilter) {
        return false;
      }
      if (typeFilter !== ALL_ID && event.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [events, yearFilter, classFilter, typeFilter]);

  const summary = useMemo(
    () => computeDisciplineSummary(filteredEvents),
    [filteredEvents],
  );

  const groups: CursusGroup[] = useMemo(() => {
    const map = new Map<string, CursusGroup>();
    for (const event of filteredEvents) {
      const yearLabel =
        event.schoolYear?.label ?? t("discipline.cursus.notDefined.year");
      const className =
        event.class?.name ?? t("discipline.cursus.notDefined.class");
      const key = `${yearLabel}::${className}`;
      const current = map.get(key);
      if (current) {
        current.events.push(event);
      } else {
        map.set(key, { key, yearLabel, className, events: [event] });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      `${b.yearLabel} ${b.className}`.localeCompare(`${a.yearLabel} ${a.className}`),
    );
  }, [filteredEvents, t]);

  function resetFilters() {
    setYearFilter(ALL_ID);
    setClassFilter(ALL_ID);
    setTypeFilter(ALL_ID);
  }

  const hasActiveFilters =
    yearFilter !== ALL_ID || classFilter !== ALL_ID || typeFilter !== ALL_ID;

  const yearValue =
    yearFilter === ALL_ID
      ? null
      : (yearOptions.find((o) => o.id === yearFilter) ?? null);
  const classValue =
    classFilter === ALL_ID
      ? null
      : (classOptions.find((o) => o.id === classFilter) ?? null);
  const typeValue =
    typeFilter === ALL_ID
      ? null
      : (typeOptions.find((o) => o.id === typeFilter) ?? null);

  return (
    <View style={styles.root} testID="cursus-screen">
      <ModuleHeader
        title={t("discipline.cursus.title")}
        subtitle={studentLabel}
        onBack={onBack}
        testID="cursus-header"
        backTestID="cursus-back"
        titleTestID="cursus-header-title"
        subtitleTestID="cursus-header-subtitle"
        topInset={insets.top}
        helpAction={{
          label: t("discipline.cursus.help.menuLabel"),
          onPress: () => setHelpVisible(true),
          testID: "cursus-help-menu-item",
        }}
        menuTourTargetId={CURSUS_TOUR_TARGETS.helpToggle}
      />

      <OnboardingTarget id={CURSUS_TOUR_TARGETS.filters}>
        <View style={styles.filtersRow} testID="cursus-filters">
          <View style={styles.filterItem}>
            <SearchableDropdown
              value={yearValue}
              items={yearOptions}
              searchValue=""
              onSearchChange={() => {}}
              onSelect={(item) => setYearFilter(item.id)}
              placeholder={t("discipline.cursus.filters.year")}
              searchPlaceholder={t("discipline.cursus.filters.year")}
              emptyLabel={t("discipline.cursus.empty")}
              title={t("discipline.cursus.filters.year")}
              testIDPrefix="cursus-filter-year"
            />
          </View>
          <View style={styles.filterItem}>
            <SearchableDropdown
              value={classValue}
              items={classOptions}
              searchValue=""
              onSearchChange={() => {}}
              onSelect={(item) => setClassFilter(item.id)}
              placeholder={t("discipline.cursus.filters.class")}
              searchPlaceholder={t("discipline.cursus.filters.class")}
              emptyLabel={t("discipline.cursus.empty")}
              title={t("discipline.cursus.filters.class")}
              testIDPrefix="cursus-filter-class"
            />
          </View>
          <View style={styles.filterItem}>
            <SearchableDropdown
              value={typeValue}
              items={typeOptions}
              searchValue=""
              onSearchChange={() => {}}
              onSelect={(item) => setTypeFilter(item.id)}
              placeholder={t("discipline.cursus.filters.type")}
              searchPlaceholder={t("discipline.cursus.filters.type")}
              emptyLabel={t("discipline.cursus.empty")}
              title={t("discipline.cursus.filters.type")}
              testIDPrefix="cursus-filter-type"
            />
          </View>
          {hasActiveFilters ? (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={resetFilters}
              testID="cursus-filters-reset"
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.resetBtnText}>
                {t("discipline.cursus.filters.reset")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </OnboardingTarget>

      {errorMessage ? (
        <View style={styles.errorBanner} testID="cursus-error">
          <Ionicons name="alert-circle-outline" size={16} color={colors.notification} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={load} testID="cursus-retry">
            <Text style={styles.retryText}>{t("discipline.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingWrap} testID="cursus-loading">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <OnboardingScrollView
          style={styles.root}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingTarget id={CURSUS_TOUR_TARGETS.kpis}>
            <View style={styles.kpiGrid} testID="cursus-kpis">
              <KpiTile
                testID="cursus-kpi-groups"
                icon="calendar-outline"
                label={t("discipline.cursus.synthese.yearsClasses")}
                value={groups.length}
                accent={colors.primary}
              />
              <KpiTile
                testID="cursus-kpi-absences"
                icon={DISCIPLINE_TYPE_CONFIG.ABSENCE.icon}
                label={getDisciplineTypePluralLabel(t, "ABSENCE")}
                value={summary.absences}
                accent={DISCIPLINE_TYPE_CONFIG.ABSENCE.accent}
              />
              <KpiTile
                testID="cursus-kpi-retards"
                icon={DISCIPLINE_TYPE_CONFIG.RETARD.icon}
                label={getDisciplineTypePluralLabel(t, "RETARD")}
                value={summary.retards}
                accent={DISCIPLINE_TYPE_CONFIG.RETARD.accent}
              />
              <KpiTile
                testID="cursus-kpi-sanctions"
                icon={DISCIPLINE_TYPE_CONFIG.SANCTION.icon}
                label={getDisciplineTypePluralLabel(t, "SANCTION")}
                value={summary.sanctions}
                accent={DISCIPLINE_TYPE_CONFIG.SANCTION.accent}
              />
              <KpiTile
                testID="cursus-kpi-punitions"
                icon={DISCIPLINE_TYPE_CONFIG.PUNITION.icon}
                label={getDisciplineTypePluralLabel(t, "PUNITION")}
                value={summary.punitions}
                accent={DISCIPLINE_TYPE_CONFIG.PUNITION.accent}
              />
            </View>
          </OnboardingTarget>

          {groups.length === 0 ? (
            <View style={styles.empty} testID="cursus-groups-empty">
              <Ionicons name="school-outline" size={40} color={colors.warmBorder} />
              <Text style={styles.emptyText}>{t("discipline.cursus.empty")}</Text>
            </View>
          ) : (
            <View style={styles.groups} testID="cursus-groups">
              {groups.map((group) => (
                <View key={group.key} style={styles.group} testID={`cursus-group-${group.key}`}>
                  <Text style={styles.groupTitle}>
                    {group.yearLabel} · {group.className}
                  </Text>
                  <View style={styles.groupEvents}>
                    {group.events.map((event) => (
                      <LifeEventCard key={event.id} event={event} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </OnboardingScrollView>
      )}

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("discipline.cursus.help.title")}
        sections={[
          {
            title: t("discipline.cursus.help.section1Title"),
            body: [t("discipline.cursus.help.section1Body")],
          },
          {
            title: t("discipline.cursus.help.section2Title"),
            body: [t("discipline.cursus.help.section2Body")],
          },
        ]}
        closeLabel={t("discipline.cursus.help.close")}
        testID="cursus-help-modal"
      />
    </View>
  );
}

function KpiTile({
  testID,
  icon,
  label,
  value,
  accent,
}: {
  testID: string;
  icon: string;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={styles.kpiTile} testID={testID}>
      <View style={[styles.kpiIconWrap, { backgroundColor: accent + "22" }]}>
        <Ionicons name={icon as "school-outline"} size={15} color={accent} />
      </View>
      <Text style={[styles.kpiValue, { color: accent }]} testID={`${testID}-value`}>
        {value}
      </Text>
      <Text style={styles.kpiLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  filterItem: { minWidth: 110, flexGrow: 1, flexBasis: "30%" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resetBtnText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFCDD2",
  },
  errorText: { flex: 1, fontSize: 13, color: colors.notification },
  retryText: { fontSize: 13, fontWeight: "700", color: colors.primary },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 },

  content: { padding: 16, gap: 16, paddingBottom: 32 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiTile: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  kpiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontSize: 20, fontWeight: "800" },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },

  groups: { gap: 14 },
  group: { gap: 8 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  groupEvents: { gap: 8 },
});
