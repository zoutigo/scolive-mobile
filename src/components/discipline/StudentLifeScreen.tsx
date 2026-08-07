/**
 * Écran Vie scolaire — composant central partagé (lecture seule).
 *
 * Réutilisé par deux points d'entrée fins :
 *  - la vue Parent (`app/(home)/vie-scolaire/[childId].tsx`), qui résout
 *    `studentId` depuis l'enfant sélectionné dans le family store ;
 *  - la vue Élève self (`app/(home)/vie-scolaire/me.tsx`), qui résout sa
 *    propre identité via `useSelfStudentContext`.
 *
 * 3 onglets :
 *  - Synthèse    : KPI animés + derniers événements par type
 *  - Absences & Retards : liste filtrée
 *  - Sanctions & Punitions : liste filtrée
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useDisciplineStore } from "../../store/discipline.store";
import { badgesApi } from "../../api/badges.api";
import { useBadgesStore } from "../../store/badges.store";
import { ReadonlyDisciplineList } from "./ReadonlyDisciplineList";
import { DisciplineSummaryOverview } from "./DisciplineSummaryOverview";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { PageHelpModal } from "../help/PageHelpModal";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import {
  VIE_SCOLAIRE_TOUR_ID,
  VIE_SCOLAIRE_TOUR_STEPS,
  VIE_SCOLAIRE_TOUR_TARGETS,
} from "./vie-scolaire-tour.config";
import type {
  DisciplineSummary,
  StudentLifeEvent,
} from "../../types/discipline.types";

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

export type StudentLifeScreenProps = {
  studentId: string;
  studentLabel: string;
  onBack: () => void;
  /** Notifie le parent de la classe résolue depuis les événements chargés
   * (utilisé par la vue Parent pour tenir à jour le family store — sans
   * lien vers ce store depuis ce composant partagé). */
  onClassLabelResolved?: (classLabel: string) => void;
  /** "student" quand l'élève consulte sa propre vie scolaire, "parent"
   * quand un parent consulte celle d'un enfant. L'aide guidée (tour +
   * modale) est déclenchée pour les deux rôles. */
  viewerRole: "student" | "parent";
};

