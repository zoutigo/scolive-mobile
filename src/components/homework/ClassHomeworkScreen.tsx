import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { RichEditor } from "react-native-pell-rich-editor";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { useHomeworkStore } from "../../store/homework.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { notesApi } from "../../api/notes.api";
import { timetableApi } from "../../api/timetable.api";
import { homeworkApi } from "../../api/homework.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { getViewType } from "../navigation/nav-config";
import { useDrawer } from "../navigation/AppShell";
import { RichTextToolbar } from "../editor/RichTextToolbar";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { DatePickerField } from "../DatePickerField";
import { TimePickerField } from "../TimePickerField";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import { MonthGrid, buildWeekDays } from "../timetable/ChildTimetableScreen";
import {
  addDays,
  addMonths,
  buildTimetableRangeForView,
  formatMonthLabel,
  formatWeekRangeLabel,
  sameDate,
  startOfWeek,
  stripTime,
  subjectVisualTone,
  toIsoDateString,
} from "../../utils/timetable";
import {
  buildHomeworkMonthCells,
  extractImageUrls,
  formatHomeworkDateTime,
  formatHomeworkDayLabel,
  formatHomeworkShortDate,
  getHomeworkWeekendVisibility,
  homeworkDateKey,
  htmlToText,
  isHomeworkDone,
  isoToLocalInput,
  localInputToIso,
} from "../../utils/homework";
import type {
  HomeworkAttachment,
  HomeworkCommentPayload,
  HomeworkDetail,
  HomeworkRow,
  UpsertHomeworkPayload,
} from "../../types/homework.types";
import type {
  ClassTimetableContextResponse,
  MyTimetableResponse,
} from "../../types/timetable.types";

type TeacherSubjectOption = {
  value: string;
  label: string;
  colorHex?: string | null;
};

type HomeworkInlinePanel = "comments" | "control";

type HomeworkTabKey = "list" | "agenda";
type AgendaModeKey = "week" | "month";

const HOMEWORK_LIST_PAGE_SIZE = 10;

const HOMEWORK_TABS = [
  { key: "list" as const, label: "Liste", testID: "class-homework-tab-list" },
  {
    key: "agenda" as const,
    label: "Agenda des homeworks",
    testID: "class-homework-tab-agenda",
  },
];

const HOMEWORK_INLINE_IMAGE_STYLE =
  "max-width:100%;border-radius:8px;margin:8px 0;";

const homeworkFormSchema = z.object({
  subjectId: z.string().trim().min(1, "La matière est obligatoire."),
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  expectedDate: z.string().trim().min(1, "La date attendue est obligatoire."),
  expectedTime: z.string().trim().min(1, "L'heure attendue est obligatoire."),
});

type HomeworkFormValues = z.infer<typeof homeworkFormSchema>;

const homeworkCommentSchema = z.object({
  body: z.string().trim().min(1, "Le commentaire ne peut pas être vide."),
});

type HomeworkCommentFormValues = z.infer<typeof homeworkCommentSchema>;

const TEXT_COLOR_PRESETS = [
  { label: "Noir", value: "#111827" },
  { label: "Bleu", value: colors.primary },
  { label: "Vert", value: "#0F766E" },
  { label: "Rouge", value: "#B91C1C" },
] as const;

function fullStudentName(student: {
  firstName: string;
  lastName: string;
}): string {
  return `${student.lastName} ${student.firstName}`.trim();
}

