import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { timetableApi } from "../../api/timetable.api";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import type {
  ClassTimetableContextResponse,
  TimetableClassOption,
} from "../../types/timetable.types";
import {
  fullTeacherName,
  timeLabelToMinute,
  toIsoDateString,
} from "../../utils/timetable";
import { extractApiError } from "../../utils/api-error";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    classId: z.string().min(1, "Choisissez une classe"),
    occurrenceDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
    start: z.string().regex(/^\d{1,2}:\d{2}$/, "Format HH:MM"),
    end: z.string().regex(/^\d{1,2}:\d{2}$/, "Format HH:MM"),
    subjectId: z.string().min(1, "Choisissez une matière"),
    teacherUserId: z.string().min(1, "Choisissez un enseignant"),
    room: z.string(),
  })
  .refine(
    (d) => {
      const s = timeLabelToMinute(d.start);
      const e = timeLabelToMinute(d.end);
      if (s === null || e === null) return true;
      return e > s;
    },
    { path: ["end"], message: "La fin doit être après le début" },
  );

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeacherOneOffCreatePanelProps {
  schoolSlug: string;
  /** Pré-rempli depuis l'onglet "Mes classes" */
  prefilledClassId?: string;
  /** Date initiale (curseur affiché) */
  prefilledDate?: string;
  /** Liste des classes accessibles à l'enseignant */
  allClasses: TimetableClassOption[];
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherOneOffCreatePanel({
  schoolSlug,
  prefilledClassId,
  prefilledDate,
  allClasses,
  onClose,
  onSuccess,
}: TeacherOneOffCreatePanelProps) {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useSuccessToastStore();
  const [isSaving, setIsSaving] = useState(false);
  const [classCtx, setClassCtx] =
    useState<ClassTimetableContextResponse | null>(null);
  const [isLoadingCtx, setIsLoadingCtx] = useState(false);
  const prevClassId = useRef<string>("");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      classId: prefilledClassId ?? "",
      occurrenceDate: prefilledDate ?? toIsoDateString(new Date()),
      start: "08:00",
      end: "09:00",
      subjectId: "",
      teacherUserId: "",
      room: "",
    },
  });

  const classId = watch("classId");
  const subjectId = watch("subjectId");

  // Load class context when classId changes
  useEffect(() => {
    if (!classId || classId === prevClassId.current) return;
    prevClassId.current = classId;

    setClassCtx(null);
    setIsLoadingCtx(true);
    timetableApi
      .getClassContext(schoolSlug, classId)
      .then((ctx) => {
        setClassCtx(ctx);
        // Pre-fill: current user if they appear in assignments, otherwise first
        const firstSubjectId = ctx.assignments[0]?.subjectId ?? "";
        setValue("subjectId", firstSubjectId);
        const myAssignment = ctx.assignments.find(
          (a) => a.teacherUserId === user?.id,
        );
        setValue(
          "teacherUserId",
          myAssignment?.teacherUserId ??
            ctx.assignments[0]?.teacherUserId ??
            "",
        );
      })
      .catch(() => {})
      .finally(() => setIsLoadingCtx(false));
  }, [classId, schoolSlug, user?.id, setValue]);

  // Filtered teacher options for selected subject
  const teacherOptions = useMemo(() => {
    if (!classCtx) return [];
    const bySubject = classCtx.assignments
      .filter((a) => a.subjectId === subjectId)
      .map((a) => ({
        value: a.teacherUserId,
        label: fullTeacherName(a.teacherUser),
      }));
    if (bySubject.length > 0) return bySubject;
    const all = new Map<string, string>();
    classCtx.assignments.forEach((a) =>
      all.set(a.teacherUserId, fullTeacherName(a.teacherUser)),
    );
    return Array.from(all.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [classCtx, subjectId]);

  // Reset teacher when subject changes
  const prevSubjectId = useRef(subjectId);
  useEffect(() => {
    if (!classCtx || subjectId === prevSubjectId.current) return;
    prevSubjectId.current = subjectId;
    const myAssignmentForSubject = classCtx.assignments.find(
      (a) => a.subjectId === subjectId && a.teacherUserId === user?.id,
    );
    const firstForSubject = classCtx.assignments.find(
      (a) => a.subjectId === subjectId,
    );
    setValue(
      "teacherUserId",
      myAssignmentForSubject?.teacherUserId ??
        firstForSubject?.teacherUserId ??
        "",
    );
  }, [subjectId, classCtx, user?.id, setValue]);

  const subjectOptions = useMemo(
    () =>
      (classCtx?.allowedSubjects ?? []).map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [classCtx],
  );

  const selectedClassName = useMemo(
    () =>
      prefilledClassId
        ? (allClasses.find((c) => c.classId === prefilledClassId)?.className ??
          classCtx?.class.name)
        : (allClasses.find((c) => c.classId === classId)?.className ?? null),
    [allClasses, classCtx, classId, prefilledClassId],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSave = handleSubmit(async (values) => {
    if (!classCtx) return;
    const startMinute = timeLabelToMinute(values.start)!;
    const endMinute = timeLabelToMinute(values.end)!;
    const room = values.room.trim() || null;

    setIsSaving(true);
    try {
      await timetableApi.createOneOffSlot(schoolSlug, values.classId, {
        schoolYearId:
          classCtx.selectedSchoolYearId ?? classCtx.class.schoolYearId,
        occurrenceDate: values.occurrenceDate,
        startMinute,
        endMinute,
        subjectId: values.subjectId,
        teacherUserId: values.teacherUserId,
        room,
        status: "PLANNED",
      });
      showSuccess({
        title: "Séance ajoutée",
        message: "Le créneau apparaît maintenant dans l'agenda.",
      });
      onSuccess();
    } catch (err) {
      showError({
        title: "Création impossible",
        message: extractApiError(err),
      });
    } finally {
      setIsSaving(false);
    }
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.panel} testID="teacher-oneoff-create-panel">
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderIcon}>
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={colors.primary}
          />
        </View>
        <View style={styles.panelHeaderText}>
          <Text style={styles.panelTitle}>Nouveau créneau</Text>
          {selectedClassName ? (
            <Text style={styles.panelSubtitle} numberOfLines={1}>
              {selectedClassName}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          testID="teacher-oneoff-create-close"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Class picker (only when no prefilledClassId) */}
      {!prefilledClassId ? (
        <View>
          <Text style={styles.fieldLabel}>Classe</Text>
          <Controller
            control={control}
            name="classId"
            render={({ field: { value, onChange } }) => (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillRow}
              >
                {allClasses.map((cls) => (
                  <TouchableOpacity
                    key={cls.classId}
                    style={[
                      styles.pill,
                      value === cls.classId && styles.pillActive,
                    ]}
                    onPress={() => onChange(cls.classId)}
                    testID={`teacher-oneoff-class-${cls.classId}`}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        value === cls.classId && styles.pillTextActive,
                      ]}
                    >
                      {cls.className}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          />
          {errors.classId ? (
            <Text style={styles.errorText}>{errors.classId.message}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Loading context */}
      {isLoadingCtx ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.loader}
        />
      ) : classCtx ? (
        <View style={styles.fields}>
          {/* Subject */}
          <View>
            <Text style={styles.fieldLabel}>Matière</Text>
            <Controller
              control={control}
              name="subjectId"
              render={({ field: { value, onChange } }) => (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pillRow}
                >
                  {subjectOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.pill,
                        value === opt.value && styles.pillActive,
                      ]}
                      onPress={() => onChange(opt.value)}
                      testID={`teacher-oneoff-subject-${opt.value}`}
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
            {errors.subjectId ? (
              <Text style={styles.errorText}>{errors.subjectId.message}</Text>
            ) : null}
          </View>

          {/* Teacher */}
          <View>
            <Text style={styles.fieldLabel}>Enseignant</Text>
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
                      testID={`teacher-oneoff-teacher-${opt.value}`}
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
            {errors.teacherUserId ? (
              <Text style={styles.errorText}>
                {errors.teacherUserId.message}
              </Text>
            ) : null}
          </View>

          {/* Date */}
          <View>
            <Text style={styles.fieldLabel}>Date</Text>
            <Controller
              control={control}
              name="occurrenceDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.occurrenceDate && styles.inputError,
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="2026-04-28"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  testID="teacher-oneoff-date-input"
                />
              )}
            />
            {errors.occurrenceDate ? (
              <Text style={styles.errorText}>
                {errors.occurrenceDate.message}
              </Text>
            ) : null}
          </View>

          {/* Start / End / Room */}
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Début</Text>
              <Controller
                control={control}
                name="start"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.start && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="08:00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numbers-and-punctuation"
                    testID="teacher-oneoff-start-input"
                  />
                )}
              />
              {errors.start ? (
                <Text style={styles.errorText}>{errors.start.message}</Text>
              ) : null}
            </View>

            <View style={styles.timeField}>
              <Text style={styles.fieldLabel}>Fin</Text>
              <Controller
                control={control}
                name="end"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.end && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="09:00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numbers-and-punctuation"
                    testID="teacher-oneoff-end-input"
                  />
                )}
              />
              {errors.end ? (
                <Text style={styles.errorText}>{errors.end.message}</Text>
              ) : null}
            </View>

            <View style={[styles.timeField, styles.roomField]}>
              <Text style={styles.fieldLabel}>Salle</Text>
              <Controller
                control={control}
                name="room"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="B45"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                    testID="teacher-oneoff-room-input"
                  />
                )}
              />
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={() => void onSave()}
            disabled={isSaving}
            testID="teacher-oneoff-create-save"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Ajouter ce créneau</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : classId ? (
        <Text style={styles.ctxError}>
          Impossible de charger le contexte de la classe.
        </Text>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(12,95,168,0.22)",
    backgroundColor: "#F0F6FF",
    padding: 12,
    gap: 10,
  },

  panelHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  panelHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(12,95,168,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  panelHeaderText: { flex: 1 },
  panelTitle: { fontSize: 13, fontWeight: "700", color: colors.primary },
  panelSubtitle: { fontSize: 11, color: colors.textSecondary },
  closeBtn: { padding: 4 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  pillRow: { flexDirection: "row", gap: 6, paddingBottom: 2 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  pillTextActive: { color: colors.white },

  loader: { marginVertical: 8 },
  fields: { gap: 10 },

  timeRow: { flexDirection: "row", gap: 8 },
  timeField: { flex: 1 },
  roomField: { flex: 1.2 },

  input: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.notification },
  errorText: {
    fontSize: 10,
    color: colors.notification,
    marginTop: 2,
  },
  ctxError: {
    fontSize: 12,
    color: colors.notification,
    textAlign: "center",
    paddingVertical: 8,
  },

  saveBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: 13, fontWeight: "700" },
});