export function StudentLifeScreen({
  studentId,
  studentLabel,
  onBack,
  onClassLabelResolved,
  viewerRole,
}: StudentLifeScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { schoolSlug } = useAuthStore();
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
  const [helpVisible, setHelpVisible] = useState(false);

  useOnboardingTourTrigger({
    tourId: VIE_SCOLAIRE_TOUR_ID,
    role: viewerRole,
    steps: VIE_SCOLAIRE_TOUR_STEPS,
  });

  const events: StudentLifeEvent[] = eventsMap[studentId] ?? [];
  const isCached = eventsMap[studentId] !== undefined;
  const summary = getSummary(studentId);

  const absencesRetards = events.filter(
    (e) => e.type === "ABSENCE" || e.type === "RETARD",
  );
  const sanctionsPunitions = events.filter(
    (e) => e.type === "SANCTION" || e.type === "PUNITION",
  );

  const load = useCallback(async () => {
    if (!schoolSlug || !studentId) return;
    setLoadError(null);
    try {
      await loadEvents(schoolSlug, studentId, { scope: "current", limit: 200 });
    } catch {
      setLoadError(t("discipline.errors.loadData"));
    }
  }, [schoolSlug, studentId, loadEvents]);

  const refresh = useCallback(async () => {
    if (!schoolSlug || !studentId) return;
    setLoadError(null);
    try {
      await refreshEvents(schoolSlug, studentId, {
        scope: "current",
        limit: 200,
      });
    } catch {
      setLoadError(t("discipline.errors.refreshData"));
    }
  }, [schoolSlug, studentId, refreshEvents]);

  useEffect(() => {
    if (!isCached) {
      void load();
    }
  }, [load, isCached]);

  // Consultation de la vie scolaire d'un élève = lecture des événements
  // discipline de cet élève : remet le badge (icône app + nav) à zéro.
  // Sans cet appel, le compteur `disciplineUnread` ne redescend jamais
  // (il se base côté API sur un readMarker jamais posé par le client).
  // Le store de badges n'est resynchronisé qu'au retour en foreground de
  // l'app — on force ici un rechargement immédiat pour que le badge
  // disparaisse dès la sortie de cet écran, pas seulement après un cycle
  // background/foreground.
  useEffect(() => {
    if (!schoolSlug || !studentId) return;
    badgesApi
      .markRead(schoolSlug, "DISCIPLINE", studentId)
      .then(() => useBadgesStore.getState().loadSummary(schoolSlug))
      .catch(() => {
        // silencieux : ne bloque jamais la consultation pour un souci réseau
      });
  }, [schoolSlug, studentId]);

  const classLabel =
    events.find((event) => event.class?.name)?.class?.name?.trim() ?? "";
  const subtitle = classLabel
    ? `${studentLabel} • ${classLabel}`
    : studentLabel;

  useEffect(() => {
    if (!classLabel) return;
    onClassLabelResolved?.(classLabel);
  }, [classLabel, onClassLabelResolved]);

  return (
    <View style={styles.root} testID="vie-scolaire-screen">
      {/* Header */}
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={t("discipline.header.vieScolaire")}
          subtitle={subtitle}
          onBack={onBack}
          testID="vie-scolaire-header"
          backTestID="btn-back"
          titleTestID="vie-scolaire-header-title"
          subtitleTestID="vie-scolaire-header-subtitle"
          topInset={insets.top}
          helpAction={{
            label: t("discipline.vieScolaire.help.menuLabel"),
            onPress: () => setHelpVisible(true),
            testID: "vie-scolaire-help-menu-item",
          }}
          menuTourTargetId={VIE_SCOLAIRE_TOUR_TARGETS.helpToggle}
        />
      </View>

      {/* Onglets */}
      <OnboardingTarget id={VIE_SCOLAIRE_TOUR_TARGETS.tabs} style={styles.tabs}>
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
      </OnboardingTarget>

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
            kpisTourTargetId={VIE_SCOLAIRE_TOUR_TARGETS.kpis}
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

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={
          tab === "synthese"
            ? t("discipline.vieScolaire.help.synthese.title")
            : tab === "absences"
              ? t("discipline.vieScolaire.help.absences.title")
              : t("discipline.vieScolaire.help.sanctions.title")
        }
        sections={
          tab === "synthese"
            ? [
                {
                  title: t(
                    "discipline.vieScolaire.help.synthese.section1Title",
                  ),
                  body: [
                    t("discipline.vieScolaire.help.synthese.section1Body"),
                  ],
                },
                {
                  title: t(
                    "discipline.vieScolaire.help.synthese.section2Title",
                  ),
                  body: [
                    t("discipline.vieScolaire.help.synthese.section2Body"),
                  ],
                },
              ]
            : tab === "absences"
              ? [
                  {
                    title: t(
                      "discipline.vieScolaire.help.absences.section1Title",
                    ),
                    body: [
                      t("discipline.vieScolaire.help.absences.section1Body"),
                    ],
                  },
                ]
              : [
                  {
                    title: t(
                      "discipline.vieScolaire.help.sanctions.section1Title",
                    ),
                    body: [
                      t("discipline.vieScolaire.help.sanctions.section1Body"),
                    ],
                  },
                ]
        }
        closeLabel={t("discipline.vieScolaire.help.close")}
        testID="vie-scolaire-help-modal"
      />
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
  kpisTourTargetId?: string;
}

function SyntheseTab({
  summary,
  events,
  isLoading,
  isRefreshing,
  onRefresh,
  kpisTourTargetId,
}: SyntheseProps) {
  return (
    <DisciplineSummaryOverview
      summary={summary}
      events={events}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      testID="synthese-tab"
      kpisTourTargetId={kpisTourTargetId}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerWrap: {},

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
