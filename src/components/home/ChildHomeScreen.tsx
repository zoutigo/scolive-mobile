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
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { notesApi } from "../../api/notes.api";
import { timetableApi } from "../../api/timetable.api";
import { messagingApi } from "../../api/messaging.api";
import { homeworkApi } from "../../api/homework.api";
import { feedApi } from "../../api/feed.api";
import type { MessageListItem } from "../../types/messaging.types";
import type { StudentNotesResponse } from "../../types/notes.types";
import type { MyTimetableResponse } from "../../types/timetable.types";
import type { HomeworkRow } from "../../types/homework.types";
import type { FeedPost } from "../../types/feed.types";
import { useTranslation } from "../../i18n/useTranslation";
import { ErrorBanner } from "../timetable/TimetableCommon";
import {
  formatEvaluationDate,
  formatScore,
  getCurrentTerm,
} from "../../utils/notes";

type DashboardState = {
  notes: StudentNotesResponse;
  timetable: MyTimetableResponse | null;
  unreadCount: number;
  unreadMessages: MessageListItem[];
  homework: HomeworkRow[];
  feedPosts: FeedPost[];
};

const INITIAL_STATE: DashboardState = {
  notes: [],
  timetable: null,
  unreadCount: 0,
  unreadMessages: [],
  homework: [],
  feedPosts: [],
};

function buildSubtitle(
  child:
    | { firstName: string; lastName: string; className?: string | null }
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

function formatShortDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function authorInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

type FlatEvaluation = {
  subject: string;
  score: number | null;
  maxScore: number;
  recordedAt: string;
};

function extractLatestEvaluations(
  notes: StudentNotesResponse,
  count: number,
): FlatEvaluation[] {
  const all: FlatEvaluation[] = [];
  for (const snapshot of notes) {
    for (const subject of snapshot.subjects) {
      for (const ev of subject.evaluations) {
        all.push({
          subject: subject.subjectLabel,
          score: ev.score,
          maxScore: ev.maxScore,
          recordedAt: ev.recordedAt,
        });
      }
    }
  }
  return all
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    )
    .slice(0, count);
}

