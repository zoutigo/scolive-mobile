import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTeacherDashboard } from "../../hooks/useTeacherDashboard";
import { useMessagingStore } from "../../store/messaging.store";
import type { AuthUser } from "../../types/auth.types";
import { colors } from "../../theme";
import {
  buildTeacherClassHomeworkTarget,
  buildTeacherClassNotesTarget,
} from "../navigation/nav-config";
import { useDrawer } from "../navigation/AppShell";
import { minuteToTimeLabel, parseDateInput } from "../../utils/timetable";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_GAP = 8;
const CARD_H_PADDING = 16;
const CARD_W = (SCREEN_W - CARD_H_PADDING * 2 - CARD_GAP * 2) / 3;

const ACCENT = {
  classes: colors.primary,
  messages: "#6B5EA8",
  timetable: colors.accentTeal,
  evaluations: "#C84B11",
  homework: "#2E7D32",
} as const;

const CLASS_PALETTE = [
  "#08467D",
  "#247C72",
  "#6B5EA8",
  "#C84B11",
  "#2E7D32",
  "#7B5C00",
] as const;

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

function formatShortDate(isoDate: string): string {
  const d = parseDateInput(isoDate.slice(0, 10));
  if (!d) return isoDate;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function SectionCard({
  title,
  icon,
  color,
  count,
  linkLabel,
  subtitle,
  onHeaderPress,
  children,
  testID,
}: {
  title: string;
  icon: string;
  color: string;
  count?: number;
  linkLabel?: string;
  subtitle?: string;
  onHeaderPress?: () => void;
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.sectionCard} testID={testID}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View
            style={[styles.sectionIconBox, { backgroundColor: color + "1A" }]}
          >
            <Ionicons name={icon as "home"} size={18} color={color} />
          </View>
          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle ? (
              <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
          {count !== undefined && count > 0 ? (
            <View style={[styles.countBadge, { backgroundColor: color }]}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          ) : null}
        </View>
        {onHeaderPress ? (
          <TouchableOpacity
            style={styles.sectionLinkBtn}
            onPress={onHeaderPress}
            activeOpacity={0.7}
            testID={testID ? `${testID}-link` : undefined}
          >
            <Text style={[styles.sectionLinkText, { color }]}>
              {linkLabel ?? "Voir tout"}
            </Text>
            <Ionicons name="arrow-forward" size={11} color={color} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function EmptyRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.emptyRow}>
      <Ionicons name={icon as "home"} size={18} color={colors.warmBorder} />
      <Text style={styles.emptyRowText}>{text}</Text>
    </View>
  );
}

function DataRow({
  left,
  children,
  right,
  onPress,
  testID,
}: {
  left: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.dataRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      testID={testID}
    >
      {left}
      <View style={styles.dataRowContent}>{children}</View>
      {right ?? null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={13} color={colors.warmBorder} />
      ) : null}
    </TouchableOpacity>
  );
}

interface TeacherHomeProps {
  user: AuthUser;
  schoolSlug: string | null;
}

export function TeacherHome({ user, schoolSlug }: TeacherHomeProps) {
  const router = useRouter();
  const { setFolder } = useMessagingStore();
  const { openDrawerForClass } = useDrawer();
  const { data, isLoading, error, refresh } = useTeacherDashboard(
    schoolSlug,
    user.id,
  );

  const now = new Date();
  const todayLabel = `${DAY_LABELS[now.getDay()]} ${now.getDate()} ${MONTH_LABELS[now.getMonth()]} ${now.getFullYear()}`;
  const schoolDisplay = schoolSlug
    ? schoolSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Mon établissement";

  function goToMessages() {
    setFolder("inbox");
    router.push("/(home)/messages");
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading && !!data}
          onRefresh={() => void refresh().catch(() => {})}
          tintColor={colors.primary}
        />
      }
      testID="teacher-home-scroll"
    >
      {/* Banner */}
      <View style={styles.banner} testID="teacher-home-banner">
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.bannerName}>
              {user.firstName} {user.lastName}
            </Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Enseignant(e)</Text>
          </View>
        </View>
        <View style={styles.schoolRow}>
          <Ionicons name="business" size={13} color={colors.textSecondary} />
          <Text style={styles.schoolLabel}>{schoolDisplay}</Text>
          <Text style={styles.dateText}>{todayLabel}</Text>
        </View>
      </View>

      {/* Loading initial */}
      {isLoading && !data ? (
        <View style={styles.loadingCard} testID="dashboard-loading">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement du tableau de bord…</Text>
        </View>
      ) : null}

      {/* Erreur */}
      {error && !data ? (
        <View style={styles.errorCard} testID="dashboard-error">
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={ACCENT.evaluations}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => void refresh().catch(() => {})}
            style={styles.retryBtn}
            testID="dashboard-retry"
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Grille classes — 3 colonnes, transparent, au flush du padding écran */}
      <View style={styles.classesGrid} testID="section-classes">
        {!data ? (
          <EmptyRow icon="hourglass-outline" text="Chargement…" />
        ) : data.classes.length === 0 ? (
          <EmptyRow icon="school-outline" text="Aucune classe assignée" />
        ) : (
          <View style={styles.classesRow}>
            {data.classes.map((cls, idx) => {
              const bg = CLASS_PALETTE[idx % CLASS_PALETTE.length]!;
              return (
                <TouchableOpacity
                  key={cls.classId}
                  style={[styles.classCard, { backgroundColor: bg }]}
                  onPress={() => openDrawerForClass(cls.classId)}
                  activeOpacity={0.82}
                  testID={`class-card-${cls.classId}`}
                >
                  {/* Cercle décoratif en filigrane */}
                  <View style={styles.classCardDecor} pointerEvents="none" />

                  {/* Ligne 1 : nom + nb élèves */}
                  <View style={styles.classCardTopRow}>
                    <Text style={styles.classCardName} numberOfLines={1}>
                      {cls.className}
                    </Text>
                    <View style={styles.classCardCountPill}>
                      <Text style={styles.classCardCountText}>
                        {cls.studentCount}
                      </Text>
                    </View>
                  </View>

                  {/* Ligne 2 : devs + evals */}
                  <Text style={styles.classCardStats}>
                    {cls.openHomeworkCount}
                    {" devs · "}
                    {cls.pendingEvalCount}
                    {" evals"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Messages non lus */}
      <SectionCard
        title="Messages non lus"
        icon="chatbubble"
        color={ACCENT.messages}
        count={data?.unreadCount}
        onHeaderPress={goToMessages}
        linkLabel="Messagerie"
        testID="section-messages"
      >
        {!data ? (
          <EmptyRow icon="hourglass-outline" text="Chargement…" />
        ) : data.unreadCount === 0 ? (
          <EmptyRow
            icon="checkmark-circle-outline"
            text="Aucun message non lu"
          />
        ) : (
          data.unreadMessages.map((msg) => (
            <DataRow
              key={msg.id}
              left={
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: ACCENT.messages + "1A" },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={15}
                    color={ACCENT.messages}
                  />
                </View>
              }
              onPress={goToMessages}
              testID={`message-row-${msg.id}`}
            >
              <Text style={styles.rowTitle} numberOfLines={1}>
                {msg.subject}
              </Text>
              {msg.sender ? (
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {msg.sender.firstName} {msg.sender.lastName}
                </Text>
              ) : null}
            </DataRow>
          ))
        )}
      </SectionCard>

      {/* Emploi du temps du jour */}
      <SectionCard
        title="Emploi du temps du jour"
        icon="calendar"
        color={ACCENT.timetable}
        subtitle={todayLabel}
        onHeaderPress={() => router.push("/(home)/agenda")}
        linkLabel="Agenda"
        testID="section-timetable"
      >
        {!data ? (
          <EmptyRow icon="hourglass-outline" text="Chargement…" />
        ) : data.todaySlots.length === 0 ? (
          <EmptyRow
            icon="calendar-clear-outline"
            text="Aucun cours planifié aujourd'hui"
          />
        ) : (
          data.todaySlots.map((slot) => (
            <DataRow
              key={slot.id}
              left={
                <View
                  style={[
                    styles.timeBadge,
                    {
                      backgroundColor: ACCENT.timetable + "1A",
                      borderColor: ACCENT.timetable + "30",
                    },
                  ]}
                >
                  <Text
                    style={[styles.timeBadgeText, { color: ACCENT.timetable }]}
                  >
                    {minuteToTimeLabel(slot.startMinute)}
                  </Text>
                  <Text style={styles.timeSep}>→</Text>
                  <Text
                    style={[styles.timeBadgeText, { color: ACCENT.timetable }]}
                  >
                    {minuteToTimeLabel(slot.endMinute)}
                  </Text>
                </View>
              }
              onPress={() => router.push("/(home)/agenda")}
              testID={`timetable-slot-${slot.id}`}
            >
              <Text style={styles.rowTitle} numberOfLines={1}>
                {slot.subject.name}
              </Text>
              <View style={styles.slotMeta}>
                <Text style={styles.rowSubtitle}>{slot.className}</Text>
                {slot.room ? (
                  <Text style={styles.rowSubtitle}> · {slot.room}</Text>
                ) : null}
              </View>
            </DataRow>
          ))
        )}
      </SectionCard>

      {/* Évaluations à saisir */}
      <SectionCard
        title="Évaluations à saisir"
        icon="journal"
        color={ACCENT.evaluations}
        count={data?.pendingEvaluations.length}
        onHeaderPress={() => router.push("/(home)/notes")}
        linkLabel="Cahier de notes"
        testID="section-evaluations"
      >
        {!data ? (
          <EmptyRow icon="hourglass-outline" text="Chargement…" />
        ) : data.pendingEvaluations.length === 0 ? (
          <EmptyRow
            icon="checkmark-circle-outline"
            text="Toutes les notes sont à jour"
          />
        ) : (
          data.pendingEvaluations.map((item) => (
            <DataRow
              key={item.evaluation.id}
              left={
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: ACCENT.evaluations + "1A" },
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={15}
                    color={ACCENT.evaluations}
                  />
                </View>
              }
              right={
                <View
                  style={[
                    styles.scoreBadge,
                    { borderColor: ACCENT.evaluations + "40" },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreBadgeText,
                      { color: ACCENT.evaluations },
                    ]}
                  >
                    {item.evaluation._count.scores}/{item.studentCount}
                  </Text>
                </View>
              }
              onPress={() =>
                router.push(buildTeacherClassNotesTarget(item.classId))
              }
              testID={`eval-row-${item.evaluation.id}`}
            >
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.evaluation.title}
              </Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {item.className}
              </Text>
            </DataRow>
          ))
        )}
      </SectionCard>

      {/* Devoirs */}
      <SectionCard
        title="Devoirs"
        icon="document-text"
        color={ACCENT.homework}
        count={data?.openHomework.length}
        onHeaderPress={() => router.push("/(home)/notes")}
        linkLabel="Voir tout"
        testID="section-homework"
      >
        {!data ? (
          <EmptyRow icon="hourglass-outline" text="Chargement…" />
        ) : data.openHomework.length === 0 ? (
          <EmptyRow
            icon="checkmark-circle-outline"
            text="Aucun devoir en cours"
          />
        ) : (
          data.openHomework.map((item) => {
            const done = item.homework.summary?.doneStudents ?? 0;
            const total = item.totalStudents;
            return (
              <DataRow
                key={item.homework.id}
                left={
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: ACCENT.homework + "1A" },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={15}
                      color={ACCENT.homework}
                    />
                  </View>
                }
                right={
                  <View style={styles.hwRight}>
                    <View
                      style={[
                        styles.scoreBadge,
                        { borderColor: ACCENT.homework + "40" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreBadgeText,
                          { color: ACCENT.homework },
                        ]}
                      >
                        {done}/{total}
                      </Text>
                    </View>
                    <View style={styles.dueBadge}>
                      <Ionicons
                        name="calendar-outline"
                        size={10}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.dueDateText}>
                        {formatShortDate(item.homework.expectedAt)}
                      </Text>
                    </View>
                  </View>
                }
                onPress={() =>
                  router.push(buildTeacherClassHomeworkTarget(item.classId))
                }
                testID={`homework-row-${item.homework.id}`}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.homework.title}
                </Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {item.className}
                </Text>
              </DataRow>
            );
          })
        )}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: CARD_H_PADDING, paddingBottom: 40, gap: 14 },

  banner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 20,
    gap: 10,
  },
  bannerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: { fontSize: 13, color: colors.textSecondary },
  bannerName: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  rolePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.accentTeal,
  },
  rolePillText: { color: colors.white, fontSize: 11, fontWeight: "600" },
  schoolRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  schoolLabel: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  dateText: { fontSize: 12, color: colors.textSecondary },

  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 18,
  },
  loadingText: { fontSize: 13, color: colors.textSecondary },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF5F0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFCCBB",
    padding: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: ACCENT.evaluations,
  },
  retryText: { color: colors.white, fontSize: 12, fontWeight: "600" },

  classesGrid: {
    // Transparent, sans border ni bg — au flush du padding écran
  },
  classesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  classCard: {
    width: CARD_W,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  classCardDecor: {
    position: "absolute",
    right: -18,
    top: -18,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  classCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  classCardName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
    flex: 1,
  },
  classCardCountPill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  classCardCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  classCardStats: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.82)",
    marginTop: 2,
  },

  // Section card
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  sectionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitleWrap: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  countBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  countBadgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  sectionLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingLeft: 10,
    flexShrink: 0,
  },
  sectionLinkText: { fontSize: 11, fontWeight: "600" },
  sectionBody: { paddingVertical: 4 },

  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dataRowContent: { flex: 1, minWidth: 0 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  rowSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  scoreBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: colors.white,
    flexShrink: 0,
  },
  scoreBadgeText: { fontSize: 11, fontWeight: "700" },

  hwRight: { alignItems: "flex-end", gap: 3, flexShrink: 0 },
  dueBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  dueDateText: { fontSize: 10, color: colors.textSecondary },

  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
    gap: 3,
    flexShrink: 0,
  },
  timeBadgeText: { fontSize: 11, fontWeight: "700" },
  timeSep: { fontSize: 9, color: colors.textSecondary },
  slotMeta: { flexDirection: "row", alignItems: "center" },

  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyRowText: { fontSize: 13, color: colors.textSecondary },
});
