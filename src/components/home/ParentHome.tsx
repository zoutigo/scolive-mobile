import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useFamilyStore } from "../../store/family.store";
import { useMessagingStore } from "../../store/messaging.store";
import { buildChildHomeTarget } from "../navigation/nav-config";
import { useHeaderScroll } from "../navigation/header-scroll-context";
import { useTranslation } from "../../i18n/useTranslation";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import { useHomeHeaderHelpAction } from "../../hooks/useHomeHeaderHelpAction";
import { PageHelpModal } from "../help/PageHelpModal";
import { disciplineApi } from "../../api/discipline.api";
import { notesApi } from "../../api/notes.api";
import { authApi } from "../../api/auth.api";
import {
  buildAccountSummary,
  buildDisciplineSummary,
  buildNotesSummary,
  type ChildDisciplineSummary,
  type ChildNotesSummary,
  type ParentAccountSummary,
} from "./parent-dashboard-logic";
import {
  PARENT_LANDING_TOUR_ID,
  PARENT_LANDING_TOUR_STEPS,
  PARENT_LANDING_TOUR_TARGETS,
} from "./parent-landing-tour.config";
import type { AuthUser } from "../../types/auth.types";
import type { ParentChild } from "../../types/family.types";

interface ParentHomeProps {
  user: AuthUser;
  schoolSlug: string | null;
}

