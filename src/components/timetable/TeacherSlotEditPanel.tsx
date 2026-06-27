import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { timetableApi } from "../../api/timetable.api";
import { roomsApi } from "../../api/rooms.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { TimePickerField } from "../TimePickerField";
import { SelectDropdown } from "../SelectDropdown";
import type { RoomAvailability } from "../../types/room.types";
import type {
  ClassTimetableContextResponse,
  TimetableOccurrence,
} from "../../types/timetable.types";
import {
  fullTeacherName,
  minuteToTimeLabel,
  timeLabelToMinute,
} from "../../utils/timetable";
import { extractApiError } from "../../utils/api-error";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";

// ─── Schema ───────────────────────────────────────────────────────────────────

function createTeacherSlotEditSchema(t: TranslateFn) {
  return z
    .object({
      start: z
        .string()
        .trim()
        .min(1, t("timetable.slotEditPanel.validation.startRequired"))
        .regex(/^\d{1,2}:\d{2}$/, {
          message: t("timetable.classManager.validation.timeFormat"),
        }),
      end: z
        .string()
        .trim()
        .min(1, t("timetable.slotEditPanel.validation.endRequired"))
        .regex(/^\d{1,2}:\d{2}$/, {
          message: t("timetable.classManager.validation.timeFormat"),
        }),
      roomId: z.string().optional(),
      scope: z.enum(["occurrence", "series"]),
      teacherUserId: z.string().optional(),
    })
    .refine(
      (data) => {
        const s = timeLabelToMinute(data.start);
        const e = timeLabelToMinute(data.end);
        if (s === null || e === null) return true;
        return e > s;
      },
      {
        message: t("timetable.slotEditPanel.validation.endAfterStart"),
        path: ["end"],
      },
    );
}

