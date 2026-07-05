import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import {
  translate,
  useTranslation,
  type TranslateFn,
} from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { useHomeworkStore } from "../../store/homework.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { notesApi } from "../../api/notes.api";
import { timetableApi } from "../../api/timetable.api";
import { homeworkApi } from "../../api/homework.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { getViewType } from "../navigation/nav-config";
import {
  RichEditorField,
  type RichEditorFieldRef,
} from "../editor/RichEditorField";
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
  homeworkAuthorInitials,
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
import { moduleBack } from "../../utils/moduleBack";

type TeacherSubjectOption = {
  value: string;
  label: string;
  colorHex?: string | null;
};

type HomeworkInlinePanel = "comments" | "control";

type HomeworkTabKey = "list" | "agenda" | "forms";
type HomeworkListLikeTab = "list" | "agenda";
type AgendaModeKey = "week" | "month";

type HomeworkFormContext = {
  type: "create" | "edit";
  originTab: HomeworkListLikeTab;
  item: HomeworkRow | null;
};

const HOMEWORK_LIST_PAGE_SIZE = 10;

function buildHomeworkTabs(t: TranslateFn) {
  return [
    {
      key: "list" as const,
      label: t("homework.tabs.list"),
      testID: "class-homework-tab-list",
    },
    {
      key: "agenda" as const,
      label: t("homework.tabs.agenda"),
      testID: "class-homework-tab-agenda",
    },
  ];
}

function buildHomeworkFormSchema(t: TranslateFn) {
  return z.object({
    subjectId: z
      .string()
      .trim()
      .min(1, t("homework.form.validation.subjectRequired")),
    title: z
      .string()
      .trim()
      .min(1, t("homework.form.validation.titleRequired")),
    expectedDate: z
      .string()
      .trim()
      .min(1, t("homework.form.validation.dateRequired")),
    expectedTime: z
      .string()
      .trim()
      .min(1, t("homework.form.validation.timeRequired")),
  });
}

type HomeworkFormValues = z.infer<ReturnType<typeof buildHomeworkFormSchema>>;

function buildHomeworkCommentSchema(t: TranslateFn) {
  return z.object({
    body: z
      .string()
      .trim()
      .min(1, t("homework.form.validation.commentRequired")),
  });
}

type HomeworkCommentFormValues = z.infer<
  ReturnType<typeof buildHomeworkCommentSchema>
>;

function buildTextColorPresets(t: TranslateFn) {
  return [
    { label: t("homework.colors.black"), value: "#111827" },
    { label: t("homework.colors.blue"), value: colors.primary },
    { label: t("homework.colors.green"), value: "#0F766E" },
    { label: t("homework.colors.red"), value: "#B91C1C" },
  ] as const;
}

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
  const { t } = useTranslation();
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
            <Text
              style={[styles.cardSubject, { color: tone.text }]}
              numberOfLines={1}
            >
              {props.item.subject.name}
            </Text>
            <Text style={styles.cardMetaLabel} numberOfLines={1}>
              {formatHomeworkShortDate(props.item.expectedAt)}
            </Text>
            <View
              style={[styles.cardAuthorBadge, { borderColor: tone.border }]}
              testID={`${prefix}-author-${props.item.id}`}
            >
              <Text style={[styles.cardAuthorBadgeText, { color: tone.text }]}>
                {homeworkAuthorInitials(props.item.authorDisplayName)}
              </Text>
            </View>
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
              </View>
            ) : null}
          </View>
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
            <Text style={styles.cardActionText}>
              {t("homework.card.details")}
            </Text>
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
                {done ? t("homework.status.done") : t("homework.card.markDone")}
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
              <Text style={styles.cardActionText}>
                {t("homework.card.edit")}
              </Text>
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
                {t("homework.card.delete")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {props.inlineLoading &&
        (props.commentsExpanded || props.controlExpanded) ? (
          <View style={styles.inlinePanelLoading}>
            <LoadingBlock label={t("homework.common.loading")} />
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
                {t("homework.comment.empty")}
              </Text>
            )}
            <View style={styles.commentComposer}>
              <TextInput
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder={t("homework.comment.placeholder")}
                placeholderTextColor={colors.textSecondary}
                style={styles.commentInput}
                multiline
                testID={`${prefix}-inline-comment-input-${props.item.id}`}
              />
              <TouchableOpacity
                style={styles.commentCloseButton}
                onPress={props.onToggleComments}
                accessibilityLabel={t("homework.comment.close")}
                testID={`${prefix}-inline-comment-close-${props.item.id}`}
              >
                <Ionicons name="close" size={16} color="#22456F" />
              </TouchableOpacity>
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
                      {t("homework.card.doneOnPrefix")}
                      {formatHomeworkDateTime(status.doneAt!)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.studentStatusPill,
                      styles.studentStatusPillDone,
                    ]}
                  >
                    <Text style={styles.studentStatusPillText}>
                      {t("homework.status.done")}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>
                {t("homework.control.noStudentDone")}
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function HomeworkFormHero(props: {
  mode: "create" | "edit";
  item: HomeworkRow | null;
  t: TranslateFn;
}) {
  const isEdit = props.mode === "edit";
  const title = isEdit
    ? (props.item?.title ?? props.t("homework.form.editTitle"))
    : props.t("homework.form.createHeroTitle");
  const subtitle = isEdit
    ? (props.item?.subject.name ?? undefined)
    : props.t("homework.form.createHeroSubtitle");

  return (
    <FormHero
      icon={isEdit ? "create-outline" : "add-circle-outline"}
      title={title}
      subtitle={subtitle}
      palette="teal"
      testID="homework-form-hero"
    />
  );
}

