/**
 * Écran Discipline — Vue school admin / enseignant pour un élève donné.
 *
 * 2 onglets :
 *  - Synthèse   : KPI animés + derniers événements — FAB (+) pour créer via modale
 *  - Historique : liste éditable — FAB (+) pour créer, bouton modifier pour éditer via modale
 *
 * Règles d'autorisation :
 *  - TEACHER peut modifier / supprimer uniquement ses propres événements
 *  - SCHOOL_ADMIN, SCHOOL_MANAGER, SUPERVISOR peuvent tout modifier
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/theme";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { useAuthStore } from "../../../src/store/auth.store";
import { useDisciplineStore } from "../../../src/store/discipline.store";
import { disciplineApi } from "../../../src/api/discipline.api";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { DisciplineList } from "../../../src/components/discipline/DisciplineList";
import { DisciplineDeleteDialog } from "../../../src/components/discipline/DisciplineDeleteDialog";
import { DisciplineSummaryOverview } from "../../../src/components/discipline/DisciplineSummaryOverview";
import { StudentDisciplineEventModal } from "../../../src/components/discipline/StudentDisciplineEventModal";
import {
  AppShell,
} from "../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../../../src/components/navigation/BottomTabBar";
import type {
  CreateLifeEventPayload,
  StudentLifeEvent,
} from "../../../src/types/discipline.types";

// ── Onglets ───────────────────────────────────────────────────────────────────

type TabKey = "synthese" | "historique";

const TAB_KEYS: Array<{ key: TabKey; labelKey: string; icon: string }> = [
  {
    key: "synthese",
    labelKey: "discipline.tabs.synthesis",
    icon: "stats-chart-outline",
  },
  {
    key: "historique",
    labelKey: "discipline.tabs.history",
    icon: "list-outline",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const POWER_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
]);

function canEditEvent(
  event: StudentLifeEvent,
  userId: string | undefined,
  role: string | null,
): boolean {
  if (!role) return false;
  if (POWER_ROLES.has(role)) return true;
  if (role === "TEACHER") return event.authorUserId === userId;
  return false;
}

// ── Écran ─────────────────────────────────────────────────────────────────────

export default function DisciplineStudentScreen() {
  const { t } = useTranslation();
  const { studentId, studentName, className } = useLocalSearchParams<{
    studentId: string;
    studentName?: string;
    className?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug, user } = useAuthStore();
  const {
    eventsMap,
    isLoading,
    isRefreshing,
    loadEvents,
    refreshEvents,
    addEvent,
    updateEvent,
    removeEvent,
    getSummary,
  } = useDisciplineStore();
  const { showSuccess } = useSuccessToastStore();

  const [tab, setTab] = useState<TabKey>("synthese");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<StudentLifeEvent | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentLifeEvent | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const events: StudentLifeEvent[] = studentId
    ? (eventsMap[studentId] ?? [])
    : [];
  const isCached = studentId ? eventsMap[studentId] !== undefined : false;
  const summary = getSummary(studentId);

  const userId = user?.id;
  const userRole = user?.activeRole ?? user?.role ?? null;

  const load = useCallback(async () => {
    if (!schoolSlug || !studentId) return;
    setLoadError(null);
    try {
      await loadEvents(schoolSlug, studentId, { scope: "current", limit: 200 });
    } catch {
      setLoadError(t("discipline.errors.loadHistory"));
    }
  }, [schoolSlug, studentId, loadEvents]);

  const refresh = useCallback(async () => {
    if (!schoolSlug || !studentId) return;
    try {
      await refreshEvents(schoolSlug, studentId, {
        scope: "current",
        limit: 200,
      });
    } catch {
      // silencieux
    }
  }, [schoolSlug, studentId, refreshEvents]);

  useEffect(() => {
    if (!isCached) void load();
  }, [load, isCached]);

  // ── Ouverture modale ─────────────────────────────────────────────────────────

  function openCreateModal() {
    setEditingEvent(null);
    setSaveError(null);
    setModalVisible(true);
  }

  function openEditModal(event: StudentLifeEvent) {
    setEditingEvent(event);
    setSaveError(null);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingEvent(null);
    setSaveError(null);
  }

  // ── Création / Édition ───────────────────────────────────────────────────────

  async function handleSubmit(payload: CreateLifeEventPayload) {
    if (!schoolSlug || !studentId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingEvent) {
        const updated = await disciplineApi.update(
          schoolSlug,
          studentId,
          editingEvent.id,
          payload,
        );
        updateEvent(studentId, updated);
        showSuccess({
          title: t("discipline.toasts.eventUpdatedTitle"),
          message: t("discipline.toasts.eventUpdatedMessage"),
        });
      } else {
        const created = await disciplineApi.create(
          schoolSlug,
          studentId,
          payload,
        );
        addEvent(studentId, created);
        showSuccess({
          title: t("discipline.toasts.eventRegisteredTitle"),
          message: t("discipline.toasts.eventCreatedMessageHistory"),
        });
      }
      closeModal();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("discipline.errors.saveGeneric");
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Suppression ──────────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!schoolSlug || !studentId || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await disciplineApi.remove(schoolSlug, studentId, deleteTarget.id);
      removeEvent(studentId, deleteTarget.id);
      showSuccess({
        title: t("discipline.toasts.eventDeletedTitle"),
        message: t("discipline.toasts.eventDeletedMessageHistory"),
      });
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : t("discipline.errors.deleteGeneric");
      setSaveError(msg);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const displayName = studentName ?? t("discipline.header.student");
  const headerSubtitle = className
    ? `${displayName} · ${className}`
    : displayName;

  const content = (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="discipline-student-screen"
    >
      {/* Header */}
      <ModuleHeader
        title={t("discipline.header.discipline")}
        subtitle={headerSubtitle}
        onBack={() => router.back()}
        topInset={insets.top}
        testID="module-header"
        backTestID="btn-back"
        titleTestID="discipline-header-title"
        subtitleTestID="discipline-header-subtitle"
      />

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
              size={15}
              color={tab === item.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                tab === item.key && styles.tabLabelActive,
              ]}
            >
              {t(item.labelKey)}
            </Text>
            {item.key === "historique" && events.length > 0 ? (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{events.length}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Erreur de chargement */}
      {loadError ? (
        <View style={styles.errorBanner} testID="load-error">
          <Ionicons
            name="alert-circle-outline"
            size={15}
            color={colors.notification}
          />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity onPress={load} testID="btn-retry">
            <Text style={styles.retryText}>{t("discipline.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Contenu */}
      <View style={styles.body}>
        {tab === "synthese" ? (
          <View style={styles.body}>
            <DisciplineSummaryOverview
              summary={summary}
              events={events}
              isLoading={isLoading && !isCached}
              isRefreshing={isRefreshing}
              onRefresh={refresh}
              testID="synthese-tab"
            />
            <TouchableOpacity
              style={[styles.fab, { bottom: insets.bottom + 18 + BOTTOM_TAB_BAR_HEIGHT }]}
              onPress={openCreateModal}
              testID="fab-synthese"
              accessibilityLabel={t("discipline.fab.addEvent")}
            >
              <Ionicons name="add" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.body}>
            <DisciplineList
              events={events}
              isLoading={isLoading && !isCached}
              isRefreshing={isRefreshing}
              onRefresh={refresh}
              showActions
              canEdit={(event) => canEditEvent(event, userId, userRole)}
              canDelete={(event) => canEditEvent(event, userId, userRole)}
              onEdit={openEditModal}
              onDelete={(event) => setDeleteTarget(event)}
              emptyIcon="clipboard-outline"
              emptyTitle={t("discipline.empty.noEventsHistory.title")}
              emptySub={t("discipline.empty.noEventsHistory.message")}
              testID="list-historique"
            />
            <TouchableOpacity
              style={[styles.fab, { bottom: insets.bottom + 18 + BOTTOM_TAB_BAR_HEIGHT }]}
              onPress={openCreateModal}
              testID="fab-historique"
              accessibilityLabel={t("discipline.fab.addEvent")}
            >
              <Ionicons name="add" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modale création / modification */}
      <StudentDisciplineEventModal
        visible={modalVisible}
        editing={editingEvent}
        isSaving={isSaving}
        error={saveError}
        onClose={closeModal}
        onSubmit={(payload) => void handleSubmit(payload)}
      />

      {/* Dialog de suppression */}
      <DisciplineDeleteDialog
        event={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </KeyboardAvoidingView>
  );

  return <AppShell showHeader={false}>{content}</AppShell>;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

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
    gap: 5,
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  tabLabelActive: { color: colors.primary, fontWeight: "700" },

  countPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  countPillText: { fontSize: 10, fontWeight: "700", color: colors.white },

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

  body: { flex: 1 },

  fab: {
    position: "absolute",
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
