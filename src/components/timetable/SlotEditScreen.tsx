import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { timetableApi } from "../../api/timetable.api";
import { roomsApi } from "../../api/rooms.api";
import { useAuthStore } from "../../store/auth.store";
import { useTimetableStore } from "../../store/timetable.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { SelectDropdown } from "../SelectDropdown";
import { TimePickerField } from "../TimePickerField";
import type { RoomAvailability } from "../../types/room.types";
import type { ClassTimetableContextResponse } from "../../types/timetable.types";
import {
  fullTeacherName,
  minuteToTimeLabel,
  timeLabelToMinute,
} from "../../utils/timetable";
import { extractApiError } from "../../utils/api-error";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import { moduleBack } from "../../utils/moduleBack";

// ─── Palette ──────────────────────────────────────────────────────────────────

const HERO_BG = "#C0681A";

// ─── Schema ───────────────────────────────────────────────────────────────────

function createSchema(t: TranslateFn) {
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

type FormValues = z.infer<ReturnType<typeof createSchema>>;

// ─── Component ────────────────────────────────────────────────────────────────

export function SlotEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useSuccessToastStore();
  const { pendingSlotEdit, clearPendingSlotEdit } = useTimetableStore();

  const [isSaving, setIsSaving] = useState(false);
  const [classCtx, setClassCtx] =
    useState<ClassTimetableContextResponse | null>(null);
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability[]>(
    [],
  );

  const ctx = pendingSlotEdit;
  const occurrence = ctx?.occurrence ?? null;
  const isRecurring = occurrence?.source === "RECURRING";

  const prevClassId = useRef("");
  const { schoolSlug } = useAuthStore();

  // Load class context in admin mode for teacher picker
  useEffect(() => {
    if (!ctx?.adminMode || !ctx.classId || ctx.classId === prevClassId.current)
      return;
    prevClassId.current = ctx.classId;
    timetableApi
      .getClassContext(schoolSlug ?? "", ctx.classId)
      .then(setClassCtx)
      .catch(() => {});
  }, [ctx?.adminMode, ctx?.classId, schoolSlug]);

  const schema = useMemo(() => createSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      start: occurrence ? minuteToTimeLabel(occurrence.startMinute) : "08:00",
      end: occurrence ? minuteToTimeLabel(occurrence.endMinute) : "09:00",
      roomId: "",
      scope: "occurrence",
      teacherUserId: occurrence?.teacherUser.id ?? "",
    },
  });

  const teacherOptions = useMemo(() => {
    if (!ctx?.adminMode || !classCtx) return [];
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
  }, [ctx?.adminMode, classCtx]);

  const start = watch("start");
  const end = watch("end");
  const scope = watch("scope");
  const targetsSeries = isRecurring && scope === "series";

  // Load available rooms
  useEffect(() => {
    if (!schoolSlug || !occurrence) return;
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

  // Pre-select current room by name once rooms load
  useEffect(() => {
    if (!occurrence?.room || roomAvailability.length === 0) return;
    const match = roomAvailability.find(
      (r) =>
        r.name === occurrence.room && r.isAvailable && r.status === "AVAILABLE",
    );
    if (match) setValue("roomId", match.id);
  }, [roomAvailability, occurrence?.room, setValue]);

  const roomOptions = useMemo(
    () => [
      { value: "", label: t("timetable.classManager.fields.roomNone") },
      ...roomAvailability
        .filter((r) => r.isAvailable && r.status === "AVAILABLE")
        .map((r) => ({ value: r.id, label: r.name })),
    ],
    [roomAvailability, t],
  );

  const headerSubtitle = [user?.schoolName, ctx?.className]
    .filter(Boolean)
    .join(" · ");

  const headerMeta = [
    occurrence?.subject.name,
    ctx?.className,
    occurrence
      ? [occurrence.teacherUser.lastName, occurrence.teacherUser.firstName]
          .filter(Boolean)
          .join(" ") || undefined
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  // ── Save ─────────────────────────────────────────────────────────────────

  const onSave = handleSubmit(
    async (values) => {
      if (!occurrence || !ctx || !schoolSlug) return;
      const startMinute = timeLabelToMinute(values.start)!;
      const endMinute = timeLabelToMinute(values.end)!;
      const roomId = values.roomId || null;
      const teacherUserId =
        ctx.adminMode && values.teacherUserId
          ? values.teacherUserId
          : occurrence.teacherUser.id;

      setIsSaving(true);
      try {
        if (values.scope === "series" && isRecurring && occurrence.slotId) {
          await timetableApi.updateRecurringSlot(
            schoolSlug,
            occurrence.slotId,
            {
              startMinute,
              endMinute,
              roomId,
              ...(ctx.adminMode ? { teacherUserId } : {}),
            },
          );
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
              ...(ctx.adminMode ? { teacherUserId } : {}),
            },
          );
          showSuccess({
            title: t("timetable.slotEditPanel.toasts.slotUpdatedTitle"),
            message: t("timetable.slotEditPanel.toasts.slotUpdatedMessage"),
          });
        } else {
          await timetableApi.createOneOffSlot(schoolSlug, ctx.classId, {
            schoolYearId: ctx.schoolYearId,
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
            message: t(
              "timetable.slotEditPanel.toasts.exceptionUpdatedMessage",
            ),
          });
        }
        clearPendingSlotEdit();
        router.back();
      } catch (err) {
        showError({
          title: t("timetable.slotEditPanel.toasts.updateErrorTitle"),
          message: extractApiError(err),
        });
      } finally {
        setIsSaving(false);
      }
    },
    () => {},
  );

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
    if (!occurrence || !ctx || !schoolSlug) return;
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
        await timetableApi.createOneOffSlot(schoolSlug, ctx.classId, {
          schoolYearId: ctx.schoolYearId,
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
      clearPendingSlotEdit();
      router.back();
    } catch (err) {
      showError({
        title: t("timetable.slotEditPanel.toasts.deleteErrorTitle"),
        message: extractApiError(err),
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Guard: if no context, go back
  if (!ctx || !occurrence) {
    return null;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root} testID="slot-edit-screen">
      <ModuleHeader
        title={t("timetable.slotScreen.headerTitle")}
        subtitle={headerSubtitle || null}
        onBack={() => {
          clearPendingSlotEdit();
          moduleBack(router);
        }}
        testID="slot-edit-header"
        backTestID="slot-edit-back"
        topInset={insets.top}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="slot-edit-scroll"
        >
          {/* Hero */}
          <FormHero
            icon="create-outline"
            title={t("timetable.slotScreen.edit.heroTitle")}
            subtitle={t("timetable.slotScreen.heroSubtitle")}
            palette="warm"
            testID="slot-edit-hero"
            trailing={
              <View style={styles.scopePill} testID="slot-edit-scope-target">
                <Text style={styles.scopePillText}>
                  {isRecurring ? "R" : "P"}
                </Text>
              </View>
            }
            footer={
              headerMeta ? (
                <Text style={styles.heroMeta} numberOfLines={1}>
                  {headerMeta}
                </Text>
              ) : null
            }
          />

          {/* Form card */}
          <View style={styles.card}>
            {/* Scope toggle — recurring only */}
            {isRecurring ? (
              <View style={styles.scopeRow} testID="slot-edit-scope-row">
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
                        testID="slot-edit-scope-occurrence"
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
                        testID="slot-edit-scope-series"
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
            {ctx.adminMode && teacherOptions.length > 0 ? (
              <View testID="slot-edit-admin-teacher-section">
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
                          testID={`slot-edit-admin-teacher-${opt.value}`}
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

            {/* Time fields + room */}
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
                      testID="slot-edit-start-input"
                    />
                  )}
                />
                {errors.start ? (
                  <Text style={styles.errorText} testID="slot-edit-start-error">
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
                      testID="slot-edit-end-input"
                    />
                  )}
                />
                {errors.end ? (
                  <Text style={styles.errorText} testID="slot-edit-end-error">
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
                      testID="slot-edit-room"
                    />
                  )}
                />
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnNeutral]}
                onPress={() => {
                  clearPendingSlotEdit();
                  router.back();
                }}
                disabled={isSaving}
                testID="slot-edit-close"
              >
                <Ionicons name="arrow-back-outline" size={15} color={HERO_BG} />
                <Text style={[styles.actionBtnText, { color: HERO_BG }]}>
                  {t("timetable.slotEditPanel.buttons.back")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => confirmDelete(targetsSeries)}
                disabled={isSaving}
                testID={
                  targetsSeries
                    ? "slot-edit-delete-series"
                    : "slot-edit-delete-occurrence"
                }
              >
                <Ionicons name="trash-outline" size={15} color={colors.white} />
                <Text style={[styles.actionBtnText, { color: colors.white }]}>
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
                testID="slot-edit-save"
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
                    <Text
                      style={[styles.actionBtnText, { color: colors.white }]}
                    >
                      {t("timetable.slotEditPanel.buttons.save")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  content: { gap: 16, padding: 16 },

  /* Hero */
  heroMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 8,
  },
  scopePill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  scopePillText: { fontSize: 12, fontWeight: "800", color: colors.white },

  /* Card */
  card: {
    backgroundColor: "#FFF9F1",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },

  /* Scope toggle */
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
  scopeBtnActive: { backgroundColor: HERO_BG },
  scopeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  scopeBtnTextActive: { color: colors.white },

  /* Pills */
  pillRow: { flexDirection: "row", gap: 6, paddingBottom: 2 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: HERO_BG, borderColor: HERO_BG },
  pillText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  pillTextActive: { color: colors.white },

  /* Time row */
  timeRow: { flexDirection: "row", gap: 8 },
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
  errorText: { fontSize: 10, color: colors.notification, marginTop: 4 },

  /* Actions */
  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
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
  actionBtnDanger: { backgroundColor: "#E84D5B" },
  actionBtnPrimary: { backgroundColor: HERO_BG },
  actionBtnDisabled: { opacity: 0.7 },
  actionBtnText: { fontSize: 13, fontWeight: "700" },
});
