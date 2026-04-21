/**
 * Écran Discipline — Vue teacher / admin (CRUD).
 *
 * 2 onglets :
 *  - Saisie    : formulaire de création d'un événement
 *  - Historique : liste avec édition inline et suppression
 *
 * Règles d'autorisation reproduites du web :
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
import { useAuthStore } from "../../../src/store/auth.store";
import { useDisciplineStore } from "../../../src/store/discipline.store";
import { disciplineApi } from "../../../src/api/discipline.api";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { DisciplineForm } from "../../../src/components/discipline/DisciplineForm";
import { DisciplineList } from "../../../src/components/discipline/DisciplineList";
import { DisciplineDeleteDialog } from "../../../src/components/discipline/DisciplineDeleteDialog";
import {
  AppShell,
  useDrawer,
} from "../../../src/components/navigation/AppShell";
import { HeaderBackButton } from "../../../src/components/navigation/HeaderBackButton";
import { HeaderMenuButton } from "../../../src/components/navigation/HeaderMenuButton";
import type {
  CreateLifeEventPayload,
  StudentLifeEvent,
} from "../../../src/types/discipline.types";

// ── Onglets ───────────────────────────────────────────────────────────────────

type TabKey = "saisie" | "historique";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "saisie", label: "Saisie", icon: "add-circle-outline" },
  { key: "historique", label: "Historique", icon: "list-outline" },
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
  const { studentId, studentName } = useLocalSearchParams<{
    studentId: string;
    studentName?: string;
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
  } = useDisciplineStore();
  const { showSuccess } = useSuccessToastStore();
  const { openDrawer } = useDrawer();

  const [tab, setTab] = useState<TabKey>("saisie");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<StudentLifeEvent | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<StudentLifeEvent | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const events: StudentLifeEvent[] = studentId
    ? (eventsMap[studentId] ?? [])
    : [];
  const isCached = studentId ? eventsMap[studentId] !== undefined : false;

  const userId = user?.id;
  const userRole = user?.activeRole ?? user?.role ?? null;

  const load = useCallback(async () => {
    if (!schoolSlug || !studentId) return;
    setLoadError(null);
    try {
      await loadEvents(schoolSlug, studentId, { scope: "current", limit: 200 });
    } catch {
      setLoadError("Impossible de charger l'historique.");
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

  // ── Création ────────────────────────────────────────────────────────────────

  async function handleCreate(values: CreateLifeEventPayload) {
    if (!schoolSlug || !studentId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const event = await disciplineApi.create(schoolSlug, studentId, values);
      addEvent(studentId, event);
      showSuccess({
        title: "Événement enregistré",
        message: "L'événement a bien été ajouté à l'historique discipline.",
      });
      setTab("historique");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Édition ─────────────────────────────────────────────────────────────────

  async function handleUpdate(values: CreateLifeEventPayload) {
    if (!schoolSlug || !studentId || !editingEvent) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await disciplineApi.update(
        schoolSlug,
        studentId,
        editingEvent.id,
        values,
      );
      updateEvent(studentId, updated);
      showSuccess({
        title: "Événement modifié",
        message: "Les changements ont bien été enregistrés.",
      });
      setEditingEvent(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la modification.";
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
        title: "Événement supprimé",
        message: "L'événement a été retiré de l'historique discipline.",
      });
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la suppression.";
      setSaveError(msg);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const displayName = studentName ?? "Élève";

  const content = (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="discipline-student-screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <HeaderBackButton onPress={() => router.back()} testID="btn-back" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Discipline
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={refresh}
            style={styles.iconBtn}
            testID="btn-refresh"
          >
            <Ionicons name="refresh-outline" size={20} color={colors.white} />
          </TouchableOpacity>
          <HeaderMenuButton onPress={openDrawer} testID="btn-menu" />
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => {
              setEditingEvent(null);
              setSaveError(null);
              setTab(t.key);
            }}
            testID={`tab-${t.key}`}
            accessibilityState={{ selected: tab === t.key }}
          >
            <Ionicons
              name={t.icon as "add-circle-outline"}
              size={15}
              color={tab === t.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}
            >
              {t.label}
            </Text>
            {t.key === "historique" && events.length > 0 && (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{events.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Erreur de chargement */}
      {loadError && (
        <View style={styles.errorBanner} testID="load-error">
          <Ionicons
            name="alert-circle-outline"
            size={15}
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
        {tab === "saisie" && (
          <DisciplineForm
            isSaving={isSaving}
            error={saveError}
            onSubmit={handleCreate}
            submitLabel="Enregistrer l'événement"
          />
        )}

        {tab === "historique" && editingEvent && (
          <DisciplineForm
            editing={editingEvent}
            isSaving={isSaving}
            error={saveError}
            onSubmit={handleUpdate}
            onCancel={() => {
              setEditingEvent(null);
              setSaveError(null);
            }}
            submitLabel="Enregistrer les modifications"
          />
        )}

        {tab === "historique" && !editingEvent && (
          <DisciplineList
            events={events}
            isLoading={isLoading && !isCached}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            showActions
            canEdit={(event) => canEditEvent(event, userId, userRole)}
            canDelete={(event) => canEditEvent(event, userId, userRole)}
            onEdit={(event) => {
              setSaveError(null);
              setEditingEvent(event);
            }}
            onDelete={(event) => setDeleteTarget(event)}
            emptyIcon="clipboard-outline"
            emptyTitle="Aucun événement"
            emptySub="Utilisez l'onglet Saisie pour enregistrer un premier événement."
            testID="list-historique"
          />
        )}
      </View>

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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.primary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.white,
    textTransform: "uppercase",
  },
  headerSub: { fontSize: 12, color: colors.warmAccent, marginTop: 1 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

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
});