export function ParentHome({ schoolSlug }: ParentHomeProps) {
  const { t, locale } = useTranslation();
  const { children, isLoading, setActiveChild } = useFamilyStore();
  const { unreadCount, loadUnreadCount } = useMessagingStore();
  const router = useRouter();
  const { onScroll } = useHeaderScroll();
  const [helpVisible, setHelpVisible] = useState(false);
  const [disciplineSummaries, setDisciplineSummaries] = useState<
    ChildDisciplineSummary[]
  >([]);
  const [notesSummaries, setNotesSummaries] = useState<ChildNotesSummary[]>([]);
  const [accountSummary, setAccountSummary] =
    useState<ParentAccountSummary | null>(null);

  useEffect(() => {
    if (!schoolSlug) return;
    loadUnreadCount(schoolSlug).catch(() => {});
  }, [loadUnreadCount, schoolSlug]);

  useEffect(() => {
    if (!schoolSlug || children.length === 0) {
      setDisciplineSummaries([]);
      setNotesSummaries([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      children.map(async (child) => {
        const [lifeEvents, notes] = await Promise.all([
          disciplineApi.list(schoolSlug, child.id).catch(() => []),
          notesApi.listStudentNotes(schoolSlug, child.id).catch(() => []),
        ]);
        return {
          discipline: buildDisciplineSummary(child, lifeEvents, t),
          notes: buildNotesSummary(child, notes, t),
        };
      }),
    ).then((results) => {
      if (cancelled) return;
      setDisciplineSummaries(results.map((entry) => entry.discipline));
      setNotesSummaries(results.map((entry) => entry.notes));
    });

    return () => {
      cancelled = true;
    };
  }, [schoolSlug, children, locale]);

  useEffect(() => {
    if (!schoolSlug) return;
    let cancelled = false;

    authApi
      .parentDashboardSummary(schoolSlug)
      .then((payload) => {
        if (cancelled) return;
        setAccountSummary(buildAccountSummary(payload, t));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [schoolSlug, locale]);

  useOnboardingTourTrigger({
    tourId: PARENT_LANDING_TOUR_ID,
    role: "parent",
    steps: PARENT_LANDING_TOUR_STEPS,
  });

  useHomeHeaderHelpAction(
    {
      label: t("home.parent.help.toggle"),
      testID: "parent-landing-help-toggle",
      tourTargetId: PARENT_LANDING_TOUR_TARGETS.helpButton,
    },
    () => setHelpVisible(true),
  );

  function handleChildPress(child: ParentChild) {
    setActiveChild(child.id);
    router.push(buildChildHomeTarget(child.id) as never);
  }

  function handleDisciplinePress(childId: string) {
    router.push({
      pathname: "/(home)/discipline/[childId]",
      params: { childId },
    } as never);
  }

  function handleNotesPress(childId: string) {
    router.push({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId },
    } as never);
  }

  function handleQuickAccessPress(id: string, label: string) {
    if (id === "fil-d-actualit") {
      router.push("/(home)/feed");
      return;
    }

    if (id === "messagerie") {
      router.push("/(home)/messages");
      return;
    }

    router.push({
      pathname: "/placeholder",
      params: { title: label },
    });
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <View style={styles.banner}>
          <Text style={styles.greeting}>
            {t("home.hero.greeting")} {t("home.hero.role.parent")}
          </Text>
          <View
            style={[styles.rolePill, { backgroundColor: colors.warmAccent }]}
          >
            <Text style={styles.rolePillText}>
              {t("home.hero.role.parent")}
            </Text>
          </View>
        </View>

        {/* Mes enfants */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("home.parent.children.title")}
            </Text>
            {children.length > 0 && (
              <View style={styles.countBadge} testID="children-count-badge">
                <Text style={styles.countBadgeText}>{children.length}</Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : children.length === 0 ? (
            <View style={styles.childrenCard}>
              <View style={styles.childrenEmpty}>
                <Ionicons
                  name="people-circle-outline"
                  size={42}
                  color={colors.warmBorder}
                />
                <Text style={styles.emptyTitle}>
                  {t("home.parent.children.empty.title")}
                </Text>
                <Text style={styles.emptySub}>
                  {t("home.parent.children.empty.subtitle")}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.childrenList}>
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  onPress={handleChildPress}
                />
              ))}
            </View>
          )}
        </View>

        {/* Discipline */}
        {disciplineSummaries.length > 0 ? (
          <View testID="parent-discipline-section">
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              {t("home.parent.dashboard.disciplineTitle")}
            </Text>
            <View style={styles.cardsList}>
              {disciplineSummaries.map((summary) => (
                <TouchableOpacity
                  key={summary.childId}
                  style={styles.summaryCard}
                  activeOpacity={0.8}
                  onPress={() => handleDisciplinePress(summary.childId)}
                  testID={`discipline-summary-${summary.childId}`}
                >
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardName}>
                      {summary.childName}
                    </Text>
                    <View
                      style={[
                        styles.toneChip,
                        { backgroundColor: toneColor(summary.statusTone) },
                      ]}
                    >
                      <Text style={styles.toneChipText}>
                        {summary.statusLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.summaryCardDetail}>{summary.detail}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{summary.absences}</Text>
                      <Text style={styles.statLabel}>
                        {t("home.parent.dashboard.stats.absences")}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{summary.retards}</Text>
                      <Text style={styles.statLabel}>
                        {t("home.parent.dashboard.stats.retards")}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{summary.incidents}</Text>
                      <Text style={styles.statLabel}>
                        {t("home.parent.dashboard.stats.incidents")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.summaryCardLink}>
                    {t("home.parent.dashboard.openDetail")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Évaluations */}
        {notesSummaries.length > 0 ? (
          <View testID="parent-evaluations-section">
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              {t("home.parent.dashboard.evaluationsTitle")}
            </Text>
            <View style={styles.cardsList}>
              {notesSummaries.map((summary) => (
                <TouchableOpacity
                  key={summary.childId}
                  style={styles.summaryCard}
                  activeOpacity={0.8}
                  onPress={() => handleNotesPress(summary.childId)}
                  testID={`notes-summary-${summary.childId}`}
                >
                  <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardName}>
                      {summary.childName}
                    </Text>
                    <Text style={styles.summaryAverage}>
                      {summary.averageLabel}
                    </Text>
                  </View>
                  <Text style={styles.summaryCardDetail}>
                    {summary.trendLabel}
                  </Text>
                  {summary.latestEvaluations.map((evaluation) => (
                    <View key={evaluation.id} style={styles.evalRow}>
                      <Text style={styles.evalSubject} numberOfLines={1}>
                        {evaluation.subjectLabel}
                      </Text>
                      <Text style={styles.evalScore}>
                        {evaluation.score}/{evaluation.maxScore}
                      </Text>
                      <Text style={styles.evalDate}>
                        {evaluation.recordedAtLabel}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.summaryCardLink}>
                    {t("home.parent.dashboard.evaluationsOpenLink")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Compte */}
        {accountSummary ? (
          <View testID="parent-account-section">
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              {t("home.parent.dashboard.accountTitle")}
            </Text>
            <View style={styles.accountCard}>
              <Text style={styles.accountHeadline}>
                {accountSummary.headline}
              </Text>
              <Text style={styles.accountDetail}>{accountSummary.detail}</Text>
              {accountSummary.items.map((item) => (
                <View key={item.id} style={styles.accountItemRow}>
                  <View style={styles.accountItemText}>
                    <Text style={styles.accountItemLabel}>{item.label}</Text>
                    <Text style={styles.accountItemDetail}>{item.detail}</Text>
                  </View>
                  <Text
                    style={[
                      styles.accountItemValue,
                      { color: toneColor(item.tone) },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Accès rapides */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          {t("home.parent.quickAccess.title")}
        </Text>
        <View style={styles.quickGrid}>
          {[
            {
              id: "fil-d-actualit",
              icon: "newspaper-outline",
              label: t("home.parent.quickAccess.feed.label"),
              sub: t("home.parent.quickAccess.feed.sub"),
              color: colors.primary,
            },
            {
              id: "finances",
              icon: "wallet-outline",
              label: t("home.parent.quickAccess.finance.label"),
              sub: t("home.parent.quickAccess.finance.sub"),
              color: colors.accentTeal,
            },
            {
              id: "messagerie",
              icon: "chatbubble-outline",
              label: t("home.parent.quickAccess.messaging.label"),
              sub: t("home.parent.quickAccess.messaging.sub"),
              color: "#6B5EA8",
            },
            {
              id: "documents",
              icon: "document-outline",
              label: t("home.parent.quickAccess.documents.label"),
              sub: t("home.parent.quickAccess.documents.sub"),
              color: colors.warmAccent,
            },
          ].map((item) => {
            const isMessaging = item.id === "messagerie";
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.quickCard}
                activeOpacity={0.75}
                onPress={() => handleQuickAccessPress(item.id, item.label)}
                testID={`quick-link-${item.id}`}
              >
                {isMessaging && unreadCount > 0 ? (
                  <View
                    style={styles.quickBadge}
                    testID="quick-link-messagerie-badge"
                  >
                    <Text style={styles.quickBadgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: item.color + "18" },
                  ]}
                >
                  <Ionicons
                    name={item.icon as "home"}
                    size={24}
                    color={item.color}
                  />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
                <Text style={styles.quickSub}>{item.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Actualités */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.parent.news.title")}</Text>
          <TouchableOpacity onPress={() => router.push("/(home)/feed")}>
            <Text style={styles.sectionLink}>
              {t("home.parent.news.seeAll")}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.newsCard}>
          <View style={styles.newsEmpty}>
            <Ionicons
              name="newspaper-outline"
              size={36}
              color={colors.warmBorder}
            />
            <Text style={styles.emptyTitle}>
              {t("home.parent.news.empty.title")}
            </Text>
            <Text style={styles.emptySub}>
              {t("home.parent.news.empty.subtitle")}
            </Text>
          </View>
        </View>
      </ScrollView>
      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("home.parent.help.title")}
        sections={[
          {
            title: t("home.parent.help.section1Title"),
            body: [t("home.parent.help.section1Body")],
          },
          {
            title: t("home.parent.help.section2Title"),
            body: [t("home.parent.help.section2Body")],
          },
          {
            title: t("home.parent.help.section3Title"),
            body: [t("home.parent.help.section3Body")],
          },
          {
            title: t("home.parent.help.section4Title"),
            body: [t("home.parent.help.section4Body")],
          },
        ]}
        closeLabel={t("home.parent.help.close")}
        testID="parent-landing-help-modal"
      />
    </>
  );
}

function toneColor(tone: "calm" | "watch" | "alert" | "neutral"): string {
  if (tone === "alert") return colors.notification;
  if (tone === "watch") return colors.warmAccent;
  return colors.accentTeal;
}

// ── Carte enfant ─────────────────────────────────────────────────────────────

interface ChildCardProps {
  child: ParentChild;
  onPress: (child: ParentChild) => void;
}

function ChildCard({ child, onPress }: ChildCardProps) {
  return (
    <TouchableOpacity
      style={styles.childCard}
      activeOpacity={0.75}
      onPress={() => onPress(child)}
      testID={`child-card-${child.id}`}
    >
      <Text style={styles.childName}>
        {child.lastName} {child.firstName}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.3)" />
    </TouchableOpacity>
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
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  greeting: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rolePill: {
    flexShrink: 0,
    marginLeft: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePillText: { color: colors.white, fontSize: 11, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { color: colors.white, fontSize: 12, fontWeight: "700" },

  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
  },

  childrenCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
    marginBottom: 20,
  },
  childrenEmpty: { alignItems: "center", padding: 32, gap: 8 },
  childrenList: {
    gap: 8,
    marginBottom: 20,
  },

  // Carte enfant — nom seul
  childCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  childName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
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

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    width: "47.5%",
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
  },
  quickBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  quickSub: { fontSize: 12, color: colors.textSecondary },

  newsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
  },
  newsEmpty: { alignItems: "center", padding: 32, gap: 8 },

  cardsList: { gap: 10, marginBottom: 4 },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
  },
  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  summaryCardName: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summaryCardDetail: { fontSize: 12, color: colors.textSecondary },
  summaryCardLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  summaryAverage: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  toneChip: {
    flexShrink: 0,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toneChipText: { color: colors.white, fontSize: 11, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  statItem: { alignItems: "flex-start" },
  statValue: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  evalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  evalSubject: { flex: 1, fontSize: 13, color: colors.textPrimary },
  evalScore: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  evalDate: { fontSize: 11, color: colors.textSecondary },

  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 10,
  },
  accountHeadline: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  accountDetail: { fontSize: 12, color: colors.textSecondary },
  accountItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  accountItemText: { flex: 1, minWidth: 0 },
  accountItemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  accountItemDetail: { fontSize: 11, color: colors.textSecondary },
  accountItemValue: { fontSize: 16, fontWeight: "700" },
});