function uniqueSubjectsFromContext(params: {
  classContext: ClassTimetableContextResponse | null;
  userId?: string;
  canManageAll: boolean;
}) {
  const result = new Map<string, TeacherSubjectOption>();
  const stylesBySubjectId = new Map(
    (params.classContext?.subjectStyles ?? []).map((entry) => [
      entry.subjectId,
      entry.colorHex,
    ]),
  );

  for (const assignment of params.classContext?.assignments ?? []) {
    if (!params.canManageAll && assignment.teacherUserId !== params.userId) {
      continue;
    }
    if (!result.has(assignment.subjectId)) {
      result.set(assignment.subjectId, {
        value: assignment.subjectId,
        label: assignment.subject.name,
        colorHex: stylesBySubjectId.get(assignment.subjectId) ?? null,
      });
    }
  }

  return [...result.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function WeekHomeworkColumns(props: {
  days: ReturnType<typeof buildWeekDays>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  countsByDate: Record<string, number>;
  testIDPrefix?: string;
}) {
  const prefix = props.testIDPrefix ?? "class-homework";
  return (
    <View style={styles.weekColumns} testID={`${prefix}-week-columns`}>
      {props.days.map((entry) => {
        const dateKey = toIsoDateString(entry.date);
        const selected = sameDate(entry.date, props.selectedDate);
        const count = props.countsByDate[dateKey] ?? 0;
        return (
          <TouchableOpacity
            key={dateKey}
            style={[styles.weekDayCard, selected && styles.weekDayCardActive]}
            onPress={() => props.onSelectDate(entry.date)}
            testID={`${prefix}-week-day-${dateKey}`}
          >
            <Text
              style={[
                styles.weekDayLabel,
                selected && styles.weekDayLabelActive,
              ]}
            >
              {entry.compactLabel}
            </Text>
            <Text
              style={[
                styles.weekDayNumber,
                selected && styles.weekDayNumberActive,
              ]}
            >
              {String(entry.date.getDate()).padStart(2, "0")}
            </Text>
            <View
              style={[
                styles.weekDayBadge,
                selected && styles.weekDayBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.weekDayBadgeText,
                  selected && styles.weekDayBadgeTextActive,
                ]}
              >
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HomeworkCard(props: {
  item: HomeworkRow;
  onPressDetails: () => void;
  canManage: boolean;
  canToggleDone?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleComments?: () => void;
  onToggleControl?: () => void;
  onToggleDone?: () => void;
  onAddInlineComment?: (body: string) => Promise<void>;
  commentsExpanded?: boolean;
  controlExpanded?: boolean;
  inlineDetail?: HomeworkDetail | null;
  inlineLoading?: boolean;
  testIDPrefix?: string;
}) {
  const prefix = props.testIDPrefix ?? "class-homework";
  const tone = subjectVisualTone(props.item.subject.colorHex ?? undefined);
  const done = isHomeworkDone(props.item);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const doneStudents =
    props.inlineDetail?.completionStatuses.filter((s) => Boolean(s.doneAt)) ??
    [];
  const summaryLabel = props.item.summary
    ? `${props.item.summary.doneStudents}/${props.item.summary.totalStudents}`
    : "0/0";

  async function submitInlineComment() {
    if (!commentDraft.trim() || !props.onAddInlineComment) return;
    setIsSubmittingComment(true);
    try {
      await props.onAddInlineComment(commentDraft.trim());
      setCommentDraft("");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  return (
    <View
      style={[
        styles.cardShell,
        { backgroundColor: tone.background, borderColor: tone.border },
        done && styles.cardDone,
      ]}
    >
      <TouchableOpacity
        style={styles.cardTapArea}
        onPress={props.onPressDetails}
        testID={`${prefix}-card-${props.item.id}`}
      >
        <View style={styles.cardHeaderSection}>
          <View style={styles.cardHeaderLine}>
            <View style={styles.cardSubjectRow}>
              <Text style={[styles.cardSubject, { color: tone.text }]}>
                {props.item.subject.name}
              </Text>
              {done ? (
                <View
                  style={[styles.donePill, { backgroundColor: tone.chip }]}
                  testID={`${prefix}-done-${props.item.id}`}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.white}
                  />
                  <Text style={styles.donePillText}>Fait</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardAuthorInline} numberOfLines={1}>
              {props.item.authorDisplayName}
            </Text>
          </View>
          <Text style={styles.cardMetaLabel}>
            Date attendue : {formatHomeworkShortDate(props.item.expectedAt)}
          </Text>
        </View>

        <View style={styles.cardBodySection}>
          <Text style={styles.cardTitle}>{props.item.title}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.cardActionsWrap}>
        <View style={styles.cardPrimaryActionsRow}>
          <TouchableOpacity
            style={styles.cardActionButton}
            onPress={props.onPressDetails}
            testID={`${prefix}-details-${props.item.id}`}
          >
            <Text style={styles.cardActionText}>Détails</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cardActionButton,
              styles.cardActionButtonRow,
              props.commentsExpanded && styles.cardActionButtonActive,
            ]}
            onPress={props.onToggleComments}
            testID={`${prefix}-comments-${props.item.id}`}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color={props.commentsExpanded ? colors.primary : "#22456F"}
            />
            <Text
              style={[
                styles.cardActionText,
                props.commentsExpanded && styles.cardActionActiveText,
              ]}
            >
              {props.item.commentsCount}
            </Text>
          </TouchableOpacity>

          {props.canToggleDone ? (
            <TouchableOpacity
              style={[
                styles.cardActionButton,
                styles.cardActionButtonRow,
                done && styles.cardActionDoneButton,
              ]}
              onPress={props.onToggleDone}
              testID={`${prefix}-toggle-done-${props.item.id}`}
            >
              {done ? (
                <Ionicons name="checkmark-circle" size={14} color="#0F766E" />
              ) : null}
              <Text
                style={[
                  styles.cardActionText,
                  done && styles.cardActionDoneText,
                ]}
              >
                {done ? "Fait" : "Marquer fait"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {props.canManage ? (
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={props.onToggleControl}
              testID={`${prefix}-control-${props.item.id}`}
            >
              <Text style={styles.cardActionText}>{summaryLabel}</Text>
            </TouchableOpacity>
          ) : null}

          {props.canManage ? (
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={props.onEdit}
              testID={`${prefix}-edit-${props.item.id}`}
            >
              <Text style={styles.cardActionText}>Modifier</Text>
            </TouchableOpacity>
          ) : null}

          {props.canManage ? (
            <TouchableOpacity
              style={[styles.cardActionButton, styles.cardActionDangerButton]}
              onPress={props.onDelete}
              testID={`${prefix}-delete-${props.item.id}`}
            >
              <Text
                style={[styles.cardActionText, styles.cardActionDangerText]}
              >
                Supprimer
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {props.item.attachments.length > 0 ? (
          <Text style={[styles.cardAttachmentCount, { color: tone.text }]}>
            {props.item.attachments.length} PJ
          </Text>
        ) : null}

        {props.inlineLoading &&
        (props.commentsExpanded || props.controlExpanded) ? (
          <View style={styles.inlinePanelLoading}>
            <LoadingBlock label="Chargement..." />
          </View>
        ) : null}

        {props.commentsExpanded ? (
          <View
            style={styles.inlinePanel}
            testID={`${prefix}-comments-panel-${props.item.id}`}
          >
            {props.inlineDetail?.comments.length ? (
              props.inlineDetail.comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>
                    {comment.authorDisplayName}
                  </Text>
                  <Text style={styles.commentBody}>{comment.body}</Text>
                  <Text style={styles.commentMeta}>
                    {formatHomeworkDateTime(comment.createdAt)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>
                Aucun commentaire pour le moment.
              </Text>
            )}
            <View style={styles.commentComposer}>
              <TextInput
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Ajouter un commentaire"
                placeholderTextColor={colors.textSecondary}
                style={styles.commentInput}
                multiline
                testID={`${prefix}-inline-comment-input-${props.item.id}`}
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmit,
                  isSubmittingComment && { opacity: 0.6 },
                ]}
                onPress={() => void submitInlineComment()}
                disabled={isSubmittingComment}
                testID={`${prefix}-inline-comment-submit-${props.item.id}`}
              >
                <Ionicons name="send" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {props.controlExpanded ? (
          <View
            style={styles.inlinePanel}
            testID={`${prefix}-control-panel-${props.item.id}`}
          >
            {doneStudents.length > 0 ? (
              doneStudents.map((status) => (
                <View key={status.studentId} style={styles.studentStatusRow}>
                  <View>
                    <Text style={styles.studentStatusName}>
                      {status.lastName} {status.firstName}
                    </Text>
                    <Text style={styles.studentStatusMeta}>
                      Fait le {formatHomeworkDateTime(status.doneAt!)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.studentStatusPill,
                      styles.studentStatusPillDone,
                    ]}
                  >
                    <Text style={styles.studentStatusPillText}>Fait</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>
                Aucun eleve n'a encore marque ce homework comme fait.
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function HomeworkFormModal(props: {
  visible: boolean;
  onClose: () => void;
  headerSubtitle?: string;
  onSubmit: (payload: UpsertHomeworkPayload) => Promise<void>;
  onUploadAttachment: (file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }) => Promise<HomeworkAttachment>;
  onUploadInlineImage: (file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }) => Promise<{ url: string }>;
  subjectOptions: TeacherSubjectOption[];
  initialValue?: HomeworkRow | null;
  isSubmitting: boolean;
}) {
  const editorRef = useRef<RichEditor>(null);
  const [attachments, setAttachments] = useState<HomeworkAttachment[]>([]);
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HomeworkFormValues>({
    resolver: zodResolver(homeworkFormSchema),
    defaultValues: {
      subjectId: props.subjectOptions[0]?.value ?? "",
      title: "",
      expectedDate: "",
      expectedTime: "",
    },
  });

  const watchedSubjectId = watch("subjectId");

  useEffect(() => {
    if (!props.visible) return;
    const initialExpectedAt = isoToLocalInput(
      props.initialValue?.expectedAt ?? "",
    );
    reset({
      title: props.initialValue?.title ?? "",
      expectedDate: initialExpectedAt.slice(0, 10),
      expectedTime: initialExpectedAt.slice(11, 16),
      subjectId:
        props.initialValue?.subject.id ?? props.subjectOptions[0]?.value ?? "",
    });
    setAttachments(props.initialValue?.attachments ?? []);
    setDescriptionHtml(props.initialValue?.contentHtml ?? "");
    setErrorMessage(null);
  }, [props.initialValue, props.subjectOptions, props.visible, reset]);

  function openTextColorMenu() {
    Alert.alert("Couleur du texte", "Choisissez une couleur", [
      ...TEXT_COLOR_PRESETS.map((color) => ({
        text: color.label,
        onPress: () => editorRef.current?.setForeColor(color.value),
      })),
      { text: "Annuler", style: "cancel" as const },
    ]);
  }

  function applyHeading() {
    editorRef.current?.command(
      "document.execCommand('formatBlock', false, '<h2>'); true;",
    );
  }

  function applyQuote() {
    editorRef.current?.command(
      "document.execCommand('formatBlock', false, '<blockquote>'); true;",
    );
  }

  async function handleAddInlineImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès aux photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;

    setIsInsertingImage(true);
    try {
      const uploaded = await props.onUploadInlineImage({
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `homework_${Date.now()}.jpg`,
      });
      editorRef.current?.insertImage(uploaded.url, HOMEWORK_INLINE_IMAGE_STYLE);
    } catch {
      Alert.alert("Erreur", "Impossible d'insérer l'image.");
    } finally {
      setIsInsertingImage(false);
    }
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
        result.assets.map((asset) =>
          props.onUploadAttachment({
            uri: asset.uri,
            mimeType: asset.mimeType ?? "application/octet-stream",
            fileName: asset.name,
          }),
        ),
      );
      setAttachments((current) => [...current, ...uploaded]);
    } catch {
      setErrorMessage("Impossible d'ajouter cette pièce jointe.");
    }
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  const handleSave = handleSubmit(async (values) => {
    setErrorMessage(null);
    const contentHtml = await editorRef.current?.getContentHtml?.();
    const payload: UpsertHomeworkPayload = {
      title: values.title.trim(),
      subjectId: values.subjectId,
      expectedAt: localInputToIso(
        `${values.expectedDate.trim()}T${values.expectedTime.trim()}`,
      ),
      contentHtml:
        typeof contentHtml === "string" && contentHtml.trim()
          ? contentHtml
          : descriptionHtml || undefined,
      attachments,
    };

    await props.onSubmit(payload);
  });

  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      onRequestClose={props.onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ModuleHeader
            title={
              props.initialValue ? "Modifier homework" : "Nouveau homework"
            }
            subtitle={props.headerSubtitle}
            onBack={props.onClose}
            testID="homework-form-header"
            backTestID="homework-form-close"
            titleTestID="homework-form-header-title"
            subtitleTestID="homework-form-header-subtitle"
            topInset={0}
            backgroundColor={colors.primary}
          />

          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Matière</Text>
            <View style={styles.subjectPillsRow}>
              {props.subjectOptions.map((option) => {
                const active = option.value === watchedSubjectId;
                const tone = subjectVisualTone(option.colorHex ?? undefined);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.subjectPill,
                      {
                        backgroundColor: active ? tone.chip : tone.background,
                        borderColor: tone.border,
                      },
                    ]}
                    onPress={() => setValue("subjectId", option.value)}
                    testID={`homework-form-subject-${option.value}`}
                  >
                    <Text
                      style={[
                        styles.subjectPillText,
                        { color: active ? colors.white : tone.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.subjectId?.message ? (
              <Text style={styles.fieldError}>{errors.subjectId.message}</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Titre</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex. Exercice sur les fractions"
                  style={styles.textInput}
                  placeholderTextColor={colors.textSecondary}
                  testID="homework-form-title"
                />
              )}
            />
            {errors.title?.message ? (
              <Text style={styles.fieldError}>{errors.title.message}</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date attendue</Text>
            <View style={styles.expectedAtRow}>
              <Controller
                control={control}
                name="expectedDate"
                render={({ field: { value, onChange, onBlur } }) => (
                  <DatePickerField
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="Choisir une date"
                    title="Date attendue"
                    hasError={Boolean(errors.expectedDate)}
                    testID="homework-form-expected-date"
                  />
                )}
              />
              <Controller
                control={control}
                name="expectedTime"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TimePickerField
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="Heure"
                    title="Heure attendue"
                    hasError={Boolean(errors.expectedTime)}
                    testID="homework-form-expected-time"
                  />
                )}
              />
            </View>
            {errors.expectedDate?.message ? (
              <Text style={styles.fieldError}>
                {errors.expectedDate.message}
              </Text>
            ) : null}
            {errors.expectedTime?.message ? (
              <Text style={styles.fieldError}>
                {errors.expectedTime.message}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contenu</Text>
            <RichTextToolbar
              editorRef={editorRef}
              onPressAddImage={() => void handleAddInlineImage()}
              onPressColor={openTextColorMenu}
              onPressHeading={applyHeading}
              onPressQuote={applyQuote}
              toolbarTestID="homework-form-toolbar"
            />
            <View style={styles.editorWrap}>
              <RichEditor
                ref={editorRef}
                initialContentHTML={descriptionHtml}
                placeholder={
                  isInsertingImage
                    ? "Insertion de l'image..."
                    : "Consignes, ressources, liens utiles..."
                }
                style={styles.richEditor}
                testID="homework-form-editor"
              />
            </View>
          </View>

          <SectionCard
            title="Pièces jointes"
            subtitle="Images, PDF, Word, Excel et autres documents scolaires"
            action={
              <TouchableOpacity
                onPress={() => void handleAddAttachment()}
                testID="homework-form-add-attachment"
              >
                <Ionicons
                  name="attach-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            }
          >
            {attachments.length === 0 ? (
              <Text style={styles.helperText}>
                Aucune pièce jointe pour le moment.
              </Text>
            ) : (
              attachments.map((attachment, index) => (
                <View
                  key={`${attachment.fileName}-${index}`}
                  style={styles.attachmentRow}
                  testID={`homework-form-attachment-${index}`}
                >
                  <View style={styles.attachmentMetaWrap}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.fileName}
                    </Text>
                    <Text style={styles.attachmentMeta}>
                      {attachment.mimeType ?? "application/octet-stream"}
                      {attachment.sizeLabel ? ` · ${attachment.sizeLabel}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(index)}
                    testID={`homework-form-remove-attachment-${index}`}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.warmAccent}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </SectionCard>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              props.isSubmitting && styles.primaryButtonDisabled,
            ]}
            onPress={() => void handleSave()}
            disabled={props.isSubmitting}
            testID="homework-form-submit"
          >
            <Text style={styles.primaryButtonText}>
              {props.isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ClassHomeworkScreen() {
  const params = useLocalSearchParams<{ classId?: string; childId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const routeChildId = typeof params.childId === "string" ? params.childId : "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { schoolSlug, user } = useAuthStore();
  const { children, activeChildId } = useFamilyStore();
  const {
    items,
    details,
    isLoadingList,
    isLoadingDetail,
    isSubmitting,
    errorMessage,
    loadHomework,
    loadHomeworkDetail,
    createHomework,
    updateHomework,
    deleteHomework,
    addComment,
    setCompletion,
    clearError,
  } = useHomeworkStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const viewType = user ? getViewType(user) : "unknown";
  const canManageAll = viewType === "teacher" || viewType === "school";
  const today = useMemo(() => stripTime(new Date()), []);
  const [tab, setTab] = useState<HomeworkTabKey>("list");
  const [agendaMode, setAgendaMode] = useState<AgendaModeKey>("week");
  const [cursorDate, setCursorDate] = useState(today);
  const [selectedWeekDate, setSelectedWeekDate] = useState(today);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | null>(
    today,
  );
  const [classContext, setClassContext] =
    useState<ClassTimetableContextResponse | null>(null);
  const [myTimetable, setMyTimetable] = useState<MyTimetableResponse | null>(
    null,
  );
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(
    null,
  );
  const [detailVisible, setDetailVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkRow | null>(
    null,
  );
  const [queuedFormTarget, setQueuedFormTarget] = useState<
    HomeworkRow | "create" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeworkRow | null>(null);
  const [controlTargetId, setControlTargetId] = useState<string | null>(null);
  const [listVisibleCount, setListVisibleCount] = useState(
    HOMEWORK_LIST_PAGE_SIZE,
  );
  const [expandedPanels, setExpandedPanels] = useState<
    Record<string, HomeworkInlinePanel | null>
  >({});
  const {
    control: commentControl,
    handleSubmit: handleCommentSubmit,
    reset: resetCommentForm,
    formState: { errors: commentErrors },
  } = useForm<HomeworkCommentFormValues>({
    resolver: zodResolver(homeworkCommentSchema),
    defaultValues: {
      body: "",
    },
  });

  const selectedChild = useMemo(() => {
    const fallbackId = routeChildId || activeChildId || "";
    return (
      children.find((entry) => entry.id === fallbackId) ??
      children.find((entry) => entry.classId === classId) ??
      null
    );
  }, [activeChildId, children, classId, routeChildId]);

  const studentIdForContext =
    viewType === "parent" ? (selectedChild?.id ?? undefined) : undefined;

  const subtitle = useMemo(() => {
    if (canManageAll) {
      return [user?.schoolName, classContext?.class.name]
        .filter(Boolean)
        .join(" · ");
    }
    if (viewType === "parent") {
      return [
        selectedChild && fullStudentName(selectedChild),
        selectedChild?.className,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    if (viewType === "student") {
      return [user?.schoolName, myTimetable?.class.name]
        .filter(Boolean)
        .join(" · ");
    }
    return classContext?.class.name ?? myTimetable?.class.name ?? "";
  }, [
    canManageAll,
    classContext?.class.name,
    myTimetable?.class.name,
    selectedChild,
    user?.schoolName,
    viewType,
  ]);

  const range = useMemo(
    () => buildTimetableRangeForView(agendaMode, cursorDate),
    [cursorDate, agendaMode],
  );

  const teacherSubjectOptions = useMemo(
    () =>
      uniqueSubjectsFromContext({
        classContext,
        userId: user?.id,
        canManageAll: viewType !== "teacher",
      }),
    [classContext, user?.id, viewType],
  );

  const sortedItems = useMemo(() => items, [items]);

  const { showSaturday, showSunday } = useMemo(
    () => getHomeworkWeekendVisibility(sortedItems),
    [sortedItems],
  );

  const weekDays = useMemo(() => buildWeekDays(cursorDate), [cursorDate]);
  const visibleWeekDays = useMemo(
    () =>
      weekDays.filter((entry) => {
        if (entry.weekday <= 5) return true;
        if (entry.weekday === 6) return showSaturday;
        if (entry.weekday === 7) return showSunday;
        return false;
      }),
    [showSaturday, showSunday, weekDays],
  );

  const homeworkByDate = useMemo(() => {
    const map: Record<string, HomeworkRow[]> = {};
    sortedItems.forEach((item) => {
      const key = homeworkDateKey(item.expectedAt);
      map[key] = [...(map[key] ?? []), item];
    });
    return map;
  }, [sortedItems]);

  const countsByDate = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(homeworkByDate).map(([date, groupedItems]) => [
          date,
          groupedItems.length,
        ]),
      ),
    [homeworkByDate],
  );

  const weekItems = homeworkByDate[toIsoDateString(selectedWeekDate)] ?? [];
  const listItems = useMemo(
    () => sortedItems.filter((item) => new Date(item.expectedAt) >= today),
    [sortedItems, today],
  );
  const visibleListItems = useMemo(
    () => listItems.slice(0, listVisibleCount),
    [listItems, listVisibleCount],
  );
  const hasMoreListItems = listVisibleCount < listItems.length;

  const monthCells = useMemo(
    () =>
      buildHomeworkMonthCells(
        cursorDate,
        sortedItems,
        showSaturday,
        showSunday,
      ),
    [cursorDate, showSaturday, showSunday, sortedItems],
  );

  const monthItems = selectedMonthDate
    ? (homeworkByDate[toIsoDateString(selectedMonthDate)] ?? [])
    : [];

  const selectedDetail = selectedHomeworkId
    ? (details[selectedHomeworkId] ?? null)
    : null;
  const controlTargetDetail = controlTargetId
    ? (details[controlTargetId] ?? null)
    : null;
  useEffect(() => {
    resetCommentForm({ body: "" });
  }, [resetCommentForm, selectedHomeworkId]);
  const selectedRow =
    sortedItems.find((item) => item.id === selectedHomeworkId) ?? null;
  const canEditSelected =
    !!selectedRow &&
    !!user &&
    selectedRow.authorUserId === user.id &&
    canManageAll;

  const periodLabel = useMemo(() => {
    if (agendaMode === "week") {
      return sameDate(startOfWeek(cursorDate), startOfWeek(today))
        ? "Cette semaine"
        : formatWeekRangeLabel(cursorDate);
    }
    return cursorDate.getMonth() === today.getMonth() &&
      cursorDate.getFullYear() === today.getFullYear()
      ? "Ce mois"
      : formatMonthLabel(cursorDate);
  }, [cursorDate, today, tab, agendaMode]);

  const refreshContext = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    setIsLoadingContext(true);
    setContextError(null);
    try {
      if (canManageAll) {
        const [loadedClassContext] = await Promise.all([
          timetableApi.getClassContext(schoolSlug, classId),
          notesApi.getTeacherContext(schoolSlug, classId),
        ]);
        setClassContext(loadedClassContext);
        setMyTimetable(null);
      } else {
        const loadedMyTimetable = await timetableApi.getMyTimetable(
          schoolSlug,
          {
            childId: studentIdForContext,
          },
        );
        setMyTimetable(loadedMyTimetable);
        setClassContext(null);
      }
    } catch {
      setContextError("Impossible de charger le contexte homework.");
    } finally {
      setIsLoadingContext(false);
    }
  }, [canManageAll, classId, schoolSlug, studentIdForContext]);

  const refreshHomework = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    if (tab === "list") {
      await loadHomework(schoolSlug, classId, {
        fromDate: toIsoDateString(today),
        studentId: studentIdForContext,
      });
      return;
    }
    await loadHomework(schoolSlug, classId, {
      fromDate: range.fromDate,
      toDate: range.toDate,
      studentId: studentIdForContext,
    });
  }, [
    classId,
    loadHomework,
    tab,
    range.fromDate,
    range.toDate,
    schoolSlug,
    studentIdForContext,
    today,
  ]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  useEffect(() => {
    void refreshHomework().catch(() => {});
  }, [refreshHomework]);

  useEffect(() => {
    if (tab !== "agenda" || agendaMode !== "week") return;
    if (
      visibleWeekDays.some((entry) => sameDate(entry.date, selectedWeekDate))
    ) {
      return;
    }
    setSelectedWeekDate(visibleWeekDays[0]?.date ?? cursorDate);
  }, [cursorDate, selectedWeekDate, tab, agendaMode, visibleWeekDays]);

  useEffect(() => {
    if (tab !== "agenda" || agendaMode !== "month") return;
    if (
      selectedMonthDate &&
      selectedMonthDate.getMonth() === cursorDate.getMonth()
    ) {
      return;
    }
    setSelectedMonthDate(monthCells.find((entry) => entry.date)?.date ?? null);
  }, [cursorDate, monthCells, selectedMonthDate, tab, agendaMode]);

  useEffect(() => {
    if (detailVisible || queuedFormTarget === null) return;
    setEditingHomework(queuedFormTarget === "create" ? null : queuedFormTarget);
    setFormVisible(true);
    setQueuedFormTarget(null);
  }, [detailVisible, queuedFormTarget]);

  useEffect(() => {
    const nextCount = Math.min(HOMEWORK_LIST_PAGE_SIZE, listItems.length);
    setListVisibleCount((current) =>
      current === nextCount ? current : nextCount,
    );
  }, [listItems.length]);

  function moveCursor(direction: -1 | 1) {
    if (agendaMode === "week") {
      const next = addDays(cursorDate, direction * 7);
      setCursorDate(next);
      setSelectedWeekDate(next);
      return;
    }
    const next = addMonths(cursorDate, direction);
    setCursorDate(next);
    setSelectedMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
  }

  function resetToCurrentPeriod() {
    setCursorDate(today);
    setSelectedWeekDate(today);
    setSelectedMonthDate(today);
  }

  async function openDetail(item: HomeworkRow) {
    if (!schoolSlug) return;
    setSelectedHomeworkId(item.id);
    setDetailVisible(true);
    resetCommentForm({ body: "" });
    try {
      await loadHomeworkDetail(
        schoolSlug,
        classId,
        item.id,
        studentIdForContext,
      );
    } catch {
      return;
    }
  }

  async function ensureHomeworkDetail(homeworkId: string) {
    if (!schoolSlug) return null;
    if (details[homeworkId]) {
      return details[homeworkId];
    }
    return loadHomeworkDetail(
      schoolSlug,
      classId,
      homeworkId,
      studentIdForContext,
    );
  }

  function openCreateForm() {
    if (detailVisible) {
      setQueuedFormTarget("create");
      setDetailVisible(false);
      return;
    }
    setEditingHomework(null);
    setFormVisible(true);
  }

  function openEditForm(item: HomeworkRow) {
    if (detailVisible) {
      setQueuedFormTarget(item);
      setDetailVisible(false);
      return;
    }
    setEditingHomework(item);
    setFormVisible(true);
  }

  function togglePanel(item: HomeworkRow, panel: HomeworkInlinePanel) {
    void ensureHomeworkDetail(item.id).catch(() => {});
    setExpandedPanels((current) => ({
      ...current,
      [item.id]: current[item.id] === panel ? null : panel,
    }));
  }

  function openControlModal(item: HomeworkRow) {
    void ensureHomeworkDetail(item.id).catch(() => {});
    setControlTargetId(item.id);
  }

  async function handleSaveHomework(payload: UpsertHomeworkPayload) {
    if (!schoolSlug) return;
    try {
      if (editingHomework) {
        await updateHomework(schoolSlug, classId, editingHomework.id, payload);
        showSuccess({
          title: "Homework mis à jour",
          message: "Les consignes ont bien été enregistrées.",
        });
      } else {
        await createHomework(schoolSlug, classId, payload);
        showSuccess({
          title: "Homework créé",
          message: "Le nouveau homework a été ajouté à l'agenda.",
        });
      }
      setFormVisible(false);
      setEditingHomework(null);
      await refreshHomework();
    } catch (error) {
      showError({
        title: "Enregistrement impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer ce homework.",
      });
    }
  }

  async function handleDeleteHomework() {
    if (!schoolSlug || !deleteTarget) return;
    try {
      await deleteHomework(schoolSlug, classId, deleteTarget.id);
      showSuccess({
        title: "Homework supprimé",
        message: "Le homework a bien été retiré.",
      });
      if (selectedHomeworkId === deleteTarget.id) {
        setDetailVisible(false);
        setSelectedHomeworkId(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      showError({
        title: "Suppression impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer ce homework.",
      });
    }
  }

  async function handleToggleDone(detail: HomeworkDetail) {
    if (!schoolSlug) return;
    try {
      await setCompletion(schoolSlug, classId, detail.id, {
        done: !isHomeworkDone(detail),
        studentId: studentIdForContext,
      });
      showSuccess({
        title: isHomeworkDone(detail) ? "Homework rouvert" : "Homework terminé",
        message: isHomeworkDone(detail)
          ? "Le homework est repassé en non fait."
          : "Le homework est marqué comme fait.",
      });
    } catch (error) {
      showError({
        title: "Mise à jour impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour l'état du homework.",
      });
    }
  }

  async function handleCardToggleDone(item: HomeworkRow) {
    if (!schoolSlug) return;
    const nowDone = isHomeworkDone(item);
    try {
      await setCompletion(schoolSlug, classId, item.id, {
        done: !nowDone,
        studentId: studentIdForContext,
      });
      showSuccess({
        title: nowDone ? "Homework rouvert" : "Homework terminé",
        message: nowDone
          ? "Le homework est repassé en non fait."
          : "Le homework est marqué comme fait.",
      });
      await refreshHomework();
    } catch (error) {
      showError({
        title: "Mise à jour impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour l'état du homework.",
      });
    }
  }

  const handleAddComment = handleCommentSubmit(async (values) => {
    if (!schoolSlug || !selectedHomeworkId) return;
    const payload: HomeworkCommentPayload = {
      body: values.body.trim(),
      studentId: studentIdForContext,
    };
    try {
      await addComment(schoolSlug, classId, selectedHomeworkId, payload);
      resetCommentForm({ body: "" });
      showSuccess({
        title: "Commentaire ajouté",
        message: "Le commentaire a bien été enregistré.",
      });
    } catch (error) {
      showError({
        title: "Commentaire impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter le commentaire.",
      });
    }
  });

  async function openAttachment(attachment: HomeworkAttachment) {
    if (!attachment.fileUrl) return;
    try {
      const supported = await Linking.canOpenURL(attachment.fileUrl);
      if (!supported) {
        throw new Error("UNSUPPORTED_HOMEWORK_ATTACHMENT");
      }
      await Linking.openURL(attachment.fileUrl);
    } catch {
      Alert.alert("Erreur", "Impossible d'ouvrir cette pièce jointe.");
    }
  }

  const screenError = errorMessage ?? contextError;
  const [errorDismissed, setErrorDismissed] = useState(false);
  useEffect(() => {
    if (screenError) setErrorDismissed(false);
  }, [screenError]);
  const visibleTabError = screenError && !errorDismissed ? screenError : null;

  const headerComponent = useMemo(
    () => (
      <>
        <ModuleHeader
          title="Homework"
          subtitle={subtitle}
          onBack={() => router.back()}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          testID="class-homework-header"
          backTestID="class-homework-back"
          titleTestID="class-homework-header-title"
          subtitleTestID="class-homework-header-subtitle"
          rightTestID="class-homework-menu"
          topInset={insets.top}
        />

        {isLoadingContext && !subtitle ? (
          <LoadingBlock label="Chargement du module homework..." />
        ) : (
          <View testID="class-homework-tabs-section">
            <UnderlineTabs
              items={HOMEWORK_TABS.map((entry) => ({
                key: entry.key,
                label: entry.label,
              }))}
              activeKey={tab}
              onSelect={setTab}
              testIDPrefix="class-homework-tab"
            />

            {tab === "agenda" && (
              <View testID="class-homework-agenda-mode-tabs">
                <UnderlineTabs
                  items={[
                    { key: "week" as const, label: "Semaine" },
                    { key: "month" as const, label: "Mois" },
                  ]}
                  activeKey={agendaMode}
                  onSelect={setAgendaMode}
                  testIDPrefix="class-homework-agenda-mode"
                />
              </View>
            )}

            {tab === "agenda" ? (
              <View style={styles.periodNavRow}>
                <TouchableOpacity
                  style={styles.periodNavButton}
                  onPress={() => moveCursor(-1)}
                  testID="class-homework-nav-prev"
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.periodLabelButton}
                  onPress={resetToCurrentPeriod}
                  testID="class-homework-nav-label"
                >
                  <Text style={styles.periodLabelText}>{periodLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.periodNavButton}
                  onPress={() => moveCursor(1)}
                  testID="class-homework-nav-next"
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </>
    ),
    [isLoadingContext, tab, agendaMode, periodLabel, subtitle, insets.top],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      {tab === "list" ? (
        <InfiniteScrollList
          data={visibleListItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HomeworkCard
              item={item}
              onPressDetails={() => void openDetail(item)}
              canManage={canManageAll && item.authorUserId === user?.id}
              canToggleDone={!canManageAll}
              onEdit={() => openEditForm(item)}
              onDelete={() => setDeleteTarget(item)}
              onToggleComments={() => togglePanel(item, "comments")}
              onToggleControl={() => openControlModal(item)}
              onToggleDone={() => void handleCardToggleDone(item)}
              onAddInlineComment={
                schoolSlug
                  ? async (body) => {
                      await addComment(schoolSlug, classId, item.id, {
                        body,
                        studentId: studentIdForContext,
                      });
                      showSuccess({
                        title: "Commentaire ajouté",
                        message: "Le commentaire a bien été enregistré.",
                      });
                    }
                  : undefined
              }
              commentsExpanded={expandedPanels[item.id] === "comments"}
              controlExpanded={false}
              inlineDetail={details[item.id] ?? null}
              inlineLoading={
                isLoadingDetail &&
                !details[item.id] &&
                expandedPanels[item.id] !== null
              }
            />
          )}
          emptyComponent={
            <EmptyState
              icon="checkmark-done-outline"
              title="Aucun homework"
              message="Aucun homework n'est prevu a partir d'aujourd'hui."
            />
          }
          testID="class-homework-list"
          hasMore={hasMoreListItems}
          onLoadMore={() => {
            setListVisibleCount((current) =>
              current >= listItems.length
                ? current
                : Math.min(current + HOMEWORK_LIST_PAGE_SIZE, listItems.length),
            );
          }}
          endOfListLabel="Tous les homeworks a venir sont affiches"
          onRefresh={() => {
            clearError();
            void Promise.all([refreshContext(), refreshHomework()]).catch(
              () => {},
            );
          }}
          refreshing={isLoadingList || isLoadingContext}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 120,
          }}
          ListHeaderComponent={
            <>
              {headerComponent}
              {visibleTabError ? (
                <ErrorBanner
                  message={visibleTabError}
                  onDismiss={() => setErrorDismissed(true)}
                  testID="homework-tab-error"
                />
              ) : null}
            </>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      ) : (
        <ScrollView
          style={styles.root}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 0, paddingBottom: insets.bottom + 120 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingList || isLoadingContext}
              onRefresh={() => {
                clearError();
                void Promise.all([refreshContext(), refreshHomework()]).catch(
                  () => {},
                );
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {headerComponent}

          {visibleTabError ? (
            <ErrorBanner
              message={visibleTabError}
              onDismiss={() => setErrorDismissed(true)}
              testID="homework-tab-error"
            />
          ) : null}

          {agendaMode === "week" ? (
            <View style={styles.weekSection}>
              <WeekHomeworkColumns
                days={visibleWeekDays}
                selectedDate={selectedWeekDate}
                onSelectDate={setSelectedWeekDate}
                countsByDate={countsByDate}
              />
              <SectionCard
                title="Homework du jour sélectionné"
                subtitle={formatHomeworkDayLabel(selectedWeekDate)}
              >
                {weekItems.length === 0 ? (
                  <EmptyState
                    icon="calendar-clear-outline"
                    title="Aucun homework"
                    message="Aucun homework n'est prévu sur ce jour de la semaine."
                  />
                ) : (
                  <View style={styles.cardsColumn}>
                    {weekItems.map((item) => (
                      <HomeworkCard
                        key={item.id}
                        item={item}
                        onPressDetails={() => void openDetail(item)}
                        canManage={
                          canManageAll && item.authorUserId === user?.id
                        }
                        canToggleDone={!canManageAll}
                        onEdit={() => openEditForm(item)}
                        onDelete={() => setDeleteTarget(item)}
                        onToggleComments={() => togglePanel(item, "comments")}
                        onToggleControl={() => openControlModal(item)}
                        onToggleDone={() => void handleCardToggleDone(item)}
                        onAddInlineComment={
                          schoolSlug
                            ? async (body) => {
                                await addComment(schoolSlug, classId, item.id, {
                                  body,
                                  studentId: studentIdForContext,
                                });
                                showSuccess({
                                  title: "Commentaire ajouté",
                                  message:
                                    "Le commentaire a bien été enregistré.",
                                });
                              }
                            : undefined
                        }
                        commentsExpanded={
                          expandedPanels[item.id] === "comments"
                        }
                        controlExpanded={false}
                        inlineDetail={details[item.id] ?? null}
                        inlineLoading={
                          isLoadingDetail &&
                          !details[item.id] &&
                          expandedPanels[item.id] !== null
                        }
                      />
                    ))}
                  </View>
                )}
              </SectionCard>
            </View>
          ) : null}

          {agendaMode === "month" ? (
            <View style={styles.monthSection}>
              <MonthGrid
                cells={monthCells}
                selectedDate={selectedMonthDate}
                onSelectDate={setSelectedMonthDate}
                showSaturday={showSaturday}
                showSunday={showSunday}
                testIDPrefix="class-homework"
              />
              <SectionCard
                title="Agenda du jour sélectionné"
                subtitle={
                  selectedMonthDate
                    ? formatHomeworkDayLabel(selectedMonthDate)
                    : "Aucun jour sélectionné"
                }
              >
                {monthItems.length === 0 ? (
                  <EmptyState
                    icon="calendar-clear-outline"
                    title="Aucun homework"
                    message="Aucun homework n'est prévu pour cette journée."
                  />
                ) : (
                  <View style={styles.cardsColumn}>
                    {monthItems.map((item) => (
                      <HomeworkCard
                        key={item.id}
                        item={item}
                        onPressDetails={() => void openDetail(item)}
                        canManage={
                          canManageAll && item.authorUserId === user?.id
                        }
                        canToggleDone={!canManageAll}
                        onEdit={() => openEditForm(item)}
                        onDelete={() => setDeleteTarget(item)}
                        onToggleComments={() => togglePanel(item, "comments")}
                        onToggleControl={() => openControlModal(item)}
                        onToggleDone={() => void handleCardToggleDone(item)}
                        onAddInlineComment={
                          schoolSlug
                            ? async (body) => {
                                await addComment(schoolSlug, classId, item.id, {
                                  body,
                                  studentId: studentIdForContext,
                                });
                                showSuccess({
                                  title: "Commentaire ajouté",
                                  message:
                                    "Le commentaire a bien été enregistré.",
                                });
                              }
                            : undefined
                        }
                        commentsExpanded={
                          expandedPanels[item.id] === "comments"
                        }
                        controlExpanded={false}
                        inlineDetail={details[item.id] ?? null}
                        inlineLoading={
                          isLoadingDetail &&
                          !details[item.id] &&
                          expandedPanels[item.id] !== null
                        }
                      />
                    ))}
                  </View>
                )}
              </SectionCard>
            </View>
          ) : null}
        </ScrollView>
      )}

      {canManageAll ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openCreateForm}
          testID="class-homework-fab"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <HomeworkFormModal
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditingHomework(null);
        }}
        onSubmit={handleSaveHomework}
        onUploadAttachment={(file) =>
          homeworkApi.uploadAttachment(schoolSlug!, file)
        }
        onUploadInlineImage={(file) =>
          homeworkApi.uploadInlineImage(schoolSlug!, file)
        }
        headerSubtitle={subtitle}
        subjectOptions={teacherSubjectOptions}
        initialValue={editingHomework}
        isSubmitting={isSubmitting}
      />

      <Modal
        visible={!!controlTargetId}
        animationType="slide"
        onRequestClose={() => setControlTargetId(null)}
      >
        <View style={styles.modalRoot}>
          <ScrollView
            style={styles.modalRoot}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <ModuleHeader
              title="Suivi homework"
              subtitle={controlTargetDetail?.title ?? subtitle}
              onBack={() => setControlTargetId(null)}
              testID="homework-control-header"
              backTestID="homework-control-close"
              titleTestID="homework-control-header-title"
              subtitleTestID="homework-control-header-subtitle"
              topInset={0}
            />

            {isLoadingDetail && !controlTargetDetail ? (
              <LoadingBlock label="Chargement du suivi..." />
            ) : controlTargetDetail ? (
              <SectionCard
                title="Eleves ayant deja fait le devoir"
                subtitle={
                  controlTargetDetail.summary
                    ? `${controlTargetDetail.summary.doneStudents}/${controlTargetDetail.summary.totalStudents} faits`
                    : undefined
                }
              >
                {controlTargetDetail.completionStatuses.filter((status) =>
                  Boolean(status.doneAt),
                ).length > 0 ? (
                  controlTargetDetail.completionStatuses
                    .filter((status) => Boolean(status.doneAt))
                    .map((status) => (
                      <View
                        key={status.studentId}
                        style={styles.studentStatusRow}
                      >
                        <View>
                          <Text style={styles.studentStatusName}>
                            {status.lastName} {status.firstName}
                          </Text>
                          <Text style={styles.studentStatusMeta}>
                            Fait le {formatHomeworkDateTime(status.doneAt!)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.studentStatusPill,
                            styles.studentStatusPillDone,
                          ]}
                        >
                          <Text style={styles.studentStatusPillText}>Fait</Text>
                        </View>
                      </View>
                    ))
                ) : (
                  <Text style={styles.helperText}>
                    Aucun eleve n'a encore marque ce homework comme fait.
                  </Text>
                )}
              </SectionCard>
            ) : (
              <EmptyState
                icon="people-outline"
                title="Suivi indisponible"
                message="Impossible de charger la liste des eleves pour ce homework."
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={detailVisible}
        animationType="slide"
        onRequestClose={() => setDetailVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalRoot}
        >
          <ScrollView
            style={styles.modalRoot}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ModuleHeader
              title="Détail homework"
              subtitle={
                selectedDetail?.subject.name ??
                selectedRow?.subject.name ??
                subtitle
              }
              onBack={() => setDetailVisible(false)}
              testID="homework-detail-header"
              backTestID="homework-detail-close"
              titleTestID="homework-detail-header-title"
              subtitleTestID="homework-detail-header-subtitle"
              topInset={insets.top}
              backgroundColor={colors.primary}
            />

            {isLoadingDetail && !selectedDetail ? (
              <LoadingBlock label="Chargement du détail..." />
            ) : selectedDetail ? (
              <>
                <View style={styles.detailHero}>
                  <Text style={styles.detailSubject}>
                    {selectedDetail.subject.name}
                  </Text>
                  <Text style={styles.detailTitle}>{selectedDetail.title}</Text>
                  <Text style={styles.detailMeta}>
                    À rendre le{" "}
                    {formatHomeworkDateTime(selectedDetail.expectedAt)}
                  </Text>
                  <Text style={styles.detailMeta}>
                    Par {selectedDetail.authorDisplayName}
                  </Text>
                </View>

                {!canManageAll ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      isHomeworkDone(selectedDetail)
                        ? styles.secondarySuccessButton
                        : null,
                    ]}
                    onPress={() => void handleToggleDone(selectedDetail)}
                    testID="class-homework-toggle-done"
                  >
                    <Text style={styles.primaryButtonText}>
                      {isHomeworkDone(selectedDetail)
                        ? "Marquer comme non fait"
                        : "Marquer comme fait"}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <SectionCard title="Consignes">
                  <Text style={styles.detailBodyText}>
                    {htmlToText(selectedDetail.contentHtml ?? "") ||
                      "Aucune consigne détaillée."}
                  </Text>
                  {extractImageUrls(selectedDetail.contentHtml ?? "").map(
                    (url) => (
                      <TouchableOpacity
                        key={url}
                        onPress={() => void Linking.openURL(url)}
                        style={styles.inlineImageLink}
                      >
                        <Ionicons
                          name="image-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.inlineImageLinkText}>
                          Ouvrir l'image insérée
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </SectionCard>

                <SectionCard title="Pièces jointes">
                  {selectedDetail.attachments.length === 0 ? (
                    <Text style={styles.helperText}>Aucune pièce jointe.</Text>
                  ) : (
                    selectedDetail.attachments.map((attachment, index) => (
                      <TouchableOpacity
                        key={`${attachment.fileName}-${index}`}
                        style={styles.attachmentRow}
                        onPress={() => void openAttachment(attachment)}
                        testID={`class-homework-detail-attachment-${index}`}
                      >
                        <View style={styles.attachmentMetaWrap}>
                          <Text style={styles.attachmentName}>
                            {attachment.fileName}
                          </Text>
                          <Text style={styles.attachmentMeta}>
                            {attachment.mimeType ?? "application/octet-stream"}
                            {attachment.sizeLabel
                              ? ` · ${attachment.sizeLabel}`
                              : ""}
                          </Text>
                        </View>
                        <Ionicons
                          name="download-outline"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    ))
                  )}
                </SectionCard>

                {canManageAll ? (
                  <SectionCard
                    title="Suivi des élèves"
                    subtitle={
                      selectedDetail.summary
                        ? `${selectedDetail.summary.doneStudents}/${selectedDetail.summary.totalStudents} homework faits`
                        : undefined
                    }
                  >
                    {selectedDetail.completionStatuses.length === 0 ? (
                      <Text style={styles.helperText}>
                        Aucune donnée élève pour ce homework.
                      </Text>
                    ) : (
                      selectedDetail.completionStatuses.map((status) => {
                        const done = Boolean(status.doneAt);
                        return (
                          <View
                            key={status.studentId}
                            style={styles.studentStatusRow}
                          >
                            <View>
                              <Text style={styles.studentStatusName}>
                                {status.lastName} {status.firstName}
                              </Text>
                              <Text style={styles.studentStatusMeta}>
                                {done
                                  ? `Fait le ${formatHomeworkDateTime(status.doneAt!)}`
                                  : "Non fait"}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.studentStatusPill,
                                done
                                  ? styles.studentStatusPillDone
                                  : styles.studentStatusPillPending,
                              ]}
                            >
                              <Text style={styles.studentStatusPillText}>
                                {done ? "Fait" : "En attente"}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </SectionCard>
                ) : null}

                <SectionCard title="Commentaires">
                  {selectedDetail.comments.length === 0 ? (
                    <Text style={styles.helperText}>
                      Aucun commentaire pour le moment.
                    </Text>
                  ) : (
                    selectedDetail.comments.map((comment) => (
                      <View key={comment.id} style={styles.commentCard}>
                        <Text style={styles.commentAuthor}>
                          {comment.authorDisplayName}
                        </Text>
                        <Text style={styles.commentBody}>{comment.body}</Text>
                        <Text style={styles.commentMeta}>
                          {formatHomeworkDateTime(comment.createdAt)}
                        </Text>
                      </View>
                    ))
                  )}

                  <View style={styles.commentComposer}>
                    <Controller
                      control={commentControl}
                      name="body"
                      render={({ field: { value, onChange } }) => (
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          placeholder="Ajouter un commentaire"
                          placeholderTextColor={colors.textSecondary}
                          style={styles.commentInput}
                          multiline
                          testID="class-homework-comment-input"
                        />
                      )}
                    />
                    <TouchableOpacity
                      style={styles.commentSubmit}
                      onPress={() => void handleAddComment()}
                      testID="class-homework-comment-submit"
                    >
                      <Ionicons name="send" size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                  {commentErrors.body?.message ? (
                    <Text style={styles.fieldError}>
                      {commentErrors.body.message}
                    </Text>
                  ) : null}
                </SectionCard>

                {canEditSelected ? (
                  <View style={styles.detailActionsRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => selectedRow && openEditForm(selectedRow)}
                      testID="class-homework-detail-edit"
                    >
                      <Text style={styles.secondaryButtonText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dangerButton}
                      onPress={() =>
                        selectedRow && setDeleteTarget(selectedRow)
                      }
                      testID="class-homework-detail-delete"
                    >
                      <Text style={styles.dangerButtonText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="Homework introuvable"
                message="Impossible d'afficher le détail demandé."
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Supprimer ce homework ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteHomework()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, gap: 14 },
  periodNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  periodNavButton: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  periodLabelButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  periodLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#163158",
  },
  daySection: {
    minHeight: 300,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "#4C6284",
    textTransform: "uppercase",
  },
  weekSection: { gap: 12 },
  monthSection: { gap: 12 },
  weekColumns: {
    flexDirection: "row",
    gap: 8,
  },
  weekDayCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: "#FBFDFF",
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  weekDayCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekDayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#53709A",
  },
  weekDayLabelActive: {
    color: colors.white,
  },
  weekDayNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3F67",
  },
  weekDayNumberActive: {
    color: colors.white,
  },
  weekDayBadge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#EAF3FF",
  },
  weekDayBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  weekDayBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  weekDayBadgeTextActive: {
    color: colors.white,
  },
  cardsColumn: {
    gap: 10,
  },
  cardShell: {
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  cardTapArea: {
    padding: 14,
    gap: 12,
  },
  cardDone: {
    opacity: 0.92,
  },
  cardHeaderSection: {
    gap: 6,
  },
  cardHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardSubjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  cardSubject: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardAuthorInline: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    flexShrink: 1,
    marginLeft: 8,
  },
  cardMetaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardBodySection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(34,69,111,0.12)",
    paddingTop: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  donePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "#0F766E",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  donePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  cardActionsWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  cardPrimaryActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardActionButton: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C9D8EA",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#22456F",
  },
  cardActionButtonRow: {
    flexDirection: "row",
    gap: 4,
  },
  cardActionButtonActive: {
    backgroundColor: "#EAF3FF",
    borderColor: colors.primary,
  },
  cardActionActiveText: {
    color: colors.primary,
  },
  cardActionDangerButton: {
    borderColor: "#F4C7C7",
    backgroundColor: "#FFF5F5",
  },
  cardActionDangerText: {
    color: "#B91C1C",
  },
  cardActionDoneButton: {
    borderColor: "#0F766E",
    backgroundColor: "#DCF3EE",
  },
  cardActionDoneText: {
    color: "#0F766E",
  },
  cardAttachmentCount: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: "auto",
  },
  inlinePanelLoading: {
    borderRadius: 12,
    overflow: "hidden",
  },
  inlinePanel: {
    borderTopWidth: 1,
    borderTopColor: "rgba(34,69,111,0.12)",
    paddingTop: 10,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  formHeroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: "#FBFDFF",
    padding: 16,
    gap: 6,
  },
  formHeroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.primary,
  },
  formHeroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  formHeroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  fieldError: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
  },
  expectedAtRow: {
    gap: 10,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  subjectPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  editorWrap: {
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  richEditor: {
    flex: 1,
    minHeight: 220,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
  },
  attachmentMetaWrap: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  attachmentMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  secondarySuccessButton: {
    backgroundColor: "#0F766E",
  },
  detailHero: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: "#FBFDFF",
    padding: 16,
    gap: 6,
  },
  detailSubject: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.primary,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  detailMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailBodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  inlineImageLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  inlineImageLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  studentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
  },
  studentStatusName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  studentStatusMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  studentStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  studentStatusPillDone: {
    backgroundColor: "#0F766E",
  },
  studentStatusPillPending: {
    backgroundColor: "#B45309",
  },
  studentStatusPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
  },
  commentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  commentBody: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  commentMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  commentSubmit: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  detailActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
  dangerButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#B91C1C",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
});
