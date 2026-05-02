import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import * as DocumentPicker from "expo-document-picker";
import { RichEditor } from "react-native-pell-rich-editor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { RichTextToolbar } from "../editor/RichTextToolbar";
import type {
  EvaluationAttachmentDraft,
  NotesTeacherContext,
  UpsertEvaluationPayload,
} from "../../types/notes.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return "";
  }
}

function displayToIso(display: string): string {
  const m = display
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!m) return "";
  const [, dd, mm, yyyy, hh = "08", min = "00"] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00.000Z`;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const evalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Titre requis (min. 3 caractères)")
    .max(100, "Titre trop long"),
  subjectId: z.string().min(1, "Matière requise"),
  subjectBranchId: z.string().optional(),
  evaluationTypeId: z.string().min(1, "Type d'évaluation requis"),
  term: z.enum(["TERM_1", "TERM_2", "TERM_3"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  scheduledAt: z
    .string()
    .min(1, "Date requise")
    .refine(
      (v) => /^\d{2}\/\d{2}\/\d{4}(\s+\d{2}:\d{2})?$/.test(v.trim()),
      "Format : JJ/MM/AAAA HH:MM",
    ),
  coefficient: z
    .string()
    .min(1, "Coefficient requis")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0.25, "Min 0.25"),
  maxScore: z
    .string()
    .min(1, "Barème requis")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 1, "Min 1"),
});

type FormValues = z.infer<typeof evalSchema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { label: "Bleu", value: "#0C5FA8" },
  { label: "Vert", value: "#217346" },
  { label: "Rouge", value: "#B42318" },
  { label: "Noir", value: "#1F2933" },
];

const TERM_LABELS: Record<string, string> = {
  TERM_1: "T1",
  TERM_2: "T2",
  TERM_3: "T3",
};

// ─── Props ────────────────────────────────────────────────────────────────────

type EvaluationFormProps = {
  teacherContext: NotesTeacherContext;
  initialValues?: Partial<UpsertEvaluationPayload>;
  mode: "create" | "edit";
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: (payload: UpsertEvaluationPayload) => Promise<void>;
  onUploadAttachment: (file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }) => Promise<EvaluationAttachmentDraft>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function EvaluationForm({
  teacherContext,
  initialValues,
  mode,
  isSubmitting,
  onBack,
  onSubmit,
  onUploadAttachment,
}: EvaluationFormProps) {
  const insets = useSafeAreaInsets();
  const richEditorRef = useRef<RichEditor>(null);
  const [descriptionHtml, setDescriptionHtml] = useState(
    initialValues?.description ?? "",
  );
  const [attachments, setAttachments] = useState<EvaluationAttachmentDraft[]>(
    initialValues?.attachments ?? [],
  );
  const [titleFocused, setTitleFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);
  const [coeffFocused, setCoeffFocused] = useState(false);
  const [maxScoreFocused, setMaxScoreFocused] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(evalSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      subjectId:
        initialValues?.subjectId ?? teacherContext.subjects[0]?.id ?? "",
      subjectBranchId: initialValues?.subjectBranchId ?? "",
      evaluationTypeId:
        initialValues?.evaluationTypeId ??
        teacherContext.evaluationTypes[0]?.id ??
        "",
      term: (initialValues?.term ?? "TERM_1") as "TERM_1" | "TERM_2" | "TERM_3",
      status: (initialValues?.status ?? "DRAFT") as "DRAFT" | "PUBLISHED",
      scheduledAt: isoToDisplay(initialValues?.scheduledAt ?? ""),
      coefficient: String(initialValues?.coefficient ?? 1),
      maxScore: String(initialValues?.maxScore ?? 20),
    },
  });

  const watchedSubjectId = watch("subjectId");

  useEffect(() => {
    setValue("subjectBranchId", "");
  }, [watchedSubjectId, setValue]);

  const selectedSubject =
    teacherContext.subjects.find((s) => s.id === watchedSubjectId) ?? null;

  function openColorMenu() {
    Alert.alert("Couleur du texte", "Choisissez une couleur", [
      ...COLOR_PRESETS.map((p) => ({
        text: p.label,
        onPress: () => richEditorRef.current?.setForeColor(p.value),
      })),
      { text: "Annuler", style: "cancel" as const },
    ]);
  }

  function applyHeading() {
    richEditorRef.current?.command(
      "document.execCommand('formatBlock', false, '<h2>'); true;",
    );
  }

  function applyQuote() {
    richEditorRef.current?.command(
      "document.execCommand('formatBlock', false, '<blockquote>'); true;",
    );
  }

  async function handleAddAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uploaded = await Promise.all(
        result.assets.map((a) =>
          onUploadAttachment({
            uri: a.uri,
            mimeType: a.mimeType ?? "application/octet-stream",
            fileName: a.name,
          }),
        ),
      );
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      // silent — parent shows error toast if needed
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  const onFormSubmit = handleSubmit(async (values) => {
    const editorHtml = await richEditorRef.current?.getContentHtml?.();
    const finalHtml =
      typeof editorHtml === "string" && editorHtml.trim()
        ? editorHtml
        : descriptionHtml;

    const payload: UpsertEvaluationPayload = {
      subjectId: values.subjectId,
      subjectBranchId: values.subjectBranchId || undefined,
      evaluationTypeId: values.evaluationTypeId,
      title: values.title.trim(),
      description: finalHtml || undefined,
      coefficient: Number(values.coefficient),
      maxScore: Number(values.maxScore),
      term: values.term,
      scheduledAt: displayToIso(values.scheduledAt),
      status: values.status,
      attachments,
    };

    await onSubmit(payload);
  });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Back ─────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.backRow}
        onPress={onBack}
        testID="eval-form-back"
      >
        <Ionicons name="arrow-back-outline" size={18} color={colors.primary} />
        <Text style={styles.backText}>Liste des évaluations</Text>
      </TouchableOpacity>

      {/* ════ IDENTIFICATION ════════════════════════════════════ */}
      <SectionHeader label="Identification" />

      {/* Titre */}
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Titre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.inputLarge,
                titleFocused && styles.inputFocused,
                errors.title && styles.inputError,
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={() => {
                setTitleFocused(false);
                onBlur();
              }}
              onFocus={() => setTitleFocused(true)}
              placeholder="Composition de mathématiques"
              placeholderTextColor={colors.textSecondary}
              testID="eval-form-title"
            />
            {errors.title ? (
              <Text style={styles.errorText} testID="eval-form-title-error">
                {errors.title.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* Statut */}
      <Controller
        control={control}
        name="status"
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Statut</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, value === "DRAFT" && styles.chipActive]}
                onPress={() => onChange("DRAFT")}
                testID="eval-form-status-draft"
              >
                <Text
                  style={[
                    styles.chipText,
                    value === "DRAFT" && styles.chipTextActive,
                  ]}
                >
                  Brouillon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  value === "PUBLISHED" && styles.chipActive,
                ]}
                onPress={() => onChange("PUBLISHED")}
                testID="eval-form-status-published"
              >
                <Text
                  style={[
                    styles.chipText,
                    value === "PUBLISHED" && styles.chipTextActive,
                  ]}
                >
                  Publié
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* ════ CLASSIFICATION ════════════════════════════════════ */}
      <SectionHeader label="Classification" />

      {/* Matière */}
      <Controller
        control={control}
        name="subjectId"
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Matière <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipRow}>
              {teacherContext.subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, value === s.id && styles.chipActive]}
                  onPress={() => onChange(s.id)}
                  testID={`eval-form-subject-${s.id}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      value === s.id && styles.chipTextActive,
                    ]}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.subjectId ? (
              <Text style={styles.errorText} testID="eval-form-subject-error">
                {errors.subjectId.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* Sous-branche */}
      {selectedSubject && selectedSubject.branches.length > 0 ? (
        <Controller
          control={control}
          name="subjectBranchId"
          render={({ field: { onChange, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Sous-branche</Text>
              <View style={styles.chipRow}>
                {selectedSubject.branches.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.chip, value === b.id && styles.chipActive]}
                    onPress={() => onChange(b.id)}
                    testID={`eval-form-branch-${b.id}`}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        value === b.id && styles.chipTextActive,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      ) : null}

      {/* Type d'évaluation */}
      <Controller
        control={control}
        name="evaluationTypeId"
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipRow}>
              {teacherContext.evaluationTypes.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, value === t.id && styles.chipActive]}
                  onPress={() => onChange(t.id)}
                  testID={`eval-form-type-${t.id}`}
                >
                  <Text
                    style={[
                      styles.chipText,
                      value === t.id && styles.chipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.evaluationTypeId ? (
              <Text style={styles.errorText} testID="eval-form-type-error">
                {errors.evaluationTypeId.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* ════ PLANIFICATION ════════════════════════════════════ */}
      <SectionHeader label="Planification" />

      {/* Période + Date */}
      <View style={styles.planRow}>
        <Controller
          control={control}
          name="term"
          render={({ field: { onChange, value } }) => (
            <View style={[styles.fieldGroup, styles.planCol]}>
              <Text style={styles.fieldLabel}>Période</Text>
              <View style={styles.termStack}>
                {(["TERM_1", "TERM_2", "TERM_3"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, value === t && styles.chipActive]}
                    onPress={() => onChange(t)}
                    testID={`eval-form-term-${t}`}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        value === t && styles.chipTextActive,
                      ]}
                    >
                      {TERM_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="scheduledAt"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.fieldGroup, styles.planColDate]}>
              <Text style={styles.fieldLabel}>
                Date prévue <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  dateFocused && styles.inputFocused,
                  errors.scheduledAt && styles.inputError,
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  setDateFocused(false);
                  onBlur();
                }}
                onFocus={() => setDateFocused(true)}
                placeholder="JJ/MM/AAAA HH:MM"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numbers-and-punctuation"
                testID="eval-form-date"
              />
              {errors.scheduledAt ? (
                <Text style={styles.errorText} testID="eval-form-date-error">
                  {errors.scheduledAt.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </View>

      {/* Coefficient + Barème */}
      <View style={styles.dualRow}>
        <Controller
          control={control}
          name="coefficient"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Coefficient</Text>
              <TextInput
                style={[
                  styles.input,
                  coeffFocused && styles.inputFocused,
                  errors.coefficient && styles.inputError,
                ]}
                value={String(value)}
                onChangeText={onChange}
                onBlur={() => {
                  setCoeffFocused(false);
                  onBlur();
                }}
                onFocus={() => setCoeffFocused(true)}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                testID="eval-form-coefficient"
              />
              {errors.coefficient ? (
                <Text style={styles.errorText}>
                  {errors.coefficient.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="maxScore"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Barème</Text>
              <TextInput
                style={[
                  styles.input,
                  maxScoreFocused && styles.inputFocused,
                  errors.maxScore && styles.inputError,
                ]}
                value={String(value)}
                onChangeText={onChange}
                onBlur={() => {
                  setMaxScoreFocused(false);
                  onBlur();
                }}
                onFocus={() => setMaxScoreFocused(true)}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={colors.textSecondary}
                testID="eval-form-maxscore"
              />
              {errors.maxScore ? (
                <Text style={styles.errorText}>{errors.maxScore.message}</Text>
              ) : null}
            </View>
          )}
        />
      </View>

      {/* ════ DESCRIPTION ════════════════════════════════════════ */}
      <SectionHeader label="Description" />

      <View style={styles.fieldGroup}>
        <RichTextToolbar
          editorRef={richEditorRef}
          onPressColor={openColorMenu}
          onPressHeading={applyHeading}
          onPressQuote={applyQuote}
        />
        <View style={styles.editorContainer}>
          <RichEditor
            ref={richEditorRef}
            initialContentHTML={initialValues?.description ?? ""}
            onChange={setDescriptionHtml}
            placeholder="Consignes, compétences visées, modalités…"
            style={styles.editor}
            testID="eval-form-description-editor"
          />
        </View>
      </View>

      {/* ════ PIÈCES JOINTES ════════════════════════════════════ */}
      <SectionHeader label="Pièces jointes" />

      <View style={styles.fieldGroup}>
        <TouchableOpacity
          style={styles.addAttachmentBtn}
          onPress={() => void handleAddAttachment()}
          disabled={isSubmitting}
          testID="eval-form-add-attachment"
        >
          <Ionicons name="attach-outline" size={16} color={colors.primary} />
          <Text style={styles.addAttachmentText}>Ajouter un fichier</Text>
        </TouchableOpacity>

        {attachments.map((a, i) => (
          <View
            key={`${a.fileName}-${i}`}
            style={styles.attachmentItem}
            testID={`eval-form-attachment-${i}`}
          >
            <View style={styles.attachmentInfo}>
              <Ionicons
                name="document-outline"
                size={16}
                color={colors.textSecondary}
              />
              <View style={styles.attachmentText}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {a.fileName}
                </Text>
                {a.sizeLabel ? (
                  <Text style={styles.attachmentMeta}>{a.sizeLabel}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => removeAttachment(i)}
              testID={`eval-form-remove-attachment-${i}`}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        ))}

        {attachments.length === 0 ? (
          <Text style={styles.attachmentHint}>
            Aucune pièce jointe. Ajoutez un sujet, une consigne ou un barème.
          </Text>
        ) : null}
      </View>

      {/* ════ SUBMIT ════════════════════════════════════════════ */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        onPress={() => void onFormSubmit()}
        disabled={isSubmitting}
        testID="eval-form-submit"
      >
        <Text style={styles.submitBtnText}>
          {mode === "create" ? "Créer l'évaluation" : "Mettre à jour"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Section header helper ────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 0 },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 4,
  },
  backText: { color: colors.primary, fontSize: 14, fontWeight: "600" },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.warmBorder,
    marginLeft: 8,
  },

  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  required: { color: "#DC3545" },
  errorText: { fontSize: 12, color: "#DC3545", marginTop: 4 },

  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputLarge: { fontSize: 17, paddingVertical: 14 },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: "#DC3545" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  planRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  planCol: { width: 80 },
  planColDate: { flex: 1 },
  termStack: { gap: 6 },

  dualRow: { flexDirection: "row", gap: 12 },

  editorContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
    minHeight: 160,
    backgroundColor: colors.white,
    marginTop: 8,
  },
  editor: { minHeight: 160, backgroundColor: colors.white },

  addAttachmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignSelf: "flex-start",
  },
  addAttachmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  attachmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  attachmentText: { flex: 1 },
  attachmentName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  attachmentMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  attachmentHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: "800" },
});
