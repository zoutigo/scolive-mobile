import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type {
  EvaluationStudentScore,
  StudentEvaluationStatus,
} from "../../types/notes.types";

// ─── Schema ───────────────────────────────────────────────────────────────────

function buildSchema(maxScore: number) {
  return z
    .object({
      status: z.enum(["NOT_GRADED", "ENTERED", "ABSENT", "EXCUSED"] as const),
      score: z.string(),
      comment: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.status !== "ENTERED") return;
      const trimmed = data.score.trim();
      if (!trimmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La note est requise",
          path: ["score"],
        });
        return;
      }
      const num = Number(trimmed);
      if (isNaN(num) || num < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valeur invalide (nombre ≥ 0)",
          path: ["score"],
        });
      } else if (num > maxScore) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Note supérieure au barème (/${maxScore})`,
          path: ["score"],
        });
      }
    });
}

type ScoreFormValues = {
  status: StudentEvaluationStatus;
  score: string;
  comment: string;
};

// ─── Types publics ────────────────────────────────────────────────────────────

export interface StudentScoreSaveData {
  studentId: string;
  score: number | null;
  status: StudentEvaluationStatus;
  comment: string | null;
}

// ─── Options statut ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: StudentEvaluationStatus; label: string }> =
  [
    { value: "NOT_GRADED", label: "Non noté" },
    { value: "ENTERED", label: "Noté" },
    { value: "ABSENT", label: "Absent" },
    { value: "EXCUSED", label: "Dispensé" },
  ];

// ─── Composant ────────────────────────────────────────────────────────────────

interface StudentScoreCardProps {
  student: EvaluationStudentScore;
  maxScore: number;
  onSave: (data: StudentScoreSaveData) => Promise<void>;
  testID?: string;
}

export function StudentScoreCard({
  student,
  maxScore,
  onSave,
  testID,
}: StudentScoreCardProps) {
  const hasExistingScore = student.score !== null;

  const schema = useMemo(() => buildSchema(maxScore), [maxScore]);

  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<ScoreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: student.scoreStatus ?? "NOT_GRADED",
      score: hasExistingScore ? String(student.score) : "",
      comment: student.comment ?? "",
    },
  });

  const status = watch("status");
  const commentValue = watch("comment");
  const hasComment = commentValue.trim().length > 0;

  const [commentOpen, setCommentOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(hasExistingScore);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  const selectedStatusLabel =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Non noté";

  function buildSaveData(values: ScoreFormValues): StudentScoreSaveData {
    return {
      studentId: student.id,
      score:
        values.status === "ENTERED" && values.score.trim()
          ? Number(values.score.trim())
          : null,
      status: values.status,
      comment: values.comment.trim() || null,
    };
  }

  const onSubmitNote = handleSubmit(async (values) => {
    setIsSavingNote(true);
    try {
      await onSave(buildSaveData(values));
      setIsViewMode(true);
    } catch {
      // error handled by parent via toast
    } finally {
      setIsSavingNote(false);
    }
  });

  const onSubmitComment = handleSubmit(async (values) => {
    setIsSavingComment(true);
    try {
      await onSave(buildSaveData(values));
      setCommentOpen(false);
    } catch {
      // error handled by parent via toast
    } finally {
      setIsSavingComment(false);
    }
  });

  return (
    <View style={styles.card} testID={testID ?? `scores-student-${student.id}`}>
      {/* ── Header : nom + statut (sans bordure) ── */}
      <View style={styles.header}>
        <Text
          style={styles.studentName}
          testID={`scores-student-name-${student.id}`}
        >
          {student.lastName} {student.firstName}
        </Text>
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={() => !isViewMode && setStatusPickerOpen(true)}
          testID={`scores-status-btn-${student.id}`}
        >
          <Text style={styles.statusBtnText}>{selectedStatusLabel}</Text>
          {!isViewMode ? (
            <Ionicons name="chevron-down" size={13} color={colors.primary} />
          ) : null}
        </TouchableOpacity>
      </View>

      {/* ── Ligne note + submit ── */}
      <View style={styles.noteRow}>
        {status === "ENTERED" ? (
          <View style={styles.scoreBlock}>
            <Text style={styles.noteLabel}>Note</Text>
            {isViewMode ? (
              <Text
                style={styles.scoreDisplay}
                testID={`scores-score-display-${student.id}`}
              >
                {watch("score")}/{maxScore}
              </Text>
            ) : (
              <Controller
                control={control}
                name="score"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.scoreInputRow}>
                    <TextInput
                      style={[
                        styles.scoreInput,
                        !!errors.score && styles.scoreInputError,
                      ]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={colors.textSecondary}
                      testID={`scores-note-${student.id}`}
                    />
                    <Text style={styles.maxScoreLabel}>/{maxScore}</Text>
                  </View>
                )}
              />
            )}
          </View>
        ) : (
          <View style={styles.bodyFill} />
        )}

        <TouchableOpacity
          style={[
            styles.noteSubmitBtn,
            isViewMode ? styles.noteSubmitBtnModify : styles.noteSubmitBtnSave,
            isSavingNote && styles.submitBtnDisabled,
          ]}
          onPress={
            isViewMode ? () => setIsViewMode(false) : () => void onSubmitNote()
          }
          disabled={isSavingNote}
          testID={`scores-submit-${student.id}`}
        >
          {isSavingNote ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isViewMode ? "Modifier" : "Enregistrer"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Erreur note ── */}
      {errors.score && !isViewMode ? (
        <Text
          style={styles.errorText}
          testID={`scores-score-error-${student.id}`}
        >
          {errors.score.message}
        </Text>
      ) : null}

      {/* ── Séparateur + toggle commentaire ── */}
      <TouchableOpacity
        style={styles.commentToggleRow}
        onPress={() => setCommentOpen(!commentOpen)}
        testID={`scores-toggle-comment-${student.id}`}
      >
        <View style={styles.commentToggleLeft}>
          <Ionicons
            name={hasComment ? "chatbubble" : "chatbubble-outline"}
            size={15}
            color={hasComment ? colors.accentTeal : colors.textSecondary}
          />
          <Text
            style={[
              styles.commentToggleLabel,
              hasComment && styles.commentToggleLabelActive,
            ]}
          >
            Commentaire
          </Text>
          {hasComment ? (
            <View
              style={styles.commentDot}
              testID={`scores-comment-indicator-${student.id}`}
            />
          ) : null}
        </View>
        <Ionicons
          name={commentOpen ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* ── Section commentaire (collapsible) ── */}
      {commentOpen ? (
        <View style={styles.commentSection}>
          <Controller
            control={control}
            name="comment"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.commentInput}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Observation individuelle…"
                placeholderTextColor={colors.textSecondary}
                multiline
                testID={`scores-comment-${student.id}`}
              />
            )}
          />
          <TouchableOpacity
            style={[
              styles.commentSubmitBtn,
              isSavingComment && styles.submitBtnDisabled,
            ]}
            onPress={() => void onSubmitComment()}
            disabled={isSavingComment}
            testID={`scores-submit-comment-${student.id}`}
          >
            {isSavingComment ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                Enregistrer le commentaire
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Modal : sélection statut ── */}
      <Modal
        visible={statusPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setStatusPickerOpen(false)}
          testID={`scores-status-overlay-${student.id}`}
        >
          <Pressable
            style={styles.pickerCard}
            onPress={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.pickerOption,
                  status === opt.value && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setValue("status", opt.value, { shouldValidate: false });
                  if (opt.value !== "ENTERED") {
                    setValue("score", "");
                    clearErrors("score");
                  }
                  setStatusPickerOpen(false);
                }}
                testID={`scores-status-option-${student.id}-${opt.value}`}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    status === opt.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {status === opt.value ? (
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  studentName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
  },
  statusBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  // ── Note row ──
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bodyFill: { flex: 1 },
  noteLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  scoreInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  scoreInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    width: 56,
    textAlign: "center",
  },
  scoreInputError: { borderColor: "#DC3545" },
  maxScoreLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  scoreDisplay: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  // ── Buttons ──
  noteSubmitBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 96,
  },
  noteSubmitBtnSave: {
    backgroundColor: colors.primary,
  },
  noteSubmitBtnModify: {
    backgroundColor: colors.warmAccent,
  },
  commentSubmitBtn: {
    borderRadius: 8,
    backgroundColor: colors.accentTeal,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  // ── Error ──
  errorText: {
    color: "#DC3545",
    fontSize: 11,
    fontWeight: "600",
    marginTop: -4,
  },
  // ── Comment toggle row ──
  commentToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  commentToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentToggleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  commentToggleLabelActive: {
    color: colors.accentTeal,
  },
  commentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentTeal,
  },
  // ── Comment section ──
  commentSection: {
    gap: 8,
  },
  commentInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  pickerOptionSelected: { backgroundColor: "#eef5fb" },
  pickerOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
});
