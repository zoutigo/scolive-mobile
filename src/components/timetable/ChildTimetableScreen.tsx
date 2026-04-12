import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
import { useAuthStore } from "../../store/auth.store";
import { useTimetableStore } from "../../store/timetable.store";
import {
  buildDefaultDateRange,
  formatDateInput,
  formatHumanDate,
  parseDateInput,
} from "../../utils/timetable";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  MiniIdentityCard,
  OccurrencesAgenda,
  SectionCard,
  TextField,
} from "./TimetableCommon";

function shiftRange(value: { fromDate: string; toDate: string }, days: number) {
  const from = parseDateInput(value.fromDate);
  const to = parseDateInput(value.toDate);
  if (!from || !to) return value;
  from.setDate(from.getDate() + days);
  to.setDate(to.getDate() + days);
  return { fromDate: formatDateInput(from), toDate: formatDateInput(to) };
}

export function ChildTimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = typeof params.childId === "string" ? params.childId : "";
  const { schoolSlug } = useAuthStore();
  const {
    myTimetable,
    isLoadingMyTimetable,
    errorMessage,
    loadMyTimetable,
    clearError,
  } = useTimetableStore();
  const [range, setRange] = useState(buildDefaultDateRange());

  const load = useCallback(async () => {
    if (!schoolSlug || !childId) return;
    await loadMyTimetable(schoolSlug, {
      childId,
      fromDate: range.fromDate,
      toDate: range.toDate,
    });
  }, [childId, loadMyTimetable, range.fromDate, range.toDate, schoolSlug]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const headline = useMemo(() => {
    if (!myTimetable) return "Emploi du temps";
    return `${myTimetable.student.lastName} ${myTimetable.student.firstName}`;
  }, [myTimetable]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingMyTimetable}
            onRefresh={() => {
              clearError();
              void load().catch(() => {});
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            testID="child-timetable-back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Portail famille</Text>
            <Text style={styles.title}>{headline}</Text>
            <Text style={styles.subtitle}>
              Vue mobile de l'emploi du temps, optimisée pour un suivi rapide à
              la semaine.
            </Text>
          </View>
        </View>

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <SectionCard
          title="Période affichée"
          subtitle="Ajustez la fenêtre si vous voulez préparer la semaine suivante ou revoir les cours passés."
          action={
            <TouchableOpacity
              style={styles.reloadBtn}
              onPress={() => void load().catch(() => {})}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          }
        >
          <View style={styles.rangeRow}>
            <TextField
              label="Du"
              value={range.fromDate}
              onChangeText={(fromDate) =>
                setRange((current) => ({ ...current, fromDate }))
              }
              placeholder="2026-04-13"
              testID="child-timetable-from-date"
            />
            <TextField
              label="Au"
              value={range.toDate}
              onChangeText={(toDate) =>
                setRange((current) => ({ ...current, toDate }))
              }
              placeholder="2026-05-03"
              testID="child-timetable-to-date"
            />
          </View>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setRange((current) => shiftRange(current, -7))}
            >
              <Text style={styles.quickActionText}>Semaine précédente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setRange(buildDefaultDateRange())}
            >
              <Text style={styles.quickActionText}>Aujourd'hui</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setRange((current) => shiftRange(current, 7))}
            >
              <Text style={styles.quickActionText}>Semaine suivante</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {isLoadingMyTimetable && !myTimetable ? (
          <SectionCard title="Agenda">
            <LoadingBlock label="Chargement de l'emploi du temps..." />
          </SectionCard>
        ) : myTimetable ? (
          <>
            <MiniIdentityCard
              title={`${myTimetable.student.lastName} ${myTimetable.student.firstName}`}
              subtitle={`${myTimetable.class.name} • du ${formatHumanDate(range.fromDate)} au ${formatHumanDate(range.toDate)}`}
              accent={colors.warmAccent}
            />

            <SectionCard
              title="Agenda des cours"
              subtitle="Chaque créneau affiche la matière, l'enseignant et la salle. Les annulations restent visibles."
            >
              <OccurrencesAgenda
                occurrences={myTimetable.occurrences}
                subjectStyles={myTimetable.subjectStyles}
                emptyTitle="Aucun cours sur cette période"
                emptyMessage="Essayez une autre plage de dates pour consulter le reste du planning."
                testID="child-timetable-occurrences"
              />
            </SectionCard>

            <SectionCard
              title="Temps forts"
              subtitle="Fermetures et jours sans cours définis par l'établissement."
            >
              {myTimetable.calendarEvents.length === 0 ? (
                <EmptyState
                  icon="sunny-outline"
                  title="Pas d'événement particulier"
                  message="Les jours fériés ou congés connus sur cette période apparaîtront ici."
                />
              ) : (
                <View style={styles.eventList}>
                  {myTimetable.calendarEvents.map((event) => (
                    <View key={event.id} style={styles.eventRow}>
                      <Ionicons
                        name="sunny-outline"
                        size={18}
                        color={colors.warmAccent}
                      />
                      <View style={styles.eventBody}>
                        <Text style={styles.eventTitle}>{event.label}</Text>
                        <Text style={styles.eventText}>
                          {formatHumanDate(event.startDate)} au{" "}
                          {formatHumanDate(event.endDate)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          </>
        ) : (
          <SectionCard title="Agenda">
            <EmptyState
              icon="calendar-clear-outline"
              title="Impossible d'afficher ce planning"
              message="Vérifiez que l'enfant est bien lié à ce compte parent."
            />
          </SectionCard>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: colors.warmAccent,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}12`,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickAction: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  eventList: {
    gap: 10,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.warmSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
  },
  eventBody: {
    flex: 1,
    gap: 3,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  eventText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
