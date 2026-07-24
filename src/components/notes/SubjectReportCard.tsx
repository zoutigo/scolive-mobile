import React, { useEffect, useMemo } from "react";
import {
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
import { formatScore } from "../../utils/notes";
import type { TranslateFn } from "../../i18n/useTranslation";
import type {
  StudentNotesSequence,
  StudentSubjectNotes,
} from "../../types/notes.types";

function createAppreciationSchema(t: TranslateFn) {
  return z.object({
    value: z
      .string()
      .trim()
      .min(1, t("notes.reports.detail.appreciationRequired")),
  });
}
type AppreciationFormInput = { value: string };

// ─── AppreciationEditor ─────────────────────────────────────────────────────
// Éditable si `editing` + callbacks fournis, sinon simple texte en lecture
// seule (aucune icône/bouton d'action) piloté par `editable`.

export function AppreciationEditor(props: {
  value: string;
  editable: boolean;
  editing?: boolean;
  onStartEdit?: () => void;
  onCancel?: () => void;
  onSave?: (value: string) => void | Promise<void>;
  isSaving?: boolean;
  t: TranslateFn;
  testIDPrefix: string;
}) {
  const { t } = props;
  const schema = useMemo(() => createAppreciationSchema(t), [t]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppreciationFormInput>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { value: props.value },
  });

  const editing = props.editable && props.editing === true;
  const value = props.value;
  useEffect(() => {
    if (editing) {
      reset({ value });
    }
  }, [editing, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await props.onSave?.(data.value.trim());
    } catch {
      // L'erreur est déjà notifiée via le toast global côté écran parent ;
      // on garde le formulaire ouvert pour permettre une nouvelle tentative.
    }
  });

  if (!props.editable) {
    return (
      <Text
        style={styles.appreciationReadOnlyText}
        testID={`${props.testIDPrefix}-readonly`}
      >
        {props.value || t("notes.reports.detail.noAppreciation")}
      </Text>
    );
  }

  if (editing) {
    return (
      <View style={styles.editorBlock} testID={`${props.testIDPrefix}-editor`}>
        <Controller
          control={control}
          name="value"
          render={({ field, fieldState }) => (
            <TextInput
              ref={field.ref}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              multiline
              style={[
                styles.editorInput,
                fieldState.error && styles.editorInputError,
              ]}
              placeholder={t("notes.reports.detail.appreciationPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              testID={`${props.testIDPrefix}-input`}
            />
          )}
        />
        {errors.value?.message ? (
          <Text
            style={styles.editorFieldError}
            testID={`${props.testIDPrefix}-error`}
          >
            {errors.value.message}
          </Text>
        ) : null}
        <View style={styles.editorActionsRow}>
          <TouchableOpacity
            style={styles.editorCancelBtn}
            onPress={props.onCancel}
            testID={`${props.testIDPrefix}-cancel`}
          >
            <Text style={styles.editorCancelText}>
              {t("notes.reports.detail.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.editorSaveBtn,
              props.isSaving && styles.editorSaveBtnDisabled,
            ]}
            onPress={() => void onSubmit()}
            disabled={props.isSaving}
            testID={`${props.testIDPrefix}-save`}
          >
            <Text style={styles.editorSaveText}>
              {t("notes.reports.detail.saveField")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.appreciationRow}
      onPress={props.onStartEdit}
      testID={`${props.testIDPrefix}-display`}
    >
      <Text style={styles.appreciationText} numberOfLines={2}>
        {props.value || t("notes.reports.detail.noAppreciation")}
      </Text>
      <View style={styles.appreciationIconWrap}>
        <Ionicons
          name="chatbox-ellipses-outline"
          size={22}
          color={colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── SubjectReportCard ──────────────────────────────────────────────────────
// Carte "bulletin" d'une matière : rang, moyennes par séquence, moyenne du
// trimestre, appréciation. `editable=false` masque toute action (utilisé en
// lecture seule côté parent/élève) ; `editable=true` branche l'éditeur
// d'appréciation (utilisé côté enseignant, réservé au prof de la matière).

export type SubjectReportSequenceRow = {
  sequence: StudentNotesSequence;
  label: string;
  studentAverage: number | null;
};

export function SubjectReportCard(props: {
  subject: StudentSubjectNotes;
  sequenceRows: SubjectReportSequenceRow[];
  editable: boolean;
  editing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveAppreciation?: (value: string) => void | Promise<void>;
  isSaving?: boolean;
  appreciationValue: string;
  t: TranslateFn;
  /** testID appliqué à la carte elle-même. */
  testID: string;
  /** Préfixe des testID des éléments internes (rang, séquences, appréciation). */
  testIDPrefix: string;
}) {
  const { subject, t } = props;
  const showAppreciation = props.editable || props.appreciationValue;

  return (
    <View style={styles.subjectCard} testID={props.testID}>
      <View style={styles.subjectCardHeader}>
        <Text style={styles.subjectCardName}>
          {subject.subjectLabel.toUpperCase()}
        </Text>
        <Text style={styles.subjectCardCoeff}>
          {t("notes.avgs.coef")} {subject.coefficient}
        </Text>
      </View>

      {subject.rank != null && subject.classSize != null ? (
        <Text
          style={styles.subjectRankLine}
          testID={`${props.testIDPrefix}-rank`}
        >
          {t("notes.reports.detail.rankAndClassAverage")
            .replace("{rank}", String(subject.rank))
            .replace("{total}", String(subject.classSize))
            .replace("{classAverage}", formatScore(subject.classAverage))}
        </Text>
      ) : null}

      <View style={styles.metricsRow}>
        {props.sequenceRows.map((row) => (
          <View
            key={row.sequence}
            style={styles.metricCell}
            testID={`${props.testIDPrefix}-sequence-${row.sequence}`}
          >
            <Text style={styles.metricLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={styles.metricValue}>
              {formatScore(row.studentAverage)}
            </Text>
          </View>
        ))}
        <View style={[styles.metricCell, styles.metricCellEnd]}>
          <Text style={styles.metricLabel} numberOfLines={1}>
            {t("notes.reports.detail.termAverage")}
          </Text>
          <Text style={[styles.metricValue, styles.metricValueStrong]}>
            {formatScore(subject.studentAverage)}
          </Text>
        </View>
      </View>

      {showAppreciation ? (
        <AppreciationEditor
          value={props.appreciationValue}
          editable={props.editable}
          editing={props.editing}
          onStartEdit={props.onStartEdit}
          onCancel={props.onCancelEdit}
          onSave={props.onSaveAppreciation}
          isSaving={props.isSaving}
          t={t}
          testIDPrefix={props.testIDPrefix}
        />
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  subjectCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  subjectCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectCardName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subjectCardCoeff: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  subjectRankLine: {
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.75,
    marginTop: -4,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  metricCell: { alignItems: "center", gap: 3 },
  metricCellEnd: { alignItems: "flex-end" },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  metricValueStrong: {
    fontSize: 16,
    color: colors.primary,
  },
  appreciationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  appreciationText: { flex: 1, fontSize: 13, color: colors.textPrimary },
  appreciationReadOnlyText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  appreciationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  editorBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
  },
  editorInput: {
    minHeight: 72,
    textAlignVertical: "top",
    fontSize: 13,
    color: colors.textPrimary,
  },
  editorInputError: {
    borderWidth: 1,
    borderColor: colors.notification,
    borderRadius: 8,
    padding: 6,
  },
  editorFieldError: {
    fontSize: 11,
    color: colors.notification,
  },
  editorActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editorCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editorCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  editorSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  editorSaveBtnDisabled: { opacity: 0.6 },
  editorSaveText: { fontSize: 13, fontWeight: "700", color: colors.white },
});
