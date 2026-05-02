import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useDrawer } from "../navigation/drawer-context";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { notesApi } from "../../api/notes.api";
import { disciplineApi } from "../../api/discipline.api";
import { timetableApi } from "../../api/timetable.api";
import { messagingApi } from "../../api/messaging.api";
import {
  computeDisciplineSummary,
  type StudentLifeEvent,
} from "../../types/discipline.types";
import type { MessageListItem } from "../../types/messaging.types";
import type { StudentNotesResponse } from "../../types/notes.types";
import type {
  MyTimetableResponse,
  TimetableOccurrence,
} from "../../types/timetable.types";
import {
  EmptyState,
  ErrorBanner,
  SectionCard,
} from "../timetable/TimetableCommon";
import { formatScore, getBestSubject, getCurrentTerm } from "../../utils/notes";
import { minuteToTimeLabel } from "../../utils/timetable";

type DashboardState = {
  notes: StudentNotesResponse;
  events: StudentLifeEvent[];
  timetable: MyTimetableResponse | null;
  unreadCount: number;
  latestMessage: MessageListItem | null;
};

const INITIAL_STATE: DashboardState = {
  notes: [],
  events: [],
  timetable: null,
  unreadCount: 0,
  latestMessage: null,
};

function buildSubtitle(
  child:
    | {
        firstName: string;
        lastName: string;
        className?: string | null;
      }
    | undefined,
  timetable: MyTimetableResponse | null,
) {
  const childLabel = child
    ? `${child.firstName} ${child.lastName}`
    : timetable
      ? `${timetable.student.firstName} ${timetable.student.lastName}`
      : "Élève";
  const classLabel =
    child?.className?.trim() || timetable?.class.name?.trim() || "";
  return classLabel ? `${childLabel} • ${classLabel}` : childLabel;
}

function findNextOccurrence(occurrences: TimetableOccurrence[]) {
  const now = Date.now();
  return occurrences
    .filter((entry) => (entry.status ?? "PLANNED") === "PLANNED")
    .sort((a, b) =>
      `${a.occurrenceDate}-${a.startMinute}`.localeCompare(
        `${b.occurrenceDate}-${b.startMinute}`,
      ),
    )
    .find((entry) => {
      const startsAt = new Date(
        `${entry.occurrenceDate}T${minuteToTimeLabel(entry.startMinute)}:00`,
      ).getTime();
      return startsAt >= now - 15 * 60 * 1000;
    });
}

function formatMessageDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ChildHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = typeof params.childId === "string" ? params.childId : "";
  const { schoolSlug } = useAuthStore();
  const { openDrawer } = useDrawer();
  const { children, setActiveChild, updateChild } = useFamilyStore();
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const child = children.find((entry) => entry.id === childId);

  const load = useCallback(
    async (mode: "load" | "refresh" = "load") => {
      if (!schoolSlug || !childId) return;
      if (mode === "load") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      const results = await Promise.allSettled([
        notesApi.listStudentNotes(schoolSlug, childId),
        disciplineApi.list(schoolSlug, childId, {
          scope: "current",
          limit: 20,
        }),
        timetableApi.getMyTimetable(schoolSlug, { childId }),
        messagingApi.unreadCount(schoolSlug),
        messagingApi.list(schoolSlug, { folder: "inbox", page: 1, limit: 1 }),
      ]);

      const notes =
        results[0].status === "fulfilled"
          ? results[0].value
          : INITIAL_STATE.notes;
      const events =
        results[1].status === "fulfilled"
          ? results[1].value
          : INITIAL_STATE.events;
      const timetable =
        results[2].status === "fulfilled"
          ? results[2].value
          : INITIAL_STATE.timetable;
      const unreadCount =
        results[3].status === "fulfilled"
          ? results[3].value
          : INITIAL_STATE.unreadCount;
      const latestMessage =
        results[4].status === "fulfilled"
          ? (results[4].value.items[0] ?? null)
          : INITIAL_STATE.latestMessage;

      const hasAnySuccess = results.some(
        (entry) => entry.status === "fulfilled",
      );
      if (!hasAnySuccess) {
        setErrorMessage("Impossible de charger la synthèse de l'enfant.");
      }

      if (timetable) {
        updateChild(childId, {
          firstName: timetable.student.firstName,
          lastName: timetable.student.lastName,
          classId: timetable.class.id,
          className: timetable.class.name,
        });
      }

      setState({
        notes,
        events,
        timetable,
        unreadCount,
        latestMessage,
      });
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [childId, schoolSlug, updateChild],
  );

  useEffect(() => {
    if (!childId) return;
    setActiveChild(childId);
  }, [childId, setActiveChild]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentTerm = useMemo(() => getCurrentTerm(), []);
  const snapshot =
    state.notes.find((entry) => entry.term === currentTerm) ??
    state.notes[0] ??
    null;
  const disciplineSummary = useMemo(
    () => computeDisciplineSummary(state.events),
    [state.events],
  );
  const nextOccurrence = useMemo(
    () => findNextOccurrence(state.timetable?.occurrences ?? []),
    [state.timetable?.occurrences],
  );
  const bestSubject = useMemo(
    () => getBestSubject(snapshot?.subjects ?? []),
    [snapshot?.subjects],
  );
  const classId = child?.classId ?? state.timetable?.class?.id ?? null;
  const subtitle = buildSubtitle(child, state.timetable);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 0, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void load("refresh");
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ModuleHeader
          title="Accueil enfant"
          subtitle={subtitle}
          onBack={() => router.push("/" as never)}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          testID="child-home-header"
          backTestID="child-home-back"
          titleTestID="child-home-header-title"
          subtitleTestID="child-home-header-subtitle"
          rightTestID="child-home-menu"
          topInset={insets.top}
        />

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        {isLoading ? (
          <View style={styles.loadingWrap} testID="child-home-loading">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.heroCard} testID="child-home-hero">
              <View style={styles.heroBadge}>
                <Ionicons
                  name="grid-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Vue d&apos;ensemble</Text>
                <Text style={styles.heroSubtitle}>
                  Retrouvez en un coup d&apos;oeil les notes, la vie scolaire,
                  la messagerie et les prochains cours de l&apos;enfant.
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <SummaryStat
                testID="child-home-stat-average"
                label="Moyenne générale"
                value={formatScore(snapshot?.generalAverage.student ?? null)}
                hint={snapshot?.label ?? "Aucune période publiée"}
                accent={colors.primary}
                tone="#DDEBFA"
              />
              <SummaryStat
                testID="child-home-stat-messages"
                label="Messages non lus"
                value={`${state.unreadCount}`}
                hint={
                  state.latestMessage?.subject
                    ? state.latestMessage.subject
                    : "Aucun message récent"
                }
                accent={colors.accentTeal}
                tone="#DCF3EE"
              />
              <SummaryStat
                testID="child-home-stat-discipline"
                label="Vie scolaire"
                value={`${state.events.length}`}
                hint={
                  disciplineSummary.unjustifiedAbsences > 0
                    ? `${disciplineSummary.unjustifiedAbsences} absence non justifiée`
                    : "Aucun point de vigilance"
                }
                accent={colors.warmAccent}
                tone="#F8E9D8"
              />
            </View>

            <SectionCard
              title="Aujourd'hui"
              subtitle="Prochain créneau identifié"
              testID="child-home-today-card"
            >
              {nextOccurrence ? (
                <View style={styles.detailBlock}>
                  <Text style={styles.detailTitle}>
                    {minuteToTimeLabel(nextOccurrence.startMinute)} -{" "}
                    {minuteToTimeLabel(nextOccurrence.endMinute)} ·{" "}
                    {nextOccurrence.subject.name}
                  </Text>
                  <Text style={styles.detailMeta}>
                    {nextOccurrence.teacherUser.lastName.toUpperCase()}{" "}
                    {nextOccurrence.teacherUser.firstName}
                  </Text>
                  <Text style={styles.detailAccent}>
                    {nextOccurrence.room?.trim()
                      ? `Salle ${nextOccurrence.room}`
                      : "Salle à confirmer"}
                  </Text>
                </View>
              ) : (
                <EmptyState
                  icon="calendar-clear-outline"
                  title="Aucun prochain cours"
                  message="Le prochain créneau de l'enfant apparaîtra ici."
                />
              )}
            </SectionCard>

            <View style={styles.row}>
              <SectionCard
                title="Suivi scolaire"
                subtitle={snapshot?.generatedAtLabel || "Aucune note publiée"}
                testID="child-home-notes-card"
              >
                <View style={styles.detailBlock}>
                  <MetricLine
                    label="Moyenne"
                    value={formatScore(
                      snapshot?.generalAverage.student ?? null,
                    )}
                  />
                  <MetricLine
                    label="Matière forte"
                    value={
                      bestSubject
                        ? `${bestSubject.subjectLabel} · ${formatScore(bestSubject.studentAverage)}`
                        : "-"
                    }
                  />
                </View>
              </SectionCard>

              <SectionCard
                title="Vie scolaire"
                subtitle="Synthèse de l'année en cours"
                testID="child-home-discipline-card"
              >
                <View style={styles.detailBlock}>
                  <MetricLine
                    label="Absences non justifiées"
                    value={`${disciplineSummary.unjustifiedAbsences}`}
                  />
                  <MetricLine
                    label="Sanctions / punitions"
                    value={`${disciplineSummary.sanctions + disciplineSummary.punitions}`}
                  />
                </View>
              </SectionCard>
            </View>

            <SectionCard
              title="Accès rapides"
              subtitle="Modules de l'enfant"
              testID="child-home-links-card"
            >
              <View style={styles.quickGrid}>
                <QuickLink
                  label="Notes"
                  hint="Évaluations et moyennes"
                  onPress={() =>
                    router.push({
                      pathname: "/(home)/notes/child/[childId]",
                      params: { childId },
                    })
                  }
                  testID="child-home-link-notes"
                />
                <QuickLink
                  label="Vie scolaire"
                  hint="Absences et sanctions"
                  onPress={() =>
                    router.push({
                      pathname: "/(home)/vie-scolaire/[childId]",
                      params: { childId },
                    })
                  }
                  testID="child-home-link-life"
                />
                <QuickLink
                  label="Vie de classe"
                  hint="Fil et actualités"
                  onPress={() =>
                    router.push({
                      pathname: "/(home)/children/[childId]/vie-de-classe",
                      params: { childId },
                    })
                  }
                  testID="child-home-link-class-life"
                />
                <QuickLink
                  label="Emploi du temps"
                  hint="Cours et créneaux"
                  onPress={() =>
                    router.push(`/timetable/child/${childId}` as never)
                  }
                  testID="child-home-link-timetable"
                />
                {classId ? (
                  <QuickLink
                    label="Devoirs"
                    hint="Travaux à rendre"
                    onPress={() =>
                      router.push({
                        pathname: "/(home)/classes/[classId]/homework",
                        params: { classId, childId },
                      })
                    }
                    testID="child-home-link-homework"
                  />
                ) : null}
                <QuickLink
                  label="Messagerie"
                  hint="Échanges et suivi"
                  onPress={() => router.push("/(home)/messages" as never)}
                  testID="child-home-link-messages"
                />
              </View>
            </SectionCard>

            <SectionCard
              title="Dernier message"
              subtitle="Boîte de réception"
              testID="child-home-last-message-card"
            >
              {state.latestMessage ? (
                <View style={styles.detailBlock}>
                  <Text style={styles.detailTitle}>
                    {state.latestMessage.subject}
                  </Text>
                  <Text style={styles.detailMeta}>
                    {state.latestMessage.preview}
                  </Text>
                  <Text style={styles.detailMuted}>
                    {formatMessageDate(state.latestMessage.createdAt)}
                  </Text>
                </View>
              ) : (
                <EmptyState
                  icon="mail-open-outline"
                  title="Aucun message récent"
                  message="Les derniers échanges apparaîtront ici."
                />
              )}
            </SectionCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryStat(props: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  tone: string;
  testID: string;
}) {
  return (
    <View
      style={[styles.statCard, { backgroundColor: props.tone }]}
      testID={props.testID}
    >
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={[styles.statValue, { color: props.accent }]}>
        {props.value}
      </Text>
      <Text style={styles.statHint}>{props.hint}</Text>
    </View>
  );
}

function MetricLine(props: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

function QuickLink(props: {
  label: string;
  hint: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={props.onPress}
      activeOpacity={0.82}
      testID={props.testID}
    >
      <Text style={styles.quickLabel}>{props.label}</Text>
      <Text style={styles.quickHint}>{props.hint}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  loadingWrap: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    marginTop: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#DDEBFA",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  statsGrid: {
    gap: 10,
  },
  statCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  statValue: {
    marginTop: 8,
    fontSize: 29,
    fontWeight: "800",
  },
  statHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  row: {
    gap: 14,
  },
  detailBlock: {
    gap: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  detailMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailAccent: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  detailMuted: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  quickGrid: {
    gap: 10,
  },
  quickCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  quickHint: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