type FormValues = z.infer<ReturnType<typeof createTeacherSlotEditSchema>>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeacherSlotEditPanelProps {
  occurrence: TimetableOccurrence;
  className?: string;
  teacherDisplayName?: string;
  classId: string;
  schoolYearId: string;
  schoolSlug: string;
  /** En mode admin : montre le picker d'enseignant et inclut teacherUserId dans tous les payloads */
  adminMode?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherSlotEditPanel({
  occurrence,
  className,
  teacherDisplayName,
  classId,
  schoolYearId,
  schoolSlug,
  adminMode,
  onClose,
  onSuccess,
}: TeacherSlotEditPanelProps) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useSuccessToastStore();
  const [isSaving, setIsSaving] = useState(false);
  const [classCtx, setClassCtx] =
    useState<ClassTimetableContextResponse | null>(null);
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability[]>(
    [],
  );
  const isRecurring = occurrence.source === "RECURRING";

  // Load class context in admin mode to populate teacher picker
  const prevClassId = useRef("");
  useEffect(() => {
    if (!adminMode || !classId || classId === prevClassId.current) return;
    prevClassId.current = classId;
    timetableApi
      .getClassContext(schoolSlug, classId)
      .then(setClassCtx)
      .catch(() => {});
  }, [adminMode, classId, schoolSlug]);

  const teacherSlotEditSchema = useMemo(
    () => createTeacherSlotEditSchema(t),
    [t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(teacherSlotEditSchema),
    defaultValues: {
      start: minuteToTimeLabel(occurrence.startMinute),
      end: minuteToTimeLabel(occurrence.endMinute),
      roomId: "",
      scope: "occurrence",
      teacherUserId: occurrence.teacherUser.id,
    },
  });

  // Teacher options derived from class context (admin mode only)
  const teacherOptions = useMemo(() => {
    if (!adminMode || !classCtx) return [];
    const seen = new Map<string, string>();
    for (const a of classCtx.assignments) {
      if (!seen.has(a.teacherUserId)) {
        seen.set(a.teacherUserId, fullTeacherName(a.teacherUser));
      }
    }
    return Array.from(seen.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [adminMode, classCtx]);

  const start = watch("start");
  const end = watch("end");
  const scope = watch("scope");
  const targetsSeries = isRecurring && scope === "series";

  // Load available rooms whenever start/end changes
  useEffect(() => {
    if (!schoolSlug) return;
    const startMinute = timeLabelToMinute(start);
    const endMinute = timeLabelToMinute(end);
    if (startMinute === null || endMinute === null) return;

    let cancelled = false;
    roomsApi
      .listAvailableRooms(schoolSlug, {
        weekday: occurrence.weekday,
        startMinute,
        endMinute,
        occurrenceDate: occurrence.occurrenceDate,
        excludeSlotId: occurrence.slotId,
        excludeOneOffSlotId: occurrence.oneOffSlotId,
      })
      .then((result) => {
        if (!cancelled) setRoomAvailability(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [schoolSlug, occurrence, start, end]);

  // Pre-select the current room by name once rooms are loaded
  useEffect(() => {
    if (!occurrence.room || roomAvailability.length === 0) return;
    const match = roomAvailability.find(
      (r) =>
        r.name === occurrence.room && r.isAvailable && r.status === "AVAILABLE",
    );
    if (match) setValue("roomId", match.id);
  }, [roomAvailability, occurrence.room, setValue]);

  const roomOptions = useMemo(
    () => [
      { value: "", label: t("timetable.classManager.fields.roomNone") },
      ...roomAvailability
        .filter((r) => r.isAvailable && r.status === "AVAILABLE")
        .map((r) => ({ value: r.id, label: r.name })),
    ],
    [roomAvailability, t],
  );
  const headerTeacherLabel =
    teacherDisplayName ??
    [occurrence.teacherUser.lastName, occurrence.teacherUser.firstName]
      .filter(Boolean)
      .join(" ");
  const headerMeta = [
    occurrence.subject.name,
    className,
    headerTeacherLabel || undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  // ── Save ─────────────────────────────────────────────────────────────────

  const onSave = handleSubmit(async (values) => {
    const startMinute = timeLabelToMinute(values.start)!;
    const endMinute = timeLabelToMinute(values.end)!;
    const roomId = values.roomId || null;
    const teacherUserId =
      adminMode && values.teacherUserId
        ? values.teacherUserId
        : occurrence.teacherUser.id;

    setIsSaving(true);
    try {
      if (values.scope === "series" && isRecurring && occurrence.slotId) {
        await timetableApi.updateRecurringSlot(schoolSlug, occurrence.slotId, {
          startMinute,
          endMinute,
          roomId,
          ...(adminMode ? { teacherUserId } : {}),
        });
        showSuccess({
          title: t("timetable.slotEditPanel.toasts.seriesUpdatedTitle"),
          message: t("timetable.slotEditPanel.toasts.seriesUpdatedMessage"),
        });
      } else if (occurrence.source === "ONE_OFF" && occurrence.oneOffSlotId) {
        await timetableApi.updateOneOffSlot(
          schoolSlug,
          occurrence.oneOffSlotId,
          {
            startMinute,
            endMinute,
            roomId,
            ...(adminMode ? { teacherUserId } : {}),
          },
        );
        showSuccess({
          title: t("timetable.slotEditPanel.toasts.slotUpdatedTitle"),
          message: t("timetable.slotEditPanel.toasts.slotUpdatedMessage"),
        });
      } else {
        await timetableApi.createOneOffSlot(schoolSlug, classId, {
          schoolYearId,
          occurrenceDate: occurrence.occurrenceDate,
          startMinute,
          endMinute,
          subjectId: occurrence.subject.id,
          teacherUserId,
          roomId,
          status: "PLANNED",
          sourceSlotId: occurrence.slotId ?? null,
        });
        showSuccess({
          title: t("timetable.slotEditPanel.toasts.slotUpdatedTitle"),
          message: t("timetable.slotEditPanel.toasts.exceptionUpdatedMessage"),
        });
      }
      onSuccess();
    } catch (err) {
      showError({
        title: t("timetable.slotEditPanel.toasts.updateErrorTitle"),
        message: extractApiError(err),
      });
    } finally {
      setIsSaving(false);
    }
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  function confirmDelete(deleteSeries: boolean) {
    const title = deleteSeries
      ? t("timetable.slotEditPanel.confirm.deleteSeriesTitle")
      : t("timetable.slotEditPanel.confirm.deleteOccurrenceTitle");
    const message = deleteSeries
      ? t("timetable.slotEditPanel.confirm.deleteSeriesMessage")
      : t("timetable.slotEditPanel.confirm.deleteOccurrenceMessage");
    Alert.alert(title, message, [
      { text: t("timetable.common.cancel"), style: "cancel" },
      {
        text: t("timetable.slotEditPanel.buttons.delete"),
        style: "destructive",
        onPress: () => void handleDelete(deleteSeries),
      },
    ]);
  }

  async function handleDelete(deleteSeries: boolean) {
    setIsSaving(true);
    try {
      if (deleteSeries && isRecurring && occurrence.slotId) {
        await timetableApi.deleteRecurringSlot(schoolSlug, occurrence.slotId);
        showSuccess({
          title: t("timetable.slotEditPanel.toasts.seriesDeletedTitle"),
          message: t("timetable.slotEditPanel.toasts.seriesDeletedMessage"),
        });
      } else if (occurrence.source === "ONE_OFF" && occurrence.oneOffSlotId) {
        await timetableApi.deleteOneOffSlot(
          schoolSlug,
          occurrence.oneOffSlotId,
        );
        showSuccess({
          title: t("timetable.slotEditPanel.toasts.slotDeletedTitle"),
          message: t("timetable.slotEditPanel.toasts.slotDeletedMessage"),
        });
      } else {
        // Annuler cette occurrence d'une série récurrente
        await timetableApi.createOneOffSlot(schoolSlug, classId, {
          schoolYearId,
          occurrenceDate: occurrence.occurrenceDate,
          startMinute: occurrence.startMinute,
          endMinute: occurrence.endMinute,
          subjectId: occurrence.subject.id,
          teacherUserId: occurrence.teacherUser.id,
          room: occurrence.room,
          status: "CANCELLED",
          sourceSlotId: occurrence.slotId ?? null,
        });
        showSuccess({
          title: t("timetable.slotEditPanel.toasts.slotCancelledTitle"),
          message: t("timetable.slotEditPanel.toasts.slotCancelledMessage"),
        });
      }
      onSuccess();
    } catch (err) {
      showError({
        title: t("timetable.slotEditPanel.toasts.deleteErrorTitle"),
        message: extractApiError(err),
      });
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.panel} testID="teacher-slot-edit-panel">
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderMain}>
          <View style={styles.panelHeaderIcon}>
            <Ionicons name="create-outline" size={18} color={colors.white} />
          </View>
          <View style={styles.panelHeaderText}>
            <Text style={styles.panelTitle}>
              {t("timetable.slotEditPanel.title")}
            </Text>
            <Text style={styles.panelSubtitle} numberOfLines={1}>
              {headerMeta}
            </Text>
          </View>
        </View>
        <View style={styles.scopePill} testID="teacher-slot-scope-target">
          <Text style={styles.scopePillText}>{isRecurring ? "R" : "P"}</Text>
        </View>
      </View>

      <View style={styles.panelBody}>
        {isRecurring ? (
          <View style={styles.scopeRow} testID="teacher-slot-scope-row">
            <Controller
              control={control}
              name="scope"
              render={({ field: { value, onChange } }) => (
                <>
                  <TouchableOpacity
                    style={[
                      styles.scopeBtn,
                      value === "occurrence" && styles.scopeBtnActive,
                    ]}
                    onPress={() => onChange("occurrence")}
                    testID="teacher-slot-scope-occurrence"
                  >
                    <Text
                      style={[
                        styles.scopeBtnText,
                        value === "occurrence" && styles.scopeBtnTextActive,
                      ]}
                    >
                      {t("timetable.slotEditPanel.scope.occurrence")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.scopeBtn,
                      value === "series" && styles.scopeBtnActive,
                    ]}
                    onPress={() => onChange("series")}
                    testID="teacher-slot-scope-series"
                  >
                    <Text
                      style={[
                        styles.scopeBtnText,
                        value === "series" && styles.scopeBtnTextActive,
                      ]}
                    >
                      {t("timetable.slotEditPanel.scope.series")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            />
          </View>
        ) : null}

        {/* Teacher picker — admin mode only */}
        {adminMode && teacherOptions.length > 0 ? (
          <View testID="teacher-slot-admin-teacher-section">
            <Text style={styles.fieldLabel}>
              {t("timetable.classManager.fields.teacher")}
            </Text>
            <Controller
              control={control}
              name="teacherUserId"
              render={({ field: { value, onChange } }) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillRow}
                >
                  {teacherOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.pill,
                        value === opt.value && styles.pillActive,
                      ]}
                      onPress={() => onChange(opt.value)}
                      testID={`teacher-slot-admin-teacher-${opt.value}`}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          value === opt.value && styles.pillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            />
          </View>
        ) : null}

        <View style={styles.fields}>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>
                {t("timetable.classManager.fields.start")}
              </Text>
              <Controller
                control={control}
                name="start"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TimePickerField
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    title={t("timetable.classManager.timePicker.startTitle")}
                    placeholder="07:30"
                    hasError={!!errors.start}
                    testID="teacher-slot-start-input"
                  />
                )}
              />
              {errors.start ? (
                <Text
                  style={styles.errorText}
                  testID="teacher-slot-start-error"
                >
                  {errors.start.message}
                </Text>
              ) : null}
            </View>

            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>
                {t("timetable.classManager.fields.end")}
              </Text>
              <Controller
                control={control}
                name="end"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TimePickerField
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    title={t("timetable.classManager.timePicker.endTitle")}
                    placeholder="08:20"
                    hasError={!!errors.end}
                    testID="teacher-slot-end-input"
                  />
                )}
              />
              {errors.end ? (
                <Text style={styles.errorText} testID="teacher-slot-end-error">
                  {errors.end.message}
                </Text>
              ) : null}
            </View>

            <View style={[styles.timeField, styles.roomField]}>
              <Text style={styles.fieldLabel}>
                {t("timetable.classManager.fields.room")}
              </Text>
              <Controller
                control={control}
                name="roomId"
                render={({ field: { value, onChange } }) => (
                  <SelectDropdown
                    options={roomOptions}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={t("timetable.classManager.fields.roomNone")}
                    testID="teacher-slot-room"
                  />
                )}
              />
            </View>
          </View>
        </View>

        <View style={styles.footerBar}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnNeutral]}
              onPress={onClose}
              disabled={isSaving}
              testID="teacher-slot-edit-close"
            >
              <Ionicons
                name="arrow-back-outline"
                size={15}
                color={colors.primary}
              />
              <Text style={styles.actionBtnNeutralText}>
                {t("timetable.slotEditPanel.buttons.back")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => confirmDelete(targetsSeries)}
              disabled={isSaving}
              testID={
                targetsSeries
                  ? "teacher-slot-delete-series"
                  : "teacher-slot-delete-occurrence"
              }
            >
              <Ionicons name="trash-outline" size={15} color={colors.white} />
              <Text style={styles.actionBtnDangerText}>
                {t("timetable.slotEditPanel.buttons.delete")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnPrimary,
                isSaving && styles.actionBtnDisabled,
              ]}
              onPress={() => void onSave()}
              disabled={isSaving}
              testID="teacher-slot-save"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.actionBtnPrimaryText}>
                    {t("timetable.slotEditPanel.buttons.save")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFF8EE",
  },
  panelHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelHeaderMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  panelHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(243,179,77,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  panelHeaderText: { flex: 1 },
  panelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
    textTransform: "uppercase",
  },
  panelSubtitle: {
    fontSize: 13,
    color: "rgba(255,244,227,0.9)",
  },
  scopePill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(243,179,77,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,244,227,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  scopePillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFF4E3",
  },
  panelBody: {
    backgroundColor: "#FFF9F1",
    padding: 18,
    gap: 14,
  },
  footerBar: {
    marginHorizontal: -18,
    marginBottom: -18,
    marginTop: 2,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: "#F8ECDC",
    borderTopWidth: 1,
    borderTopColor: "#EAD8BF",
  },
  scopeRow: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E8D8C2",
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  scopeBtnActive: {
    backgroundColor: colors.primary,
  },
  scopeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  scopeBtnTextActive: {
    color: colors.white,
  },
  pillRow: { flexDirection: "row", gap: 6, paddingBottom: 2 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  pillTextActive: { color: colors.white },

  fields: { gap: 10 },
  timeRow: {
    flexDirection: "row",
    gap: 8,
  },
  timeField: { flex: 1 },
  roomField: { flex: 1.2 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5F5A52",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 10,
    color: colors.notification,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  actionBtnNeutral: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E8D8C2",
  },
  actionBtnDanger: {
    backgroundColor: "#E84D5B",
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  actionBtnNeutralText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtnDangerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtnPrimaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
