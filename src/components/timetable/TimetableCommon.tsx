import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  formatHumanDate,
  fullTeacherName,
  getOccurrenceTone,
  groupOccurrencesByDate,
  initials,
  minuteToTimeLabel,
  WEEKDAY_LABELS,
} from "../../utils/timetable";
import type {
  TimetableCalendarEvent,
  TimetableOccurrence,
  TimetableSubjectStyle,
} from "../../types/timetable.types";

export function SectionCard(props: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.card} testID={props.testID}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{props.title}</Text>
          {props.subtitle ? (
            <Text style={styles.cardSubtitle}>{props.subtitle}</Text>
          ) : null}
        </View>
        {props.action}
      </View>
      <View style={styles.cardBody}>{props.children}</View>
    </View>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <View style={styles.statusBlock}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

export function EmptyState(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={props.icon} size={30} color={colors.warmAccent} />
      <Text style={styles.emptyTitle}>{props.title}</Text>
      <Text style={styles.emptyMessage}>{props.message}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons
        name="alert-circle-outline"
        size={16}
        color={colors.warmAccent}
      />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function TextField(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  testID?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={props.keyboardType}
        style={styles.textInput}
        testID={props.testID}
      />
    </View>
  );
}

export function PillSelector(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <View style={styles.pillsRow}>
        {props.options.map((option) => {
          const selected = option.value === props.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => props.onChange(option.value)}
              testID={
                props.testIDPrefix
                  ? `${props.testIDPrefix}-${option.value}`
                  : undefined
              }
            >
              <Text
                style={[styles.pillText, selected && styles.pillTextSelected]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function OccurrencesAgenda(props: {
  occurrences: TimetableOccurrence[];
  subjectStyles: TimetableSubjectStyle[];
  emptyTitle: string;
  emptyMessage: string;
  testID?: string;
}) {
  const groups = groupOccurrencesByDate(props.occurrences);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon="calendar-clear-outline"
        title={props.emptyTitle}
        message={props.emptyMessage}
      />
    );
  }

  return (
    <View style={styles.agendaRoot} testID={props.testID}>
      {groups.map((group) => (
        <View key={group.date} style={styles.dayGroup}>
          <Text style={styles.dayLabel}>{formatHumanDate(group.date)}</Text>
          <View style={styles.dayItems}>
            {group.items.map((item) => {
              const tone = getOccurrenceTone(item, props.subjectStyles);
              const cancelled = item.status === "CANCELLED";
              return (
                <View key={item.id} style={styles.occurrenceRow}>
                  <View
                    style={[styles.occurrenceAccent, { backgroundColor: tone }]}
                  />
                  <View style={styles.occurrenceTimeCol}>
                    <Text style={styles.occurrenceTime}>
                      {minuteToTimeLabel(item.startMinute)}
                    </Text>
                    <Text style={styles.occurrenceTimeEnd}>
                      {minuteToTimeLabel(item.endMinute)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.occurrenceCard,
                      cancelled && styles.occurrenceCardCancelled,
                    ]}
                  >
                    <View style={styles.occurrenceTopRow}>
                      <Text
                        style={[
                          styles.occurrenceSubject,
                          cancelled && styles.occurrenceTextCancelled,
                        ]}
                      >
                        {item.subject.name}
                      </Text>
                      <View
                        style={[
                          styles.sourceBadge,
                          cancelled && styles.sourceBadgeCancelled,
                        ]}
                      >
                        <Text style={styles.sourceBadgeText}>
                          {item.source === "ONE_OFF"
                            ? "Exception"
                            : item.source === "EXCEPTION_OVERRIDE"
                              ? "Ajusté"
                              : WEEKDAY_LABELS[item.weekday]}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.occurrenceMeta,
                        cancelled && styles.occurrenceTextCancelled,
                      ]}
                    >
                      {fullTeacherName(item.teacherUser)} •{" "}
                      {item.room?.trim() ? item.room : "Salle à confirmer"}
                    </Text>
                    {item.reason ? (
                      <Text style={styles.occurrenceReason}>{item.reason}</Text>
                    ) : null}
                    {cancelled ? (
                      <Text style={styles.cancelBadge}>Cours annulé</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

export function CalendarEventList(props: {
  events: TimetableCalendarEvent[];
  onEdit?: (event: TimetableCalendarEvent) => void;
  onDelete?: (event: TimetableCalendarEvent) => void;
}) {
  if (props.events.length === 0) {
    return (
      <EmptyState
        icon="sunny-outline"
        title="Aucune fermeture enregistrée"
        message="Les jours fériés et vacances créés pour l'école apparaîtront ici."
      />
    );
  }

  return (
    <View style={styles.eventList}>
      {props.events.map((event) => (
        <View key={event.id} style={styles.eventRow}>
          <View style={styles.eventIcon}>
            <Ionicons
              name="sunny-outline"
              size={18}
              color={colors.warmAccent}
            />
          </View>
          <View style={styles.eventBody}>
            <Text style={styles.eventTitle}>{event.label}</Text>
            <Text style={styles.eventDates}>
              {formatHumanDate(event.startDate)} au{" "}
              {formatHumanDate(event.endDate)}
            </Text>
          </View>
          {props.onEdit ? (
            <TouchableOpacity
              style={styles.iconAction}
              onPress={() => props.onEdit?.(event)}
              testID={`calendar-event-edit-${event.id}`}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          ) : null}
          {props.onDelete ? (
            <TouchableOpacity
              style={styles.iconAction}
              onPress={() => props.onDelete?.(event)}
              testID={`calendar-event-delete-${event.id}`}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.notification}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function MiniIdentityCard(props: {
  title: string;
  subtitle: string;
  accent?: string;
}) {
  return (
    <View style={styles.identityCard}>
      <View
        style={[
          styles.identityAvatar,
          { backgroundColor: `${props.accent ?? colors.primary}18` },
        ]}
      >
        <Text
          style={[
            styles.identityAvatarText,
            { color: props.accent ?? colors.primary },
          ]}
        >
          {initials(props.title)}
        </Text>
      </View>
      <View style={styles.identityText}>
        <Text style={styles.identityTitle}>{props.title}</Text>
        <Text style={styles.identitySubtitle}>{props.subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  cardBody: {
    gap: 14,
  },
  statusBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 10,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.warmSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  textInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  pillTextSelected: {
    color: colors.white,
  },
  agendaRoot: {
    gap: 16,
  },
  dayGroup: {
    gap: 10,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  dayItems: {
    gap: 10,
  },
  occurrenceRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },
  occurrenceAccent: {
    width: 4,
    borderRadius: 999,
  },
  occurrenceTimeCol: {
    width: 56,
    paddingTop: 8,
    gap: 2,
  },
  occurrenceTime: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  occurrenceTimeEnd: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  occurrenceCard: {
    flex: 1,
    backgroundColor: colors.warmSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
    gap: 6,
  },
  occurrenceCardCancelled: {
    opacity: 0.72,
  },
  occurrenceTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  occurrenceSubject: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  occurrenceMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  occurrenceReason: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  occurrenceTextCancelled: {
    textDecorationLine: "line-through",
  },
  sourceBadge: {
    borderRadius: 999,
    backgroundColor: `${colors.primary}16`,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sourceBadgeCancelled: {
    backgroundColor: `${colors.notification}14`,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cancelBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.notification,
  },
  eventList: {
    gap: 10,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    padding: 12,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${colors.warmAccent}16`,
    alignItems: "center",
    justifyContent: "center",
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
  eventDates: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  iconAction: {
    padding: 6,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 18,
    padding: 14,
  },
  identityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  identityAvatarText: {
    fontSize: 16,
    fontWeight: "800",
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  identityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  identitySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
