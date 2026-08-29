import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useHeaderScroll } from "../navigation/header-scroll-context";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useSelfStudentContext } from "../../hooks/useSelfStudentContext";
import { notesApi } from "../../api/notes.api";
import { timetableApi } from "../../api/timetable.api";
import { homeworkApi } from "../../api/homework.api";
import { formatScore, getCurrentTerm } from "../../utils/notes";
import { minuteToTimeLabel, toIsoDateString } from "../../utils/timetable";
import type { StudentNotesResponse } from "../../types/notes.types";
import type { TimetableOccurrence } from "../../types/timetable.types";
import type { HomeworkRow } from "../../types/homework.types";
import type { AuthUser } from "../../types/auth.types";

interface StudentHomeProps {
  user: AuthUser;
  schoolSlug: string | null;
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

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

function formatEvalDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- contrat de props commun aux écrans d'accueil (schoolSlug re-résolu via useAuthStore/useSelfStudentContext)
export function StudentHome(props: StudentHomeProps) {
  const { t } = useTranslation();
  const { onScroll } = useHeaderScroll();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const selfContext = useSelfStudentContext();

  const [notes, setNotes] = useState<StudentNotesResponse>([]);
  const [todayOccurrences, setTodayOccurrences] = useState<
    TimetableOccurrence[]
  >([]);
  const [homework, setHomework] = useState<HomeworkRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const dayLabel = DAY_LABELS[now.getDay()];
  const dateStr = `${dayLabel} ${now.getDate()} ${MONTH_LABELS[now.getMonth()]}`;

  const load = useCallback(async () => {
    if (!schoolSlug || !selfContext.studentId) return;
    setIsLoading(true);
    const today = toIsoDateString(new Date());
    const [notesRes, timetableRes, hwRes] = await Promise.allSettled([
      notesApi.listStudentNotes(schoolSlug, selfContext.studentId),
      timetableApi.getMyTimetable(schoolSlug, {}),
      selfContext.classId
        ? homeworkApi.listClassHomework(schoolSlug, selfContext.classId, {
            studentId: selfContext.studentId,
          })
        : Promise.resolve([] as HomeworkRow[]),
    ]);

    setNotes(notesRes.status === "fulfilled" ? notesRes.value : []);
    setTodayOccurrences(
      timetableRes.status === "fulfilled"
        ? timetableRes.value.occurrences
            .filter(
              (occ) => occ.status === "PLANNED" && occ.occurrenceDate === today,
            )
            .sort((a, b) => a.startMinute - b.startMinute)
        : [],
    );
    setHomework(hwRes.status === "fulfilled" ? hwRes.value : []);
    setIsLoading(false);
  }, [schoolSlug, selfContext.studentId, selfContext.classId]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentTerm = useMemo(() => getCurrentTerm(), []);
  const snapshot =
    notes.find((entry) => entry.term === currentTerm) ?? notes[0] ?? null;
  const undoneHomework = useMemo(
    () => homework.filter((hw) => !hw.myDoneAt).length,
    [homework],
  );
  const latestEvaluations = useMemo(
    () => extractLatestEvaluations(notes, 3),
    [notes],
  );

  function goToNotes() {
    router.push("/notes/me" as never);
  }
  function goToTimetable() {
    router.push("/timetable/me" as never);
  }
  function goToHomework() {
    router.push("/homework/me" as never);
  }
  function goToMessages() {
    router.push("/messages" as never);
  }
  function goToDocuments() {
    router.push({
      pathname: "/placeholder",
      params: { title: "Documents" },
    } as never);
  }

  const isBusy = isLoading || selfContext.isLoading;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Hero */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.greeting} numberOfLines={1}>
            {t("home.hero.greeting")} {t("home.hero.role.student")}
          </Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
        <View style={[styles.rolePill, { backgroundColor: colors.accentTeal }]}>
          <Text style={styles.rolePillText}>{t("home.hero.role.student")}</Text>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow} testID="student-home-stats-row">
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={goToNotes}
          testID="student-home-stat-average"
        >
          <View
            style={[
              styles.statIcon,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Ionicons name="ribbon" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatScore(snapshot?.generalAverage.student ?? null)}
          </Text>
          <Text style={styles.statLabel}>Moyenne</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={goToNotes}
          testID="student-home-stat-subjects"
        >
          <View
            style={[
              styles.statIcon,
              { backgroundColor: colors.accentTeal + "18" },
            ]}
          >
            <Ionicons name="book" size={20} color={colors.accentTeal} />
          </View>
          <Text style={[styles.statValue, { color: colors.accentTeal }]}>
            {snapshot ? `${snapshot.subjects.length}` : "—"}
          </Text>
          <Text style={styles.statLabel}>Matières</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={goToHomework}
          testID="student-home-stat-homework"
        >
          <View
            style={[
              styles.statIcon,
              { backgroundColor: colors.warmAccent + "18" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.warmAccent}
            />
          </View>
          <Text style={[styles.statValue, { color: colors.warmAccent }]}>
            {selfContext.classId ? `${undoneHomework}` : "—"}
          </Text>
          <Text style={styles.statLabel}>Homework</Text>
        </TouchableOpacity>
      </View>

      {isBusy ? (
        <View style={styles.loadingWrap} testID="student-home-loading">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Today's timetable */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cours du jour</Text>
            <TouchableOpacity onPress={goToTimetable}>
              <Text style={styles.sectionLink}>Emploi du temps</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card} testID="student-home-today-card">
            {todayOccurrences.length === 0 ? (
              <View style={styles.emptyBlock} testID="student-home-today-empty">
                <Ionicons
                  name="calendar-outline"
                  size={36}
                  color={colors.warmBorder}
                />
                <Text style={styles.emptyTitle}>Aucun cours aujourd'hui</Text>
                <Text style={styles.emptySub}>Profitez de votre journée !</Text>
              </View>
            ) : (
              todayOccurrences.map((occ, idx) => (
                <TouchableOpacity
                  key={occ.id}
                  style={[
                    styles.occurrenceRow,
                    idx === todayOccurrences.length - 1 &&
                      styles.rowLastNoBorder,
                  ]}
                  onPress={goToTimetable}
                  testID={`student-home-today-row-${idx}`}
                >
                  <Text style={styles.occurrenceTime}>
                    {minuteToTimeLabel(occ.startMinute)}
                  </Text>
                  <View style={styles.occurrenceMain}>
                    <Text style={styles.occurrenceSubject} numberOfLines={1}>
                      {occ.subject.name}
                    </Text>
                    <Text style={styles.occurrenceSub} numberOfLines={1}>
                      {occ.teacherUser.lastName} {occ.teacherUser.firstName}
                      {occ.room ? ` • ${occ.room}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Recent grades */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dernières notes</Text>
            <TouchableOpacity onPress={goToNotes}>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card} testID="student-home-grades-card">
            {latestEvaluations.length === 0 ? (
              <View
                style={styles.emptyBlock}
                testID="student-home-grades-empty"
              >
                <Ionicons
                  name="ribbon-outline"
                  size={36}
                  color={colors.warmBorder}
                />
                <Text style={styles.emptyTitle}>Aucune note récente</Text>
                <Text style={styles.emptySub}>
                  Vos dernières évaluations apparaîtront ici
                </Text>
              </View>
            ) : (
              latestEvaluations.map((ev, idx) => (
                <TouchableOpacity
                  key={`${ev.subject}-${ev.recordedAt}-${idx}`}
                  style={[
                    styles.occurrenceRow,
                    idx === latestEvaluations.length - 1 &&
                      styles.rowLastNoBorder,
                  ]}
                  onPress={goToNotes}
                  testID={`student-home-grade-row-${idx}`}
                >
                  <View style={styles.occurrenceMain}>
                    <Text style={styles.occurrenceSubject} numberOfLines={1}>
                      {ev.subject}
                    </Text>
                    <Text style={styles.occurrenceSub}>
                      {formatEvalDate(ev.recordedAt)}
                    </Text>
                  </View>
                  <Text style={styles.gradeValue}>
                    {formatScore(ev.score)}/{ev.maxScore}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}

      {/* Quick links */}
      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>
        Accès rapides
      </Text>
      <View style={styles.quickRow}>
        {[
          {
            icon: "journal-outline",
            label: "Homework",
            color: colors.primary,
            onPress: goToHomework,
            testID: "student-home-quick-homework",
          },
          {
            icon: "chatbubble-outline",
            label: "Messages",
            color: "#6B5EA8",
            onPress: goToMessages,
            testID: "student-home-quick-messages",
          },
          {
            icon: "document-outline",
            label: "Documents",
            color: colors.warmAccent,
            onPress: goToDocuments,
            testID: "student-home-quick-documents",
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.quickBtn}
            activeOpacity={0.75}
            onPress={item.onPress}
            testID={item.testID}
          >
            <View
              style={[styles.quickIcon, { backgroundColor: item.color + "18" }]}
            >
              <Ionicons
                name={item.icon as "home"}
                size={22}
                color={item.color}
              />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },

  banner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  bannerLeft: { flex: 1, minWidth: 0, gap: 4 },
  greeting: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  rolePill: {
    flexShrink: 0,
    marginLeft: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePillText: { color: colors.white, fontSize: 11, fontWeight: "600" },
  dateText: { fontSize: 12, color: colors.textSecondary },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },

  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionLink: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    marginBottom: 16,
    overflow: "hidden",
  },
  emptyBlock: {
    alignItems: "center",
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
  },

  occurrenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  rowLastNoBorder: {
    borderBottomWidth: 0,
  },
  occurrenceTime: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    width: 44,
  },
  occurrenceMain: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  occurrenceSubject: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  occurrenceSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gradeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
});
