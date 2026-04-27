import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useSuccessToastStore } from "../../store/success-toast.store";
import type { TimetableOccurrence } from "../../types/timetable.types";
import { minuteToTimeLabel, timeLabelToMinute } from "../../utils/timetable";
import { extractApiError } from "../../utils/api-error";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    start: z.string().regex(/^\d{1,2}:\d{2}$/, { message: "Format HH:MM" }),
    end: z.string().regex(/^\d{1,2}:\d{2}$/, { message: "Format HH:MM" }),
    room: z.string(),
    scope: z.enum(["occurrence", "series"]),
  })
  .refine(
    (data) => {
      const s = timeLabelToMinute(data.start);
      const e = timeLabelToMinute(data.end);
      if (s === null || e === null) return true;
      return e > s;
    },
    { message: "La fin doit être après le début", path: ["end"] },
  );

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeacherSlotEditPanelProps {
  occurrence: TimetableOccurrence;
  className?: string;
  classId: string;
  schoolYearId: string;
  schoolSlug: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherSlotEditPanel({
  occurrence,
  className,
  classId,
  schoolYearId,
  schoolSlug,
  onClose,
  onSuccess,
}: TeacherSlotEditPanelProps) {
  const { showSuccess, showError } = useSuccessToastStore();
  const [isSaving, setIsSaving] = useState(false);
  const isRecurring = occurrence.source === "RECURRING";

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      start: minuteToTimeLabel(occurrence.startMinute),
      end: minuteToTimeLabel(occurrence.endMinute),
      room: occurrence.room ?? "",
      scope: "occurrence",
    },
  });

  const scope = watch("scope");

  // ── Save ─────────────────────────────────────────────────────────────────

  const onSave = handleSubmit(async (values) => {
    const startMinute = timeLabelToMinute(values.start)!;
    const endMinute = timeLabelToMinute(values.end)!;
    const room = values.room.trim() || null;

    setIsSaving(true);
    try {
      if (values.scope === "series" && isRecurring && occurrence.slotId) {
        // Modifier toute la série récurrente
        await timetableApi.updateRecurringSlot(schoolSlug, occurrence.slotId, {
          startMinute,
          endMinute,
          room,
        });
        showSuccess({
          title: "Série modifiée",
          message: "Tous les cours de cette série ont été mis à jour.",
        });
      } else if (occurrence.source === "ONE_OFF" && occurrence.oneOffSlotId) {
        // Modifier ce créneau ponctuel
        await timetableApi.updateOneOffSlot(
          schoolSlug,
          occurrence.oneOffSlotId,
          { startMinute, endMinute, room },
        );
        showSuccess({
          title: "Créneau modifié",
          message: "Ce cours a été mis à jour.",
        });
      } else {
        // Créer un créneau ponctuel qui remplace cette occurrence récurrente
        await timetableApi.createOneOffSlot(schoolSlug, classId, {
          schoolYearId,
          occurrenceDate: occurrence.occurrenceDate,
          startMinute,
          endMinute,
          subjectId: occurrence.subject.id,
          teacherUserId: occurrence.teacherUser.id,
          room,
          status: "PLANNED",
          sourceSlotId: occurrence.slotId ?? null,
        });
        showSuccess({
          title: "Créneau modifié",
          message: "Ce cours a été modifié pour cette date uniquement.",
        });
      }
      onSuccess();
    } catch (err) {
      showError({
        title: "Modification impossible",
        message: extractApiError(err),
      });
    } finally {
      setIsSaving(false);
    }
  });

  // ── Delete ────────────────────────────────────────────────────────────────

  function confirmDelete(deleteSeries: boolean) {
    const title = deleteSeries
      ? "Supprimer toute la série ?"
      : "Supprimer ce créneau ?";
    const message = deleteSeries
      ? "Tous les cours de cette série hebdomadaire seront supprimés."
      : "Ce cours sera annulé pour cette date uniquement.";
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
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
          title: "Série supprimée",
          message: "Tous les cours de cette série ont été supprimés.",
        });
      } else if (occurrence.source === "ONE_OFF" && occurrence.oneOffSlotId) {
        await timetableApi.deleteOneOffSlot(
          schoolSlug,
          occurrence.oneOffSlotId,
        );
        showSuccess({
          title: "Créneau supprimé",
          message: "Ce cours a été supprimé.",
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
          title: "Créneau annulé",
          message: "Ce cours est annulé pour cette date uniquement.",
        });
      }
      onSuccess();
    } catch (err) {
      showError({
        title: "Suppression impossible",
        message: extractApiError(err),
      });
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.panel} testID="teacher-slot-edit-panel">
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderIcon}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
        </View>
        <View style={styles.panelHeaderText}>
          <Text style={styles.panelTitle}>Modifier ce créneau</Text>
          <Text style={styles.panelSubtitle} numberOfLines={1}>
            {occurrence.subject.name}
            {className ? ` · ${className}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          testID="teacher-slot-edit-close"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Scope (series / occurrence) — uniquement pour les récurrents */}
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
                    Ce créneau
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
                    Toute la série
                  </Text>
                </TouchableOpacity>
              </>
            )}
          />
        </View>
      ) : null}

      {/* Form fields */}
      <View style={styles.fields}>
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
                  placeholder="07:30"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  testID="teacher-slot-start-input"
                />
              )}
            />
            {errors.start ? (
              <Text style={styles.errorText} testID="teacher-slot-start-error">
                {errors.start.message}
              </Text>
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
                  placeholder="08:20"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
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
                  placeholder="A01"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  testID="teacher-slot-room-input"
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
          testID="teacher-slot-save"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>
              {scope === "series"
                ? "Modifier toute la série"
                : "Enregistrer ce créneau"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete actions */}
        <View style={styles.deleteRow}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmDelete(false)}
            disabled={isSaving}
            testID="teacher-slot-delete-occurrence"
          >
            <Ionicons
              name="trash-outline"
              size={13}
              color={colors.notification}
            />
            <Text style={styles.deleteBtnText}>Annuler ce créneau</Text>
          </TouchableOpacity>
          {isRecurring ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => confirmDelete(true)}
              disabled={isSaving}
              testID="teacher-slot-delete-series"
            >
              <Ionicons
                name="trash-outline"
                size={13}
                color={colors.notification}
              />
              <Text style={styles.deleteBtnText}>Supprimer la série</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
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
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(12,95,168,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  panelHeaderText: { flex: 1 },
  panelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  panelSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: 4,
  },
  scopeRow: {
    flexDirection: "row",
    gap: 6,
    padding: 3,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: "center",
  },
  scopeBtnActive: {
    backgroundColor: colors.primary,
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  scopeBtnTextActive: {
    color: colors.white,
  },
  fields: { gap: 10 },
  timeRow: {
    flexDirection: "row",
    gap: 8,
  },
  timeField: { flex: 1 },
  roomField: { flex: 1.2 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
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
  inputError: {
    borderColor: colors.notification,
  },
  errorText: {
    fontSize: 10,
    color: colors.notification,
    marginTop: 2,
  },
  saveBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  deleteRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.notification,
  },
});
