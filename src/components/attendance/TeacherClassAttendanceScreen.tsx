import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { attendanceApi } from "../../api/attendance.api";
import type { AttendanceRoster } from "../../types/attendance.types";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { DatePickerField } from "../DatePickerField";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { PageHelpModal } from "../help/PageHelpModal";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";
import {
  TEACHER_ATTENDANCE_TOUR_ID,
  TEACHER_ATTENDANCE_TOUR_STEPS,
  TEACHER_ATTENDANCE_TOUR_TARGETS,
} from "./teacher-attendance-tour.config";
import { moduleBack } from "../../utils/moduleBack";

function todayIsoDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

export function TeacherClassAttendanceScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [roster, setRoster] = useState<AttendanceRoster | null>(null);
  const [absentStudentIds, setAbsentStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  useOnboardingTourTrigger({
    tourId: TEACHER_ATTENDANCE_TOUR_ID,
    role: "teacher",
    steps: TEACHER_ATTENDANCE_TOUR_STEPS,
  });

  const loadRoster = useCallback(
    async (date: string) => {
      if (!schoolSlug || !classId) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const payload = await attendanceApi.getRoster(
          schoolSlug,
          classId,
          date,
        );
        setRoster(payload);
        setAbsentStudentIds(
          new Set(
            payload.students
              .filter((student) => !student.present)
              .map((student) => student.id),
          ),
        );
      } catch {
        setLoadError(t("attendance.errors.loadRoster"));
        setRoster(null);
      } finally {
        setIsLoading(false);
      }
    },
    // `t` is intentionally excluded: useTranslation() returns a new
    // function identity on every render, and including it here would
    // re-create loadRoster (and re-fire the effect below) on every
    // render, looping forever.
    [classId, schoolSlug],
  );

  useEffect(() => {
    void loadRoster(selectedDate);
  }, [loadRoster, selectedDate]);

  function toggleStudent(studentId: string) {
    setAbsentStudentIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!schoolSlug || !classId) return;
    setIsSaving(true);
    try {
      const payload = await attendanceApi.saveRollCall(
        schoolSlug,
        classId,
        selectedDate,
        Array.from(absentStudentIds),
      );
      setRoster(payload);
      showSuccess({
        title: t("attendance.toasts.savedTitle"),
        message: t("attendance.toasts.savedMessage"),
      });
    } catch (error) {
      showError({
        title: t("attendance.errors.saveTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("attendance.errors.saveFailed"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  const presentCount = roster
    ? roster.students.length - absentStudentIds.size
    : 0;

  const subtitle = useMemo(
    () => roster?.className ?? null,
    [roster?.className],
  );

  return (
    <View style={styles.root} testID="teacher-class-attendance-screen">
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={t("attendance.header.title")}
          subtitle={subtitle}
          onBack={() => moduleBack(router)}
          testID="teacher-class-attendance-header"
          backTestID="teacher-class-attendance-back"
          helpAction={{
            label: t("attendance.help.menuLabel"),
            onPress: () => setHelpVisible(true),
            testID: "teacher-class-attendance-help-menu-item",
          }}
          menuTourTargetId={TEACHER_ATTENDANCE_TOUR_TARGETS.helpToggle}
          topInset={insets.top}
        />
      </View>

      {loadError ? <ErrorBanner message={loadError} /> : null}

      <OnboardingTarget
        id={TEACHER_ATTENDANCE_TOUR_TARGETS.dateNav}
        style={styles.dateRow}
        testID="teacher-class-attendance-date-nav"
      >
        <TouchableOpacity
          style={styles.dateNavButton}
          onPress={() => setSelectedDate((date) => shiftIsoDate(date, -1))}
          testID="teacher-class-attendance-date-prev"
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.dateField}>
          <DatePickerField
            value={selectedDate}
            onChange={setSelectedDate}
            title={t("attendance.dateLabel")}
            testID="teacher-class-attendance-date-picker"
          />
        </View>
        <TouchableOpacity
          style={styles.dateNavButton}
          onPress={() => setSelectedDate((date) => shiftIsoDate(date, 1))}
          testID="teacher-class-attendance-date-next"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </OnboardingTarget>

      {isLoading && !roster ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("attendance.loading")} />
        </View>
      ) : !roster || roster.students.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon="people-outline"
            title={t("attendance.empty.title")}
            message={t("attendance.empty.message")}
          />
        </View>
      ) : (
        <>
          <Text
            style={styles.summary}
            testID="teacher-class-attendance-summary"
          >
            {t("attendance.summary")
              .replace("{present}", String(presentCount))
              .replace("{total}", String(roster.students.length))}
          </Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            <OnboardingTarget
              id={TEACHER_ATTENDANCE_TOUR_TARGETS.rosterList}
              testID="teacher-class-attendance-roster-list"
            >
              {roster.students.map((student) => {
                const isAbsent = absentStudentIds.has(student.id);
                return (
                  <View key={student.id} style={styles.studentRow}>
                    <Text style={styles.studentName}>
                      {student.lastName} {student.firstName}
                    </Text>
                    <View style={styles.toggleGroup}>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          !isAbsent && styles.toggleButtonPresentActive,
                        ]}
                        onPress={() => {
                          if (isAbsent) toggleStudent(student.id);
                        }}
                        testID={`teacher-class-attendance-present-${student.id}`}
                      >
                        <Text
                          style={[
                            styles.toggleLabel,
                            !isAbsent && styles.toggleLabelActive,
                          ]}
                        >
                          {t("attendance.presentLabel")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          isAbsent && styles.toggleButtonAbsentActive,
                        ]}
                        onPress={() => {
                          if (!isAbsent) toggleStudent(student.id);
                        }}
                        testID={`teacher-class-attendance-absent-${student.id}`}
                      >
                        <Text
                          style={[
                            styles.toggleLabel,
                            isAbsent && styles.toggleLabelActive,
                          ]}
                        >
                          {t("attendance.absentLabel")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </OnboardingTarget>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving}
              onPress={() => void handleSave()}
              testID="teacher-class-attendance-save"
            >
              <Text style={styles.saveButtonLabel}>
                {isSaving ? t("attendance.saving") : t("attendance.saveButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("attendance.help.title")}
        sections={[
          {
            title: t("attendance.help.section1Title"),
            body: [t("attendance.help.section1Body")],
          },
        ]}
        closeLabel={t("attendance.help.close")}
        testID="teacher-class-attendance-help-modal"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {},
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dateNavButton: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  dateField: {
    flex: 1,
  },
  summary: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.warmSurface,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  studentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  toggleGroup: {
    flexDirection: "row",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  toggleButtonPresentActive: {
    backgroundColor: colors.accentTeal,
  },
  toggleButtonAbsentActive: {
    backgroundColor: colors.notification,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  toggleLabelActive: {
    color: colors.white,
  },
  footer: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  saveButton: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
