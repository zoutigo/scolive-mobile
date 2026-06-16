import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
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
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import { RichTextToolbar } from "../editor/RichTextToolbar";
import { DatePickerField } from "../DatePickerField";
import { TimePickerField } from "../TimePickerField";
import { getCurrentTerm, termLabel } from "../../utils/notes";
import { parseDateInput, toIsoDateString } from "../../utils/timetable";
import type {
  EvaluationAttachmentDraft,
  NotesTeacherContext,
  StudentNotesTerm,
  UpsertEvaluationPayload,
} from "../../types/notes.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToDatePart(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return toIsoDateString(d);
  } catch {
    return "";
  }
}

function isoToTimePart(iso: string): string {
  if (!iso) return "08:00";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "08:00";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "08:00";
  }
}

function combineToIso(date: string, time: string): string {
  const [hh = "08", min = "00"] = time.split(":");
  return `${date}T${hh}:${min}:00.000Z`;
}

function termFromDate(dateIso: string): StudentNotesTerm {
  const d = parseDateInput(dateIso);
  return d ? getCurrentTerm(d) : getCurrentTerm();
}

// ─── Schema ───────────────────────────────────────────────────────────────────

function buildEvalSchema(t: TranslateFn) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(3, t("notes.form.validation.titleRequired"))
      .max(100, t("notes.form.validation.titleTooLong")),
    subjectId: z.string().min(1, t("notes.form.validation.subjectRequired")),
    subjectBranchId: z.string().optional(),
    evaluationTypeId: z
      .string()
      .min(1, t("notes.form.validation.typeRequired")),
    scheduledDate: z
      .string()
      .min(1, t("notes.form.validation.dateRequired"))
      .refine(
        (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
        t("notes.form.validation.dateInvalid"),
      ),
    scheduledTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, t("notes.form.validation.timeInvalid")),
    coefficient: z
      .string()
      .min(1, t("notes.form.validation.coefficientRequired"))
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0.25,
        t("notes.form.validation.coefficientMin"),
      ),
    maxScore: z
      .string()
      .min(1, t("notes.form.validation.maxScoreRequired"))
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 1,
        t("notes.form.validation.maxScoreMin"),
      ),
  });
}

type FormValues = z.infer<ReturnType<typeof buildEvalSchema>>;

// ─── Constants ────────────────────────────────────────────────────────────────

function buildColorPresets(t: TranslateFn) {
  return [
    { label: t("notes.form.colors.blue"), value: "#0C5FA8" },
    { label: t("notes.form.colors.green"), value: "#217346" },
    { label: t("notes.form.colors.red"), value: "#B42318" },
    { label: t("notes.form.colors.black"), value: "#1F2933" },
  ];
}

// ─── SelectField ──────────────────────────────────────────────────────────────

type SelectOption = { label: string; value: string };