export function ChildHomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = typeof params.childId === "string" ? params.childId : "";
  const { schoolSlug } = useAuthStore();
  const { children, setActiveChild, updateChild } = useFamilyStore();
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const child = children.find((entry) => entry.id === childId);

  const load = useCallback(
    async (mode: "load" | "refresh" = "load") => {
      if (!schoolSlug || !childId) return;
      if (mode === "load") setIsLoading(true);
      else setIsRefreshing(true);
      setErrorMessage(null);

      const currentChild = useFamilyStore
        .getState()
        .children.find((c) => c.id === childId);
      const classIdForHw = currentChild?.classId ?? null;

      const [notesRes, timetableRes, unreadRes, inboxRes, feedRes, hwRes] =
        await Promise.allSettled([
          notesApi.listStudentNotes(schoolSlug, childId),
          timetableApi.getMyTimetable(schoolSlug, { childId }),
          messagingApi.unreadCount(schoolSlug),
          messagingApi.list(schoolSlug, {
            folder: "inbox",
            page: 1,
            limit: 20,
          }),
          feedApi.list(schoolSlug, { viewScope: "GENERAL", limit: 2 }),
          classIdForHw
            ? homeworkApi.listClassHomework(schoolSlug, classIdForHw, {
                studentId: childId,
              })
            : Promise.resolve([] as HomeworkRow[]),
        ]);

      const notes =
        notesRes.status === "fulfilled" ? notesRes.value : INITIAL_STATE.notes;
      const timetable =
        timetableRes.status === "fulfilled"
          ? timetableRes.value
          : INITIAL_STATE.timetable;
      const unreadCount =
        unreadRes.status === "fulfilled"
          ? unreadRes.value
          : INITIAL_STATE.unreadCount;
      const allInbox =
        inboxRes.status === "fulfilled" ? inboxRes.value.items : [];
      const unreadMessages = allInbox.filter((m) => m.unread).slice(0, 3);
      const feedPosts =
        feedRes.status === "fulfilled"
          ? feedRes.value.items
          : INITIAL_STATE.feedPosts;
      let homework =
        hwRes.status === "fulfilled" ? hwRes.value : INITIAL_STATE.homework;

      const hasAnySuccess = [notesRes, timetableRes, unreadRes, inboxRes].some(
        (r) => r.status === "fulfilled",
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

      // Si classId était inconnu au départ (family store pas encore chargé),
      // l'emploi du temps vient de le fournir : on re-fetche les devoirs maintenant.
      if (classIdForHw === null && timetable?.class?.id) {
        try {
          homework = await homeworkApi.listClassHomework(
            schoolSlug,
            timetable.class.id,
            { studentId: childId },
          );
        } catch {
          homework = INITIAL_STATE.homework;
        }
      }

      setState({
        notes,
        timetable,
        unreadCount,
        unreadMessages,
        homework,
        feedPosts,
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
  const undoneHomework = useMemo(
    () => state.homework.filter((hw) => !hw.myDoneAt).length,
    [state.homework],
  );
  const latestEvaluations = useMemo(
    () => extractLatestEvaluations(state.notes, 3),
    [state.notes],
  );
  const classId = child?.classId ?? state.timetable?.class?.id ?? null;
  const subtitle = buildSubtitle(child, state.timetable);

  function goToNotes() {
    router.push({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId },
    });
  }
  function goToHomework() {
    if (!classId) return;
    router.push({
      pathname: "/(home)/classes/[classId]/homework",
      params: { classId, childId },
    });
  }
  function goToMessages() {
    router.push("/(home)/messages" as never);
  }
  function goToFeed() {
    router.push({
      pathname: "/(home)/children/[childId]/vie-de-classe",
      params: { childId },
    });
  }

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
          testID="child-home-header"
          backTestID="child-home-back"
          titleTestID="child-home-header-title"
          subtitleTestID="child-home-header-subtitle"
          topInset={insets.top}
        />

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        {isLoading ? (
          <View style={styles.loadingWrap} testID="child-home-loading">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.kpiRow} testID="child-home-kpi-row">
              <KpiCard
                testID="child-home-kpi-average"
                icon="school-outline"
                label="Moyenne"
                value={formatScore(snapshot?.generalAverage.student ?? null)}
                sub={snapshot?.label ?? "Aucune période"}
                accent={colors.primary}
                tone="#DDEBFA"
                onPress={goToNotes}
              />
              <KpiCard
                testID="child-home-kpi-homework"
                icon="book-outline"
                label={t("homework.label")}
                value={classId ? `${undoneHomework}` : "–"}
                sub={
                  classId
                    ? t("homework.kpi.notDone")
                    : t("homework.kpi.unknownClass")
                }
                accent={colors.warmAccent}
                tone="#F8E9D8"
                onPress={classId ? goToHomework : undefined}
              />
              <KpiCard
                testID="child-home-kpi-messages"
                icon="mail-outline"
                label={t("messaging.nav.unreadMessagesLabel")}
                value={`${state.unreadCount}`}
                sub={t("messaging.nav.unreadMessagesSub")}
                accent={colors.accentTeal}
                tone="#DCF3EE"
                onPress={goToMessages}
              />
            </View>

            <SectionBlock
              testID="child-home-evals-block"
              title="Dernières évaluations"
              icon="clipboard-outline"
              iconColor={colors.primary}
              iconTone="#DDEBFA"
              onPress={goToNotes}
              linkLabel="Toutes les notes"
            >
              {latestEvaluations.length === 0 ? (
                <EmptyRow
                  testID="child-home-evals-empty"
                  label="Aucune évaluation publiée"
                />
              ) : (
                latestEvaluations.map((ev, idx) => (
                  <EvalRow
                    key={`${ev.subject}-${ev.recordedAt}-${idx}`}
                    testID={`child-home-eval-row-${idx}`}
                    subject={ev.subject}
                    score={ev.score}
                    maxScore={ev.maxScore}
                    date={ev.recordedAt}
                    isLast={idx === latestEvaluations.length - 1}
                  />
                ))
              )}
            </SectionBlock>

            <SectionBlock
              testID="child-home-feed-block"
              title="Fil d'actualité"
              icon="newspaper-outline"
              iconColor="#6B5EA8"
              iconTone="#EAE7F8"
              onPress={goToFeed}
              linkLabel="Voir le fil"
            >
              {state.feedPosts.length === 0 ? (
                <EmptyRow
                  testID="child-home-feed-empty"
                  label="Aucune actualité récente"
                />
              ) : (
                state.feedPosts.map((post, idx) => (
                  <DataRow
                    key={post.id}
                    testID={`child-home-feed-row-${idx}`}
                    main={post.title}
                    secondary={authorInitials(post.author.fullName)}
                    date={post.createdAt}
                    isLast={idx === state.feedPosts.length - 1}
                    onPress={goToFeed}
                  />
                ))
              )}
            </SectionBlock>

            <SectionBlock
              testID="child-home-unread-block"
              title={t("messaging.nav.unreadMessagesTitle")}
              icon="chatbubble-ellipses-outline"
              iconColor={colors.accentTeal}
              iconTone="#DCF3EE"
              onPress={goToMessages}
              linkLabel={t("messaging.title")}
            >
              {state.unreadMessages.length === 0 ? (
                <EmptyRow
                  testID="child-home-unread-empty"
                  label={t("messaging.nav.noUnreadMessages")}
                />
              ) : (
                state.unreadMessages.map((msg, idx) => (
                  <DataRow
                    key={msg.id}
                    testID={`child-home-msg-row-${idx}`}
                    main={msg.subject}
                    secondary={
                      msg.sender
                        ? `${msg.sender.firstName} ${msg.sender.lastName}`
                        : t("messaging.list.unknownSender")
                    }
                    date={msg.createdAt}
                    isLast={idx === state.unreadMessages.length - 1}
                    onPress={goToMessages}
                  />
                ))
              )}
            </SectionBlock>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function KpiCard(props: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  tone: string;
  icon: string;
  testID: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.kpiCard, { backgroundColor: props.tone }]}
      activeOpacity={props.onPress ? 0.82 : 1}
      onPress={props.onPress}
      testID={props.testID}
      accessibilityRole="button"
    >
      <View style={styles.kpiTopRow}>
        <View
          style={[styles.kpiIconWrap, { backgroundColor: props.accent + "22" }]}
        >
          <Ionicons
            name={props.icon as "home"}
            size={15}
            color={props.accent}
          />
        </View>
        <Text
          style={[styles.kpiValue, { color: props.accent }]}
          numberOfLines={1}
        >
          {props.value}
        </Text>
      </View>
      <Text style={styles.kpiLabel}>{props.label}</Text>
      <Text style={styles.kpiSub} numberOfLines={1}>
        {props.sub}
      </Text>
    </TouchableOpacity>
  );
}

function SectionBlock(props: {
  testID: string;
  title: string;
  icon: string;
  iconColor: string;
  iconTone: string;
  onPress: () => void;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionBlock} testID={props.testID}>
      <View style={styles.sectionBlockHeader}>
        <View style={styles.sectionBlockLeft}>
          <View
            style={[
              styles.sectionBlockIcon,
              { backgroundColor: props.iconTone },
            ]}
          >
            <Ionicons
              name={props.icon as "home"}
              size={15}
              color={props.iconColor}
            />
          </View>
          <Text style={styles.sectionBlockTitle}>{props.title}</Text>
        </View>
        <TouchableOpacity
          onPress={props.onPress}
          testID={`${props.testID}-link`}
        >
          <Text style={[styles.sectionBlockLink, { color: props.iconColor }]}>
            {props.linkLabel}
          </Text>
        </TouchableOpacity>
      </View>
      {props.children}
    </View>
  );
}

function EvalRow(props: {
  testID: string;
  subject: string;
  score: number | null;
  maxScore: number;
  date: string;
  isLast: boolean;
}) {
  const scoreNum = props.score ?? -1;
  const ratio = props.maxScore > 0 ? scoreNum / props.maxScore : 0;
  const scoreColor =
    props.score === null
      ? colors.textSecondary
      : ratio >= 0.7
        ? colors.accentTeal
        : ratio >= 0.5
          ? colors.warmAccent
          : colors.notification;

  const scoreMain = props.score !== null ? formatScore(props.score) : "–";
  const scoreSub = `/${formatScore(props.maxScore)}`;

  return (
    <View
      style={[styles.dataRow, !props.isLast && styles.dataRowBorder]}
      testID={props.testID}
    >
      <Text style={styles.dataRowMain} numberOfLines={1}>
        {props.subject}
      </Text>
      <View style={styles.evalScoreWrap}>
        <Text style={[styles.evalScoreMain, { color: scoreColor }]}>
          {scoreMain}
        </Text>
        <Text style={styles.evalScoreSub}>{scoreSub}</Text>
      </View>
      <Text style={styles.dataRowDate}>{formatEvaluationDate(props.date)}</Text>
    </View>
  );
}

function DataRow(props: {
  testID: string;
  main: string;
  secondary: string;
  date: string;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.dataRow, !props.isLast && styles.dataRowBorder]}
      activeOpacity={0.75}
      testID={props.testID}
      onPress={props.onPress}
    >
      <Text style={styles.dataRowMain} numberOfLines={1}>
        {props.main}
      </Text>
      <Text style={styles.dataRowSecondary} numberOfLines={1}>
        {props.secondary}
      </Text>
      <Text style={styles.dataRowDate}>{formatShortDate(props.date)}</Text>
    </TouchableOpacity>
  );
}

function EmptyRow(props: { testID: string; label: string }) {
  return (
    <View style={styles.emptyRow} testID={props.testID}>
      <Text style={styles.emptyRowText}>{props.label}</Text>
    </View>
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

  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
    alignItems: "flex-start",
  },
  kpiTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
  },

  sectionBlock: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  sectionBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  sectionBlockLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionBlockIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBlockTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  sectionBlockLink: {
    fontSize: 12,
    fontWeight: "600",
  },

  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 8,
  },
  dataRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.warmBorder,
  },
  dataRowMain: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  evalScoreWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  evalScoreMain: {
    fontSize: 13,
    fontWeight: "700",
  },
  evalScoreSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  dataRowSecondary: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 110,
    textAlign: "right",
  },
  dataRowDate: {
    fontSize: 11,
    color: colors.textSecondary,
    minWidth: 44,
    textAlign: "right",
  },

  emptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  emptyRowText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