function HomeworkFormContent(props: {
  formContext: HomeworkFormContext;
  onSubmit: (payload: UpsertHomeworkPayload) => Promise<void>;
  onCancel: () => void;
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
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const editorFieldRef = useRef<RichEditorFieldRef>(null);
  const initialValue = props.formContext.item;
  const [attachments, setAttachments] = useState<HomeworkAttachment[]>(
    initialValue?.attachments ?? [],
  );
  const [descriptionHtml] = useState(initialValue?.contentHtml ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textColorPresets = useMemo(() => buildTextColorPresets(t), [t]);
  const initialExpectedAt = useMemo(
    () => isoToLocalInput(initialValue?.expectedAt ?? ""),
    [initialValue?.expectedAt],
  );
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HomeworkFormValues>({
    resolver: zodResolver(buildHomeworkFormSchema(t)),
    defaultValues: {
      subjectId:
        initialValue?.subject.id ?? props.subjectOptions[0]?.value ?? "",
      title: initialValue?.title ?? "",
      expectedDate: initialExpectedAt.slice(0, 10),
      expectedTime: initialExpectedAt.slice(11, 16),
    },
  });

  const watchedSubjectId = watch("subjectId");

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
      setErrorMessage(t("homework.errors.addAttachment"));
    }
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  const handleSave = handleSubmit(async (values) => {
    setErrorMessage(null);
    try {
      const contentHtml = await editorFieldRef.current?.getContentHtml();
      const payload: UpsertHomeworkPayload = {
        title: values.title.trim(),
        subjectId: values.subjectId,
        expectedAt: localInputToIso(
          `${values.expectedDate.trim()}T${values.expectedTime.trim()}`,
        ),
        contentHtml: contentHtml?.trim() ? contentHtml : undefined,
        attachments,
      };

      await props.onSubmit(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("homework.toast.saveErrorMessage"),
      );
    }
  });

  return (
    <View style={styles.formsTabContent} testID="homework-form-tab">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.formsKeyboardArea}
      >
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HomeworkFormHero
            mode={props.formContext.type}
            item={initialValue}
            t={t}
          />

          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

          <View style={styles.fieldGroup}>
            <View style={styles.subjectFieldInlineRow}>
              <Text style={styles.inlineFieldLabel} numberOfLines={2}>
                {t("homework.form.subjectLabel")}
              </Text>
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
            </View>
            {errors.subjectId?.message ? (
              <Text style={styles.fieldError}>{errors.subjectId.message}</Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("homework.form.titleLabel")}
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder={t("homework.form.titlePlaceholder")}
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
            <View style={styles.expectedAtInlineRow}>
              <Text style={styles.inlineFieldLabel} numberOfLines={2}>
                {t("homework.form.expectedDateLabel")}
              </Text>
              <View style={styles.expectedAtRow}>
                <Controller
                  control={control}
                  name="expectedDate"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <View style={styles.expectedDateField}>
                      <DatePickerField
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={t("homework.form.datePlaceholder")}
                        title={t("homework.form.expectedDateLabel")}
                        hasError={Boolean(errors.expectedDate)}
                        testID="homework-form-expected-date"
                      />
                    </View>
                  )}
                />
                <Controller
                  control={control}
                  name="expectedTime"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <View style={styles.expectedTimeField}>
                      <TimePickerField
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder={t("homework.form.timePlaceholder")}
                        title={t("homework.form.expectedTimeLabel")}
                        hasError={Boolean(errors.expectedTime)}
                        testID="homework-form-expected-time"
                      />
                    </View>
                  )}
                />
              </View>
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
            <Text style={styles.fieldLabel}>
              {t("homework.form.contentLabel")}
            </Text>
            <RichEditorField
              ref={editorFieldRef}
              initialHtml={descriptionHtml}
              placeholder={t("homework.form.contentPlaceholder")}
              insertingPlaceholder={t("homework.form.insertingImage")}
              colorPresets={textColorPresets}
              labels={{
                colorMenuTitle: t("homework.form.colorMenu.title"),
                colorMenuMessage: t("homework.form.colorMenu.message"),
                cancel: t("homework.common.cancel"),
                permissionDeniedTitle: t("homework.form.permission.title"),
                permissionDeniedMessage: t("homework.form.permission.message"),
                imageErrorTitle: t("homework.errors.title"),
                imageErrorFallbackMessage: t("homework.errors.insertImage"),
              }}
              onUploadInlineImage={(file) =>
                props.onUploadInlineImage({
                  uri: file.uri,
                  mimeType: file.mimeType,
                  fileName: file.name,
                })
              }
              minHeight={220}
              toolbarTestID="homework-form-toolbar"
              editorTestID="homework-form-editor"
            />
          </View>

          <SectionCard
            title={t("homework.form.attachmentsTitle")}
            subtitle={t("homework.form.attachmentsSubtitle")}
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
                {t("homework.form.noAttachments")}
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
        </ScrollView>

        <View style={styles.formActionsBar}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={props.onCancel}
            disabled={props.isSubmitting}
            testID="homework-form-cancel"
          >
            <Text style={styles.secondaryButtonText}>
              {t("homework.common.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { flex: 1 },
              props.isSubmitting && styles.primaryButtonDisabled,
            ]}
            onPress={() => void handleSave()}
            disabled={props.isSubmitting}
            testID="homework-form-submit"
          >
            <Text style={styles.primaryButtonText}>
              {props.isSubmitting
                ? t("homework.common.saving")
                : t("homework.common.save")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export function ClassHomeworkScreen({
  showHeader = true,
}: {
  showHeader?: boolean;
} = {}) {
  const { t, locale } = useTranslation();
  const params = useLocalSearchParams<{ classId?: string; childId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const routeChildId = typeof params.childId === "string" ? params.childId : "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [formContext, setFormContext] = useState<HomeworkFormContext | null>(
    null,
  );
  const [queuedFormContext, setQueuedFormContext] =
    useState<HomeworkFormContext | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeworkRow | null>(null);
  const [controlTargetId, setControlTargetId] = useState<string | null>(null);
  const [studentsExpanded, setStudentsExpanded] = useState(false);
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
    resolver: zodResolver(buildHomeworkCommentSchema(t)),
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

  const weekDays = useMemo(
    () => buildWeekDays(cursorDate, t),
    [cursorDate, locale],
  );
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
        ? t("homework.agenda.thisWeek")
        : formatWeekRangeLabel(cursorDate);
    }
    return cursorDate.getMonth() === today.getMonth() &&
      cursorDate.getFullYear() === today.getFullYear()
      ? t("homework.agenda.thisMonth")
      : formatMonthLabel(cursorDate);
  }, [cursorDate, today, tab, agendaMode, t]);

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
      setContextError(translate(locale, "homework.errors.loadContext"));
    } finally {
      setIsLoadingContext(false);
    }
  }, [canManageAll, classId, schoolSlug, studentIdForContext, locale]);

  const refreshHomework = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    if (tab === "list") {
      // On envoie fromDate = hier pour compenser le décalage UTC/heure locale :
      // le serveur interprète fromDate comme minuit UTC, mais un devoir posé
      // pour "aujourd'hui" à minuit local (UTC+1) a un timestamp UTC qui tombe
      // la veille. Le filtre client (`>= today heure locale`) reste le seul juge.
      await loadHomework(schoolSlug, classId, {
        fromDate: toIsoDateString(addDays(today, -1)),
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
    if (detailVisible || queuedFormContext === null) return;
    setFormContext(queuedFormContext);
    setTab("forms");
    setQueuedFormContext(null);
  }, [detailVisible, queuedFormContext]);

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
    setControlTargetId(null);
    setSelectedHomeworkId(item.id);
    setDetailVisible(true);
    setStudentsExpanded(false);
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
    const originTab: HomeworkListLikeTab = tab === "forms" ? "list" : tab;
    const next: HomeworkFormContext = {
      type: "create",
      originTab,
      item: null,
    };
    if (detailVisible) {
      setQueuedFormContext(next);
      setDetailVisible(false);
      return;
    }
    setFormContext(next);
    setTab("forms");
  }

  function openEditForm(item: HomeworkRow) {
    const originTab: HomeworkListLikeTab = tab === "forms" ? "list" : tab;
    const next: HomeworkFormContext = {
      type: "edit",
      originTab,
      item,
    };
    if (detailVisible) {
      setQueuedFormContext(next);
      setDetailVisible(false);
      return;
    }
    setFormContext(next);
    setTab("forms");
  }

  function exitForms() {
    const origin = formContext?.originTab ?? "list";
    setFormContext(null);
    setTab(origin);
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
    setDetailVisible(false);
    setControlTargetId(item.id);
  }

  async function handleSaveHomework(payload: UpsertHomeworkPayload) {
    if (!schoolSlug) return;
    const editingId =
      formContext?.type === "edit" ? formContext.item?.id : undefined;
    try {
      if (editingId) {
        await updateHomework(schoolSlug, classId, editingId, payload);
        showSuccess({
          title: t("homework.toast.updatedTitle"),
          message: t("homework.toast.updatedMessage"),
        });
      } else {
        await createHomework(schoolSlug, classId, payload);
        showSuccess({
          title: t("homework.toast.createdTitle"),
          message: t("homework.toast.createdMessage"),
        });
      }
      await refreshHomework();
      setTimeout(() => {
        exitForms();
      }, 2000);
    } catch (error) {
      showError({
        title: t("homework.toast.saveErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("homework.toast.saveErrorMessage"),
      });
    }
  }

  async function handleDeleteHomework() {
    if (!schoolSlug || !deleteTarget) return;
    try {
      await deleteHomework(schoolSlug, classId, deleteTarget.id);
      showSuccess({
        title: t("homework.toast.deletedTitle"),
        message: t("homework.toast.deletedMessage"),
      });
      if (selectedHomeworkId === deleteTarget.id) {
        setDetailVisible(false);
        setSelectedHomeworkId(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      showError({
        title: t("homework.toast.deleteErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("homework.toast.deleteErrorMessage"),
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
        title: isHomeworkDone(detail)
          ? t("homework.toast.reopenedTitle")
          : t("homework.toast.completedTitle"),
        message: isHomeworkDone(detail)
          ? t("homework.toast.reopenedMessage")
          : t("homework.toast.completedMessage"),
      });
    } catch (error) {
      showError({
        title: t("homework.toast.statusErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("homework.toast.statusErrorMessage"),
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
        title: nowDone
          ? t("homework.toast.reopenedTitle")
          : t("homework.toast.completedTitle"),
        message: nowDone
          ? t("homework.toast.reopenedMessage")
          : t("homework.toast.completedMessage"),
      });
      await refreshHomework();
    } catch (error) {
      showError({
        title: t("homework.toast.statusErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("homework.toast.statusErrorMessage"),
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
        title: t("homework.toast.commentAddedTitle"),
        message: t("homework.toast.commentAddedMessage"),
      });
    } catch (error) {
      showError({
        title: t("homework.toast.commentErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("homework.toast.commentErrorMessage"),
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
      Alert.alert(
        t("homework.errors.title"),
        t("homework.errors.openAttachment"),
      );
    }
  }

  const screenError = errorMessage ?? contextError;
  const [errorDismissed, setErrorDismissed] = useState(false);
  useEffect(() => {
    if (screenError) setErrorDismissed(false);
  }, [screenError]);
  const visibleTabError = screenError && !errorDismissed ? screenError : null;

  const isFormsTab = tab === "forms";
  const moduleHeaderTitle =
    isFormsTab && formContext?.type === "edit"
      ? t("homework.form.editModuleTitle")
      : t("homework.header.title");

  const headerComponent = useMemo(
    () => (
      <>
        {showHeader ? (
          <ModuleHeader
            title={moduleHeaderTitle}
            subtitle={subtitle}
            onBack={() => (isFormsTab ? exitForms() : moduleBack(router))}
            testID="class-homework-header"
            backTestID="class-homework-back"
            titleTestID="class-homework-header-title"
            subtitleTestID="class-homework-header-subtitle"
            topInset={insets.top}
          />
        ) : null}

        {isFormsTab ? null : isLoadingContext && !subtitle ? (
          <LoadingBlock label={t("homework.loading.module")} />
        ) : (
          <View style={styles.tabsSection} testID="class-homework-tabs-section">
            <UnderlineTabs
              items={buildHomeworkTabs(t).map((entry) => ({
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
                    { key: "week" as const, label: t("homework.tabs.week") },
                    { key: "month" as const, label: t("homework.tabs.month") },
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
    [
      showHeader,
      isFormsTab,
      moduleHeaderTitle,
      formContext,
      isLoadingContext,
      tab,
      agendaMode,
      periodLabel,
      subtitle,
      insets.top,
      t,
    ],
  );

  if (controlTargetId) {
    return (
      <View style={styles.root} testID="class-homework-control-screen">
        <ModuleHeader
          title={t("homework.control.title")}
          subtitle={controlTargetDetail?.title ?? subtitle}
          onBack={() => setControlTargetId(null)}
          testID="homework-control-header"
          backTestID="homework-control-close"
          titleTestID="homework-control-header-title"
          subtitleTestID="homework-control-header-subtitle"
          topInset={insets.top}
        />

        <ScrollView
          style={styles.modalRoot}
          contentContainerStyle={[
            styles.modalContent,
            { paddingBottom: insets.bottom + BOTTOM_TAB_BAR_HEIGHT + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <FormHero
            icon="people-outline"
            title={
              controlTargetDetail?.title ??
              subtitle ??
              t("homework.control.title")
            }
            subtitle={
              controlTargetDetail?.summary
                ? `${controlTargetDetail.summary.doneStudents}/${controlTargetDetail.summary.totalStudents} ${t("homework.control.summarySuffix")}`
                : (controlTargetDetail?.subject.name ?? undefined)
            }
            palette="slate"
            testID="homework-control-hero"
          />

          {isLoadingDetail && !controlTargetDetail ? (
            <LoadingBlock label={t("homework.loading.control")} />
          ) : controlTargetDetail ? (
            <SectionCard title={t("homework.control.doneStudentsTitle")}>
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
                          {t("homework.card.doneOnPrefix")}
                          {formatHomeworkDateTime(status.doneAt!)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.studentStatusPill,
                          styles.studentStatusPillDone,
                        ]}
                      >
                        <Text style={styles.studentStatusPillText}>
                          {t("homework.status.done")}
                        </Text>
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={styles.helperText}>
                  {t("homework.control.noStudentDone")}
                </Text>
              )}
            </SectionCard>
          ) : (
            <EmptyState
              icon="people-outline"
              title={t("homework.control.unavailableTitle")}
              message={t("homework.control.unavailableMessage")}
            />
          )}
        </ScrollView>
      </View>
    );
  }

  if (detailVisible) {
    return (
      <View style={styles.root} testID="class-homework-detail-screen">
        <ModuleHeader
          title={t("homework.detail.title")}
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

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalRoot}
        >
          <ScrollView
            style={styles.modalRoot}
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: insets.bottom + BOTTOM_TAB_BAR_HEIGHT + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoadingDetail && !selectedDetail ? (
              <LoadingBlock label={t("homework.loading.detail")} />
            ) : selectedDetail ? (
              <>
                <View style={styles.detailHero}>
                  <Text style={styles.detailSubject}>
                    {selectedDetail.subject.name}
                  </Text>
                  <Text style={styles.detailTitle}>{selectedDetail.title}</Text>
                  <Text style={styles.detailMeta}>
                    {t("homework.detail.duePrefix")}
                    {formatHomeworkDateTime(selectedDetail.expectedAt)}
                  </Text>
                  <Text style={styles.detailMeta}>
                    {t("homework.detail.authorPrefix")}
                    {selectedDetail.authorDisplayName}
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
                        ? t("homework.detail.markUndone")
                        : t("homework.detail.markDone")}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <SectionCard title={t("homework.detail.instructionsTitle")}>
                  <Text style={styles.detailBodyText}>
                    {htmlToText(selectedDetail.contentHtml ?? "") ||
                      t("homework.detail.noInstructions")}
                  </Text>
                  {extractImageUrls(selectedDetail.contentHtml ?? "").length >
                  0 ? (
                    <View
                      style={[
                        styles.inlineImages,
                        htmlToText(selectedDetail.contentHtml ?? "") && {
                          marginTop: 12,
                        },
                      ]}
                    >
                      {extractImageUrls(selectedDetail.contentHtml ?? "").map(
                        (url, idx) => (
                          <Image
                            key={`${url}-${idx}`}
                            source={{ uri: url }}
                            style={styles.inlineImage}
                            resizeMode="contain"
                            testID={`class-homework-detail-inline-image-${idx}`}
                          />
                        ),
                      )}
                    </View>
                  ) : null}
                </SectionCard>

                <SectionCard title={t("homework.detail.attachmentsTitle")}>
                  {selectedDetail.attachments.length === 0 ? (
                    <Text style={styles.helperText}>
                      {t("homework.detail.noAttachments")}
                    </Text>
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
                  <View style={styles.studentsToggleCard}>
                    <TouchableOpacity
                      style={styles.studentsToggleButton}
                      onPress={() => setStudentsExpanded((v) => !v)}
                      accessibilityRole="button"
                      testID="class-homework-detail-students-toggle"
                    >
                      <View style={styles.studentsToggleTextWrap}>
                        <Text style={styles.studentsToggleTitle}>
                          {t("homework.detail.studentsTitle")}
                        </Text>
                        {selectedDetail.summary ? (
                          <Text style={styles.studentsToggleSubtitle}>
                            {`${selectedDetail.summary.doneStudents}/${selectedDetail.summary.totalStudents} ${t("homework.detail.summarySuffix")}`}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name={studentsExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    {studentsExpanded ? (
                      <View style={styles.studentsToggleList}>
                        {selectedDetail.completionStatuses.length === 0 ? (
                          <Text style={styles.helperText}>
                            {t("homework.detail.noStudentData")}
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
                                      ? `${t("homework.card.doneOnPrefix")}${formatHomeworkDateTime(status.doneAt!)}`
                                      : t("homework.status.notDone")}
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
                                    {done
                                      ? t("homework.status.done")
                                      : t("homework.status.pending")}
                                  </Text>
                                </View>
                              </View>
                            );
                          })
                        )}
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <SectionCard title={t("homework.detail.commentsTitle")}>
                  {selectedDetail.comments.length === 0 ? (
                    <Text style={styles.helperText}>
                      {t("homework.comment.empty")}
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
                          placeholder={t("homework.comment.placeholder")}
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
                      <Text style={styles.secondaryButtonText}>
                        {t("homework.card.edit")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dangerButton}
                      onPress={() =>
                        selectedRow && setDeleteTarget(selectedRow)
                      }
                      testID="class-homework-detail-delete"
                    >
                      <Text style={styles.dangerButtonText}>
                        {t("homework.card.delete")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            ) : (
              <EmptyState
                icon="document-text-outline"
                title={t("homework.detail.notFoundTitle")}
                message={t("homework.detail.notFoundMessage")}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <ConfirmDialog
          visible={!!deleteTarget}
          title={t("homework.dialog.deleteTitle")}
          message={t("homework.dialog.deleteMessage")}
          confirmLabel={t("homework.card.delete")}
          cancelLabel={t("homework.common.cancel")}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDeleteHomework()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      {headerComponent}

      {tab === "forms" ? null : visibleTabError ? (
        <ErrorBanner
          message={visibleTabError}
          onDismiss={() => setErrorDismissed(true)}
          testID="homework-tab-error"
        />
      ) : null}

      {tab === "forms" ? null : tab === "list" ? (
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
                        title: t("homework.toast.commentAddedTitle"),
                        message: t("homework.toast.commentAddedMessage"),
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
              title={t("homework.empty.title")}
              message={t("homework.empty.list")}
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
          endOfListLabel={t("homework.empty.endOfList")}
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
          {agendaMode === "week" ? (
            <View style={styles.weekSection}>
              <WeekHomeworkColumns
                days={visibleWeekDays}
                selectedDate={selectedWeekDate}
                onSelectDate={setSelectedWeekDate}
                countsByDate={countsByDate}
              />
              <SectionCard
                title={t("homework.agenda.dayTitle")}
                subtitle={formatHomeworkDayLabel(selectedWeekDate)}
              >
                {weekItems.length === 0 ? (
                  <EmptyState
                    icon="calendar-clear-outline"
                    title={t("homework.empty.title")}
                    message={t("homework.empty.week")}
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
                                  title: t("homework.toast.commentAddedTitle"),
                                  message: t(
                                    "homework.toast.commentAddedMessage",
                                  ),
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
                title={t("homework.agenda.monthDayTitle")}
                subtitle={
                  selectedMonthDate
                    ? formatHomeworkDayLabel(selectedMonthDate)
                    : t("homework.agenda.noDaySelected")
                }
              >
                {monthItems.length === 0 ? (
                  <EmptyState
                    icon="calendar-clear-outline"
                    title={t("homework.empty.title")}
                    message={t("homework.empty.month")}
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
                                  title: t("homework.toast.commentAddedTitle"),
                                  message: t(
                                    "homework.toast.commentAddedMessage",
                                  ),
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

      {tab === "forms" && formContext ? (
        <View style={styles.root}>
          <HomeworkFormContent
            formContext={formContext}
            onSubmit={handleSaveHomework}
            onCancel={exitForms}
            onUploadAttachment={(file) =>
              homeworkApi.uploadAttachment(schoolSlug!, file)
            }
            onUploadInlineImage={(file) =>
              homeworkApi.uploadInlineImage(schoolSlug!, file)
            }
            subjectOptions={teacherSubjectOptions}
            isSubmitting={isSubmitting}
          />
        </View>
      ) : null}

      {canManageAll && tab !== "forms" ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openCreateForm}
          testID="class-homework-fab"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={!!deleteTarget}
        title={t("homework.dialog.deleteTitle")}
        message={t("homework.dialog.deleteMessage")}
        confirmLabel={t("homework.card.delete")}
        cancelLabel={t("homework.common.cancel")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteHomework()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, gap: 14 },
  tabsSection: { marginBottom: 16 },
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
    gap: 8,
  },
  cardSubject: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  cardAuthorBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  cardAuthorBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  cardMetaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 0,
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
    bottom: 20 + BOTTOM_TAB_BAR_HEIGHT,
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
  formsTabContent: {
    flex: 1,
  },
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    padding: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
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
  expectedAtInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inlineFieldLabel: {
    width: 78,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  expectedAtRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  expectedDateField: {
    flex: 1.3,
  },
  expectedTimeField: {
    flex: 1,
  },
  textInput: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  subjectFieldInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subjectPillsRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: "700",
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
    borderRadius: 6,
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
  inlineImages: {
    gap: 10,
  },
  inlineImage: {
    width: "100%",
    minHeight: 160,
    maxHeight: 360,
    borderRadius: 8,
    backgroundColor: colors.warmBorder,
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
  studentsToggleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 10,
    overflow: "hidden",
  },
  studentsToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
  },
  studentsToggleTextWrap: {
    flex: 1,
    gap: 4,
  },
  studentsToggleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  studentsToggleSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  studentsToggleList: {
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
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
  commentCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C9D8EA",
    backgroundColor: colors.white,
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
    borderRadius: 6,
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
    borderRadius: 6,
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
