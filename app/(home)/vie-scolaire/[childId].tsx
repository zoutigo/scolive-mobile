/**
 * Écran Vie scolaire — Vue parent (lecture seule).
 *
 * 3 onglets :
 *  - Synthèse    : KPI animés + derniers événements par type
 *  - Absences & Retards : liste filtrée
 *  - Sanctions & Punitions : liste filtrée
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/theme";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { useAuthStore } from "../../../src/store/auth.store";
import { useFamilyStore } from "../../../src/store/family.store";
import { useDisciplineStore } from "../../../src/store/discipline.store";
import { ReadonlyDisciplineList } from "../../../src/components/discipline/ReadonlyDisciplineList";
import { DisciplineSummaryOverview } from "../../../src/components/discipline/DisciplineSummaryOverview";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { buildChildHomeTarget } from "../../../src/components/navigation/nav-config";
import { useDrawer } from "../../../src/components/navigation/drawer-context";
import { AppShell } from "../../../src/components/navigation/AppShell";
import type {
  DisciplineSummary,
  StudentLifeEvent,
} from "../../../src/types/discipline.types";

// ── Onglets ───────────────────────────────────────────────────────────────────

type TabKey = "synthese" | "absences" | "sanctions";

const TAB_KEYS: Array<{ key: TabKey; labelKey: string; icon: string }> = [
  {
    key: "synthese",
    labelKey: "discipline.tabs.synthesis",
    icon: "stats-chart-outline",
  },
  {
    key: "absences",
    labelKey: "discipline.tabs.absencesRetards",
    icon: "time-outline",
  },
  {
    key: "sanctions",
    labelKey: "discipline.tabs.sanctionsPunitions",
    icon: "shield-outline",
  },
];

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function VieScolaireScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <VieScolaireScreenContent />
    </AppShell>
  );
}

function VieScolaireScreenContent() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { schoolSlug } = useAuthStore();
  const { children, setActiveChild, updateChild } = useFamilyStore();
  const {
    eventsMap,
    isLoading,
    isRefreshing,
    loadEvents,
    refreshEvents,
    getSummary,
  } = useDisciplineStore();

  const [tab, setTab] = useState<TabKey>("synthese");
  const [loadError, setLoadError] = useState<string | null>(null);

  const child = children.find((c) => c.id === childId) ?? null;
  const events: StudentLifeEvent[] = childId ? (eventsMap[childId] ?? []) : [];
  const isCached = childId ? eventsMap[childId] !== undefined : false;
  const summary = getSummary(childId);

  const absencesRetards = events.filter(
    (e) => e.type === "ABSENCE" || e.type === "RETARD",
  );
  const sanctionsPunitions = events.filter(
    (e) => e.type === "SANCTION" || e.type === "PUNITION",
  );

  const load = useCallback(async () => {
    if (!schoolSlug || !childId) return;
    setLoadError(null);
    try {
      await loadEvents(schoolSlug, childId, { scope: "current", limit: 200 });
    } catch {
      setLoadError(t("discipline.errors.loadData"));
    }
  }, [schoolSlug, childId, loadEvents]);

  const refresh = useCallback(async () => {
    if (!schoolSlug || !childId) return;
    setLoadError(null);
    try {
      await refreshEvents(schoolSlug, childId, {
        scope: "current",
        limit: 200,
      });
    } catch {
      setLoadError(t("discipline.errors.refreshData"));
    }
  }, [schoolSlug, childId, refreshEvents]);

  useEffect(() => {
    if (!isCached) {
      void load();
    }
  }, [load, isCached]);

  useEffect(() => {
    if (!childId) return;
    setActiveChild(childId);
  }, [childId, setActiveChild]);

  const childName = child
    ? `${child.lastName} ${child.firstName}`
    : t("discipline.header.student");
  const classLabel =
    events.find((event) => event.class?.name)?.class?.name?.trim() ?? "";
  const subtitle = classLabel ? `${childName} • ${classLabel}` : childName;

  useEffect(() => {
    if (!childId || !classLabel || child?.className === classLabel) return;
    updateChild(childId, { className: classLabel });
  }, [childId, classLabel, child?.className, updateChild]);

  return (
    <View style={styles.root} testID="vie-scolaire-screen">
      {/* Header */}
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={t("discipline.header.vieScolaire")}
          subtitle={subtitle}
          onBack={() => router.push(buildChildHomeTarget(childId) as never)}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          testID="vie-scolaire-header"
          backTestID="btn-back"
          titleTestID="vie-scolaire-header-title"
          subtitleTestID="vie-scolaire-header-subtitle"
          rightTestID="btn-menu"
          topInset={insets.top}
        />
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        {TAB_KEYS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, tab === item.key && styles.tabActive]}
            onPress={() => setTab(item.key)}
            testID={`tab-${item.key}`}
            accessibilityState={{ selected: tab === item.key }}
          >
            <Ionicons
              name={item.icon as "stats-chart-outline"}
              size={14}
              color={tab === item.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                tab === item.key && styles.tabLabelActive,
              ]}
              numberOfLines={1}
            >
              {t(item.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Erreur de chargement */}
      {loadError && (
        <View style={styles.errorBanner} testID="load-error">
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colors.notification}
          />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity onPress={load} testID="btn-retry">
            <Text style={styles.retryText}>{t("discipline.retry")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contenu */}
      <View style={styles.body}>
        {tab === "synthese" && (
          <SyntheseTab
            summary={summary}
            events={events}
            isLoading={isLoading && !isCached}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
          />
        )}

        {tab === "absences" && (
          <ReadonlyDisciplineList
            events={absencesRetards}
            isLoading={isLoading && !isCached}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            emptyIcon="time-outline"
            emptyTitle={t("discipline.empty.noAbsence.title")}
            emptySub={t("discipline.empty.noAbsence.message")}
            testID="list-absences"
          />
        )}

        {tab === "sanctions" && (
          <ReadonlyDisciplineList
            events={sanctionsPunitions}
            isLoading={isLoading && !isCached}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            emptyIcon="shield-checkmark-outline"
            emptyTitle={t("discipline.empty.noSanction.title")}
            emptySub={t("discipline.empty.noSanction.message")}
            testID="list-sanctions"
          />
        )}
      </View>
    </View>
  );
}

// ── Onglet Synthèse ───────────────────────────────────────────────────────────

interface SyntheseProps {
  summary: DisciplineSummary;
  events: StudentLifeEvent[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function SyntheseTab({
  summary,
  events,
  isLoading,
  isRefreshing,
  onRefresh,
}: SyntheseProps) {
  return (
    <DisciplineSummaryOverview
      summary={summary}
      events={events}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      testID="synthese-tab"
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: 16 },

  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },

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
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  body: { flex: 1 },
});
