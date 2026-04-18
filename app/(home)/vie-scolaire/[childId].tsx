/**
 * Écran Vie scolaire — Vue parent (lecture seule).
 *
 * 3 onglets :
 *  - Synthèse    : KPI animés + derniers événements par type
 *  - Absences & Retards : liste filtrée
 *  - Sanctions & Punitions : liste filtrée
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/theme";
import { useAuthStore } from "../../../src/store/auth.store";
import { useFamilyStore } from "../../../src/store/family.store";
import { useDisciplineStore } from "../../../src/store/discipline.store";
import { DisciplineSummaryKpis } from "../../../src/components/discipline/DisciplineSummaryKpis";
import { ReadonlyDisciplineList } from "../../../src/components/discipline/ReadonlyDisciplineList";
import { LifeEventCard } from "../../../src/components/discipline/LifeEventCard";
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

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "synthese", label: "Synthèse", icon: "stats-chart-outline" },
  { key: "absences", label: "Absences & Retards", icon: "time-outline" },
  { key: "sanctions", label: "Sanctions & Punitions", icon: "shield-outline" },
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
      setLoadError("Impossible de charger les données. Réessayez.");
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
      setLoadError("Impossible de rafraîchir les données.");
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

  const childName = child ? `${child.lastName} ${child.firstName}` : "Élève";
  const classLabel =
    events.find((event) => event.class?.name)?.class?.name?.trim() ?? "";
  const subtitle = classLabel ? `${childName} • ${classLabel}` : childName;

  useEffect(() => {
    if (!childId || !classLabel || !child) return;
    updateChild(childId, {
      className: classLabel,
      firstName: child.firstName,
      lastName: child.lastName,
    });
  }, [child, childId, classLabel, updateChild]);

  return (
    <View style={styles.root} testID="vie-scolaire-screen">
      {/* Header */}
      <View style={styles.headerWrap}>
        <ModuleHeader
          title="Vie scolaire"
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
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            testID={`tab-${t.key}`}
            accessibilityState={{ selected: tab === t.key }}
          >
            <Ionicons
              name={t.icon as "stats-chart-outline"}
              size={14}
              color={tab === t.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.label}
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
            <Text style={styles.retryText}>Réessayer</Text>
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
            onAbsencesPress={() => setTab("absences")}
            onSanctionsPress={() => setTab("sanctions")}
          />
        )}

        {tab === "absences" && (
          <ReadonlyDisciplineList
            events={absencesRetards}
            isLoading={isLoading && !isCached}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            emptyIcon="time-outline"
            emptyTitle="Aucune absence ni retard"
            emptySub="Aucune absence ou retard n'a été enregistré sur l'année en cours."
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
            emptyTitle="Aucune sanction ni punition"
            emptySub="Aucune sanction ou punition n'a été enregistrée sur l'année en cours."
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
  onAbsencesPress: () => void;
  onSanctionsPress: () => void;
}

function SyntheseTab({
  summary,
  events,
  isLoading,
  isRefreshing,
  onRefresh,
  onAbsencesPress,
  onSanctionsPress,
}: SyntheseProps) {
  if (isLoading) {
    return (
      <View style={styles.centered} testID="synthese-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasAny = events.length > 0;
  const recentEvents = events.slice(0, 3);
  const handleSeeAll = () => {
    const latest = recentEvents[0];
    if (latest && (latest.type === "SANCTION" || latest.type === "PUNITION")) {
      onSanctionsPress();
      return;
    }
    onAbsencesPress();
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      testID="synthese-tab"
    >
      {/* KPIs */}
      <Text style={styles.sectionTitle} testID="school-year-section-title">
        Cette année scolaire
      </Text>
      <DisciplineSummaryKpis
        summary={summary}
        onAbsencesPress={onAbsencesPress}
        onRetardsPress={onAbsencesPress}
        onSanctionsPress={onSanctionsPress}
        onPunitionsPress={onSanctionsPress}
      />

      {/* Alertes absences non justifiées */}
      {summary.unjustifiedAbsences > 0 && (
        <View style={styles.alertBanner} testID="unjustified-banner">
          <Ionicons
            name="warning-outline"
            size={18}
            color={colors.notification}
          />
          <Text style={styles.alertText}>
            <Text style={{ fontWeight: "700" }}>
              {summary.unjustifiedAbsences} absence
              {summary.unjustifiedAbsences > 1 ? "s" : ""}
            </Text>{" "}
            non justifiée{summary.unjustifiedAbsences > 1 ? "s" : ""} cette
            année.
          </Text>
        </View>
      )}

      {/* Derniers événements */}
      {hasAny && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Derniers événements</Text>
            <TouchableOpacity onPress={handleSeeAll} testID="btn-see-all">
              <Text style={styles.sectionLink}>Tout voir</Text>
            </TouchableOpacity>
          </View>
          {recentEvents.map((event) => (
            <LifeEventCard key={event.id} event={event} />
          ))}
          {events.length > 3 && (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={handleSeeAll}
              testID="btn-more"
            >
              <Text style={styles.moreBtnText}>
                Voir tous les événements ({events.length})
              </Text>
              <Ionicons name="arrow-forward" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
        </>
      )}

      {!hasAny && (
        <View style={styles.emptyState} testID="synthese-empty">
          <View style={styles.emptyIconWrap}>
            <Ionicons
              name="shield-checkmark-outline"
              size={48}
              color={colors.warmBorder}
            />
          </View>
          <Text style={styles.emptyTitle}>Tout va bien !</Text>
          <Text style={styles.emptySub}>
            Aucun événement de vie scolaire enregistré sur l'année en cours.
          </Text>
        </View>
      )}
    </ScrollView>
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
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingVertical: 13,
  },
  moreBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
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