function SelectField({
  options,
  value,
  onChange,
  onBlur,
  placeholder,
  hasError = false,
  testID,
  disabled = false,
}: {
  options: SelectOption[];
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  hasError?: boolean;
  testID?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  function close() {
    setOpen(false);
    onBlur?.();
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selectTrigger,
          hasError && styles.selectTriggerError,
          disabled && styles.selectTriggerDisabled,
        ]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        testID={testID}
      >
        <Text
          style={[styles.selectValue, !selected && styles.selectPlaceholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={hasError ? "#DC3545" : colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.selectBackdrop} onPress={close}>
          <Pressable
            style={styles.selectSheet}
            onPress={(e) => e.stopPropagation()}
            testID={testID ? `${testID}-sheet` : undefined}
          >
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.selectOption,
                  opt.value === value && styles.selectOptionActive,
                ]}
                onPress={() => {
                  onChange(opt.value);
                  close();
                }}
                testID={testID ? `${testID}-option-${opt.value}` : undefined}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    opt.value === value && styles.selectOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.value === value ? (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const richEditorRef = useRef<RichEditor>(null);
  const [descriptionHtml, setDescriptionHtml] = useState(
    initialValues?.description ?? "",
  );
  const [attachments, setAttachments] = useState<EvaluationAttachmentDraft[]>(
    initialValues?.attachments ?? [],
  );
  const [titleFocused, setTitleFocused] = useState(false);
  const [coeffFocused, setCoeffFocused] = useState(false);
  const [maxScoreFocused, setMaxScoreFocused] = useState(false);

  const defaultType =
    teacherContext.evaluationTypes.find((et) => et.isDefault)?.id ??
    teacherContext.evaluationTypes[0]?.id ??
    "";

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(buildEvalSchema(t)),
    defaultValues: {
      title: initialValues?.title ?? "",
      subjectId:
        initialValues?.subjectId ?? teacherContext.subjects[0]?.id ?? "",
      subjectBranchId: initialValues?.subjectBranchId ?? "",
      evaluationTypeId: initialValues?.evaluationTypeId ?? defaultType,
      scheduledDate: isoToDatePart(initialValues?.scheduledAt ?? ""),
      scheduledTime: isoToTimePart(initialValues?.scheduledAt ?? ""),
      coefficient: String(initialValues?.coefficient ?? 1),
      maxScore: String(initialValues?.maxScore ?? 20),
    },
  });

  const watchedSubjectId = watch("subjectId");
  const watchedDate = watch("scheduledDate");

  const prevSubjectRef = useRef(watchedSubjectId);
  useEffect(() => {
    if (prevSubjectRef.current !== watchedSubjectId) {
      prevSubjectRef.current = watchedSubjectId;
      setValue("subjectBranchId", "");
    }
  }, [watchedSubjectId, setValue]);

  const selectedSubject =
    teacherContext.subjects.find((s) => s.id === watchedSubjectId) ?? null;
  const autoTerm = watchedDate ? termFromDate(watchedDate) : getCurrentTerm();

  const subjectOptions: SelectOption[] = teacherContext.subjects.map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const typeOptions: SelectOption[] = teacherContext.evaluationTypes.map(
    (et) => ({ value: et.id, label: et.label }),
  );
  const branchOptions: SelectOption[] =
    selectedSubject?.branches.map((b) => ({ value: b.id, label: b.name })) ??
    [];

  function openColorMenu() {
    Alert.alert(
      t("notes.form.colorMenu.title"),
      t("notes.form.colorMenu.message"),
      [
        ...buildColorPresets(t).map((p) => ({
          text: p.label,
          onPress: () => richEditorRef.current?.setForeColor(p.value),
        })),
        { text: t("notes.form.colorMenu.cancel"), style: "cancel" as const },
      ],
    );
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

  function buildSubmitHandler(status: "DRAFT" | "PUBLISHED") {
    return handleSubmit(async (values) => {
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
        term: termFromDate(values.scheduledDate),
        scheduledAt: combineToIso(values.scheduledDate, values.scheduledTime),
        status,
        attachments,
      };

      await onSubmit(payload);
    });
  }

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
        <Text style={styles.backText}>{t("notes.form.backToList")}</Text>
      </TouchableOpacity>

      {/* ════ IDENTIFICATION ════════════════════════════════════ */}
      <SectionHeader label={t("notes.form.sections.identification")} />

      {/* Titre */}
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("notes.form.fields.title")}{" "}
              <Text style={styles.required}>*</Text>
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
              placeholder={t("notes.form.fields.titlePlaceholder")}
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

      {/* ════ CLASSIFICATION ════════════════════════════════════ */}
      <SectionHeader label={t("notes.form.sections.classification")} />

      {/* Matière */}
      <Controller
        control={control}
        name="subjectId"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("notes.form.fields.subject")}{" "}
              <Text style={styles.required}>*</Text>
            </Text>
            <SelectField
              options={subjectOptions}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={t("notes.form.fields.subjectPlaceholder")}
              hasError={!!errors.subjectId}
              testID="eval-form-subject"
            />
            {errors.subjectId ? (
              <Text style={styles.errorText} testID="eval-form-subject-error">
                {errors.subjectId.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* Sous-branche */}
      {selectedSubject && branchOptions.length > 0 ? (
        <Controller
          control={control}
          name="subjectBranchId"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t("notes.form.fields.branch")}
              </Text>
              <SelectField
                options={branchOptions}
                value={value ?? ""}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={t("notes.form.fields.branchPlaceholder")}
                testID="eval-form-branch"
              />
            </View>
          )}
        />
      ) : null}

      {/* Type d'évaluation */}
      <Controller
        control={control}
        name="evaluationTypeId"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("notes.form.fields.type")}{" "}
              <Text style={styles.required}>*</Text>
            </Text>
            <SelectField
              options={typeOptions}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              placeholder={t("notes.form.fields.typePlaceholder")}
              hasError={!!errors.evaluationTypeId}
              testID="eval-form-type"
            />
            {errors.evaluationTypeId ? (
              <Text style={styles.errorText} testID="eval-form-type-error">
                {errors.evaluationTypeId.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* ════ PLANIFICATION ════════════════════════════════════ */}
      <SectionHeader label={t("notes.form.sections.planning")} />

      {/* Date + Heure */}
      <View style={styles.dualRow}>
        <Controller
          control={control}
          name="scheduledDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.fieldGroup, { flex: 2 }]}>
              <Text style={styles.fieldLabel}>
                {t("notes.form.fields.scheduledDate")}{" "}
                <Text style={styles.required}>*</Text>
              </Text>
              <DatePickerField
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={t("notes.form.fields.datePlaceholder")}
                title={t("notes.form.fields.dateTitle")}
                hasError={!!errors.scheduledDate}
                testID="eval-form-date"
              />
              {errors.scheduledDate ? (
                <Text style={styles.errorText} testID="eval-form-date-error">
                  {errors.scheduledDate.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="scheduledTime"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>
                {t("notes.form.fields.time")}
              </Text>
              <TimePickerField
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={t("notes.form.fields.time")}
                title={t("notes.form.fields.timeTitle")}
                hasError={!!errors.scheduledTime}
                testID="eval-form-time"
              />
              {errors.scheduledTime ? (
                <Text style={styles.errorText} testID="eval-form-time-error">
                  {errors.scheduledTime.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </View>

      {/* Trimestre auto-détecté */}
      <View style={styles.termBadgeRow}>
        <Ionicons
          name="calendar-clear-outline"
          size={14}
          color={colors.primary}
        />
        <Text style={styles.termBadgeText} testID="eval-form-term-auto">
          {termLabel(autoTerm, t)} — {t("notes.form.termAutoSuffix")}
        </Text>
      </View>

      {/* Coefficient + Barème */}
      <View style={styles.dualRow}>
        <Controller
          control={control}
          name="coefficient"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>
                {t("notes.form.fields.coefficient")}
              </Text>
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
                <Text
                  style={styles.errorText}
                  testID="eval-form-coefficient-error"
                >
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
              <Text style={styles.fieldLabel}>
                {t("notes.form.fields.maxScore")}
              </Text>
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
                <Text
                  style={styles.errorText}
                  testID="eval-form-maxscore-error"
                >
                  {errors.maxScore.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </View>

      {/* ════ DESCRIPTION ════════════════════════════════════════ */}
      <SectionHeader label={t("notes.form.sections.description")} />

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
            placeholder={t("notes.form.descriptionPlaceholder")}
            style={styles.editor}
            testID="eval-form-description-editor"
          />
        </View>
      </View>

      {/* ════ PIÈCES JOINTES ════════════════════════════════════ */}
      <SectionHeader label={t("notes.form.sections.attachments")} />

      <View style={styles.fieldGroup}>
        <TouchableOpacity
          style={styles.addAttachmentBtn}
          onPress={() => void handleAddAttachment()}
          disabled={isSubmitting}
          testID="eval-form-add-attachment"
        >
          <Ionicons name="attach-outline" size={16} color={colors.primary} />
          <Text style={styles.addAttachmentText}>
            {t("notes.form.addAttachment")}
          </Text>
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
            {t("notes.form.noAttachment")}
          </Text>
        ) : null}
      </View>

      {/* ════ ACTIONS ═══════════════════════════════════════════ */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.draftBtn, isSubmitting && styles.actionBtnDisabled]}
          onPress={() => void buildSubmitHandler("DRAFT")()}
          disabled={isSubmitting}
          testID="eval-form-save-draft"
        >
          <Ionicons name="save-outline" size={16} color={colors.primary} />
          <Text style={styles.draftBtnText}>
            {mode === "create"
              ? t("notes.form.saveDraft")
              : t("notes.form.save")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishBtn, isSubmitting && styles.actionBtnDisabled]}
          onPress={() => void buildSubmitHandler("PUBLISHED")()}
          disabled={isSubmitting}
          testID="eval-form-publish"
        >
          <Ionicons name="paper-plane-outline" size={16} color={colors.white} />
          <Text style={styles.publishBtnText}>{t("notes.form.publish")}</Text>
        </TouchableOpacity>
      </View>
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

  dualRow: { flexDirection: "row", gap: 12 },

  termBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignSelf: "flex-start",
  },
  termBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },

  // SelectField
  selectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectTriggerError: { borderColor: "#DC3545" },
  selectTriggerDisabled: { opacity: 0.5 },
  selectValue: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  selectPlaceholder: { color: colors.textSecondary },
  selectBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  selectSheet: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    maxWidth: 400,
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  selectOptionActive: { backgroundColor: `${colors.primary}12` },
  selectOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  selectOptionTextActive: { color: colors.primary, fontWeight: "700" },

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

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  draftBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    paddingVertical: 14,
  },
  draftBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  publishBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  publishBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  actionBtnDisabled: { opacity: 0.6 },
});
