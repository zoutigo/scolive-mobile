import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { RichEditor } from "react-native-pell-rich-editor";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { RichTextToolbar } from "../editor/RichTextToolbar";
import type {
  CreateFeedPayload,
  FeedAudienceScope,
  FeedPostType,
  FeedViewerRole,
} from "../../types/feed.types";
import { useTranslation } from "../../i18n/useTranslation";
import type { TranslateFn } from "../../i18n/useTranslation";
import { isStaffRole } from "./feed.helpers";

type DraftAttachment = {
  id: string;
  fileName: string;
  sizeLabel: string;
};

type Props = {
  viewerRole: FeedViewerRole;
  initialType?: FeedPostType;
  onSubmit: (payload: CreateFeedPayload) => Promise<void>;
  onUploadInlineImage: (file: {
    uri: string;
    name: string;
    mimeType: string;
  }) => Promise<{ url: string }>;
  onCancel?: () => void;
};

type FormValues = {
  title: string;
  pollQuestion: string;
  pollOptions: Array<{ value: string }>;
};

function getColorPresets(t: TranslateFn) {
  return [
    { label: t("feed.composer.colorDeepBlue"), value: "#0C5FA8" },
    { label: t("feed.composer.colorSchoolGreen"), value: "#217346" },
    { label: t("feed.composer.colorAlertRed"), value: "#B42318" },
    { label: t("feed.composer.colorBlack"), value: "#1B1F23" },
  ] as const;
}

function formatFileSize(bytes: number, t: TranslateFn) {
  if (!bytes || bytes < 1024)
    return `${bytes || 0} ${t("feed.fileSize.bytes")}`;
  if (bytes < 1024 * 1024)
    return `${Math.max(1, Math.round(bytes / 1024))} ${t("feed.fileSize.kb")}`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${t("feed.fileSize.mb")}`;
}

function getAudienceOptions(role: FeedViewerRole, t: TranslateFn) {
  if (role === "PARENT") {
    return [
      { scope: "PARENTS_ONLY" as const, label: t("feed.audience.parentsOnly") },
    ];
  }
  if (role === "STUDENT") {
    return [{ scope: "CLASS" as const, label: t("feed.audience.myClass") }];
  }
  if (isStaffRole(role)) {
    return [
      { scope: "SCHOOL_ALL" as const, label: t("feed.audience.wholeSchool") },
      {
        scope: "PARENTS_STUDENTS" as const,
        label: t("feed.audience.parentsAndStudents"),
      },
      {
        scope: "PARENTS_ONLY" as const,
        label: t("feed.audience.parentsOnly"),
      },
      { scope: "STAFF_ONLY" as const, label: t("feed.audience.staffOnly") },
    ];
  }
  return [
    { scope: "SCHOOL_ALL" as const, label: t("feed.audience.wholeSchool") },
  ];
}

function buildFormatBlockCommand(tag: "h2" | "blockquote"): string {
  return `document.execCommand('formatBlock', false, '<${tag}>'); true;`;
}

function hasTextContent(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s|&nbsp;/g, "").length > 0;
}

export function FeedComposerCard({
  viewerRole,
  initialType = "POST",
  onSubmit,
  onUploadInlineImage,
  onCancel,
}: Props) {
  const { t, locale } = useTranslation();
  const editorRef = useRef<RichEditor>(null);
  const titleRef = useRef<TextInput>(null);
  const pollQuestionRef = useRef<TextInput>(null);

  const audienceOptions = useMemo(
    () => getAudienceOptions(viewerRole, t),
    [viewerRole, locale],
  );

  const [type, setType] = useState<FeedPostType>(initialType);
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [featuredDays, setFeaturedDays] = useState("0");
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [selectedAudienceScope, setSelectedAudienceScope] =
    useState<FeedAudienceScope>(audienceOptions[0]?.scope ?? "SCHOOL_ALL");

  const typeRef = useRef<FeedPostType>(type);
  typeRef.current = type;

  const tRef = useRef<TranslateFn>(t);
  tRef.current = t;

  const schemaRef = useRef(
    z
      .object({
        title: z.string(),
        pollQuestion: z.string(),
        pollOptions: z.array(z.object({ value: z.string() })),
      })
      .superRefine((val, ctx) => {
        if (!val.title.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["title"],
            message: tRef.current("feed.validation.titleRequired"),
          });
        }
        if (typeRef.current !== "POLL") return;
        if (!val.pollQuestion.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pollQuestion"],
            message: tRef.current("feed.validation.pollQuestionRequired"),
          });
        }
        if (val.pollOptions.filter((o) => o.value.trim()).length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pollOptions"],
            message: tRef.current("feed.validation.pollOptionsMin"),
          });
        }
      }),
  );

  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(schemaRef.current),
    defaultValues: {
      title: "",
      pollQuestion: "",
      pollOptions: [{ value: "" }, { value: "" }],
    },
  });

  const { fields, append } = useFieldArray({
    control,
    name: "pollOptions",
  });

  const { isSubmitting, submitCount } = formState;

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  function showFieldErr(fieldState: {
    error?: { message?: string };
    isDirty: boolean;
    isTouched: boolean;
  }): string | null {
    if (
      fieldState.error &&
      (fieldState.isDirty || fieldState.isTouched || submitCount > 0)
    ) {
      return fieldState.error.message ?? null;
    }
    return null;
  }

  function openTextColorMenu() {
    Alert.alert(
      t("feed.composer.colorMenuTitle"),
      t("feed.composer.colorMenuMessage"),
      [
        ...getColorPresets(t).map((preset) => ({
          text: preset.label,
          onPress: () => editorRef.current?.setForeColor(preset.value),
        })),
        { text: t("feed.composer.cancel"), style: "cancel" as const },
      ],
    );
  }

  function applyHeading() {
    editorRef.current?.command(buildFormatBlockCommand("h2"));
  }

  function applyQuote() {
    editorRef.current?.command(buildFormatBlockCommand("blockquote"));
  }

  async function resolveEditorHtml() {
    const editorHtml = await editorRef.current?.getContentHtml?.();
    if (typeof editorHtml === "string" && editorHtml.trim().length > 0) {
      return editorHtml;
    }
    return bodyHtml;
  }

  async function insertInlineImageFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        t("feed.permission.galleryDeniedTitle"),
        t("feed.permission.galleryDeniedMessage"),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.85,
      exif: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const response = await onUploadInlineImage({
        uri: asset.uri,
        name: asset.fileName ?? `feed-inline-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      editorRef.current?.insertImage(response.url);
    } catch (error) {
      Alert.alert(
        t("feed.toast.imageErrorTitle"),
        error instanceof Error
          ? error.message
          : t("feed.toast.imageErrorMessage"),
      );
    }
  }

  async function addAttachment() {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ["application/*", "image/*", "text/*"],
    });
    if (result.canceled) return;
    setAttachments((current) => {
      const next = [...current];
      result.assets.forEach((asset) => {
        const key = `${asset.name}:${asset.size ?? 0}`;
        if (
          next.some((entry) => `${entry.fileName}:${entry.sizeLabel}` === key)
        )
          return;
        next.push({
          id: `${asset.name}-${Date.now()}-${next.length}`,
          fileName: asset.name,
          sizeLabel: formatFileSize(asset.size ?? 0, t),
        });
      });
      return next;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((entry) => entry.id !== id));
  }

  async function onValid(data: FormValues) {
    const resolvedHtml = await resolveEditorHtml();
    if (!hasTextContent(resolvedHtml)) {
      setBodyError(t("feed.validation.bodyRequired"));
      return;
    }
    setBodyError(null);

    await onSubmit({
      type,
      title: data.title.trim(),
      bodyHtml: resolvedHtml,
      audienceScope: selectedAudienceScope,
      audienceLabel:
        audienceOptions.find((o) => o.scope === selectedAudienceScope)?.label ??
        t("feed.audience.wholeSchool"),
      featuredDays: Number(featuredDays) > 0 ? Number(featuredDays) : undefined,
      pollQuestion: type === "POLL" ? data.pollQuestion.trim() : undefined,
      pollOptions:
        type === "POLL"
          ? data.pollOptions.map((o) => o.value.trim()).filter(Boolean)
          : undefined,
      attachments: attachments.map((a) => ({
        fileName: a.fileName,
        sizeLabel: a.sizeLabel,
      })),
    });

    reset();
    setType("POST");
    setBodyHtml("");
    setBodyError(null);
    setFeaturedDays("0");
    setAttachments([]);
    setSelectedAudienceScope(audienceOptions[0]?.scope ?? "SCHOOL_ALL");
    onCancel?.();
  }

  function onInvalid(errors: Partial<Record<keyof FormValues, unknown>>) {
    if (errors.title) {
      titleRef.current?.focus();
      return;
    }
    if (errors.pollQuestion) {
      pollQuestionRef.current?.focus();
    }
  }

  return (
    <View style={styles.card} testID="feed-composer-card">
      {/* ── Header band ── */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Ionicons name="create-outline" size={20} color={colors.white} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardHeaderEyebrow} testID="feed-composer-eyebrow">
            {type === "POLL"
              ? t("feed.composer.modePoll")
              : t("feed.composer.modePost")}
          </Text>
          <Text style={styles.cardHeaderTitle}>
            {t("feed.composer.heading")}
          </Text>
        </View>
        {onCancel ? (
          <TouchableOpacity
            style={styles.cardHeaderClose}
            onPress={onCancel}
            testID="feed-composer-close"
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Body ── */}
      <View style={styles.cardBody}>
        {/* Mode selector */}
        <View style={styles.modeRow}>
          {(["POST", "POLL"] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.modeChip, type === value && styles.modeChipActive]}
              onPress={() => setType(value)}
              testID={`feed-composer-type-${value.toLowerCase()}`}
            >
              <Ionicons
                name={
                  value === "POST" ? "newspaper-outline" : "stats-chart-outline"
                }
                size={14}
                color={type === value ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.modeChipText,
                  type === value && styles.modeChipTextActive,
                ]}
              >
                {value === "POST"
                  ? t("feed.composer.modePost")
                  : t("feed.composer.modePoll")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("feed.composer.titleLabel")}</Text>
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => {
              const err = showFieldErr(fieldState);
              return (
                <>
                  <TextInput
                    ref={titleRef}
                    style={[
                      styles.fieldInput,
                      err ? styles.fieldInputError : null,
                    ]}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={t("feed.composer.titlePlaceholder")}
                    placeholderTextColor={colors.textSecondary}
                    testID="feed-composer-title"
                  />
                  {err ? <Text style={styles.fieldError}>{err}</Text> : null}
                </>
              );
            }}
          />
        </View>

        {/* Content */}
        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>
              {t("feed.composer.contentLabel")}
            </Text>
            <RichTextToolbar
              editorRef={editorRef}
              onPressAddImage={() => {
                void insertInlineImageFromGallery();
              }}
              onPressColor={openTextColorMenu}
              onPressHeading={applyHeading}
              onPressQuote={applyQuote}
            />
          </View>
          <View style={styles.editorArea}>
            <RichEditor
              ref={editorRef}
              style={styles.editor}
              initialHeight={Platform.OS === "ios" ? 180 : 200}
              placeholder={t("feed.composer.editorPlaceholder")}
              editorStyle={{
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                placeholderColor: colors.textSecondary,
                contentCSSText:
                  "font-size: 15px; line-height: 1.6; color: #1F2933; padding: 12px 0;",
              }}
              onChange={(html) => {
                setBodyHtml(html);
                if (bodyError) setBodyError(null);
              }}
              testID="feed-rich-editor"
            />
          </View>
          {bodyError ? (
            <Text style={styles.fieldError} testID="feed-composer-body-error">
              {bodyError}
            </Text>
          ) : null}
        </View>

        {/* Poll fields */}
        {type === "POLL" ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("feed.composer.pollLabel")}
            </Text>
            <Controller
              control={control}
              name="pollQuestion"
              render={({ field, fieldState }) => {
                const err = showFieldErr(fieldState);
                return (
                  <>
                    <TextInput
                      ref={pollQuestionRef}
                      style={[
                        styles.fieldInput,
                        err ? styles.fieldInputError : null,
                      ]}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t("feed.composer.pollQuestionPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      testID="feed-composer-poll-question"
                    />
                    {err ? <Text style={styles.fieldError}>{err}</Text> : null}
                  </>
                );
              }}
            />
            {fields.map((fieldItem, index) => (
              <Controller
                key={fieldItem.id}
                control={control}
                name={`pollOptions.${index}.value`}
                render={({ field }) => (
                  <TextInput
                    style={styles.fieldInput}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={t(
                      "feed.composer.pollOptionPlaceholder",
                    ).replace("{number}", String(index + 1))}
                    placeholderTextColor={colors.textSecondary}
                    testID={`feed-composer-poll-option-${index + 1}`}
                  />
                )}
              />
            ))}
            {fields.length < 5 ? (
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => append({ value: "" })}
                testID="feed-composer-add-poll-option"
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.secondaryActionText}>
                  {t("feed.composer.addOption")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Audience + featured */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            {audienceOptions.map((option) => (
              <TouchableOpacity
                key={option.scope}
                style={[
                  styles.pill,
                  selectedAudienceScope === option.scope && styles.pillActive,
                ]}
                onPress={() => setSelectedAudienceScope(option.scope)}
                testID={`feed-audience-${option.scope.toLowerCase()}`}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedAudienceScope === option.scope &&
                      styles.pillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isStaffRole(viewerRole) ? (
            <View style={styles.metaRow}>
              {[
                { label: t("feed.composer.featuredStandard"), value: "0" },
                { label: t("feed.composer.featured3Days"), value: "3" },
                { label: t("feed.composer.featured7Days"), value: "7" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pill,
                    featuredDays === option.value && styles.pillActive,
                  ]}
                  onPress={() => setFeaturedDays(option.value)}
                  testID={`feed-featured-${option.value}`}
                >
                  <Text
                    style={[
                      styles.pillText,
                      featuredDays === option.value && styles.pillTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* Attachments */}
        <View style={styles.attachmentsSection}>
          <View style={styles.attachmentsHeader}>
            <Ionicons
              name="attach-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.attachmentsSectionLabel}>
              {t("feed.attachments.title")}
            </Text>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => {
                void addAttachment();
              }}
              testID="feed-add-attachment"
            >
              <Text style={styles.secondaryActionText}>
                {t("feed.attachments.add")}
              </Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0
            ? attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentRow}>
                  <Ionicons
                    name="document-outline"
                    size={15}
                    color={colors.primary}
                  />
                  <View style={styles.attachmentMeta}>
                    <Text style={styles.attachmentName}>
                      {attachment.fileName}
                    </Text>
                    <Text style={styles.attachmentSize}>
                      {attachment.sizeLabel}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(attachment.id)}
                    testID={`feed-remove-attachment-${attachment.id}`}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.notification}
                    />
                  </TouchableOpacity>
                </View>
              ))
            : null}
        </View>
      </View>

      {/* ── Footer actions ── */}
      <View style={styles.cardFooter}>
        <View style={styles.footerActions}>
          {onCancel ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnNeutral]}
              onPress={onCancel}
              testID="feed-composer-cancel"
            >
              <Text style={styles.actionBtnNeutralText}>
                {t("feed.composer.cancel")}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnPrimary,
              isSubmitting && styles.actionBtnDisabled,
            ]}
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit(onValid, onInvalid)();
            }}
            testID="feed-composer-submit"
          >
            <Ionicons name="send-outline" size={15} color={colors.white} />
            <Text style={styles.actionBtnPrimaryText}>
              {isSubmitting
                ? t("feed.composer.publishing")
                : type === "POLL"
                  ? t("feed.composer.publishPoll")
                  : t("feed.composer.publish")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFF8EE",
  },
  // ── Header band ──
  cardHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(243,179,77,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardHeaderEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,244,227,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  cardHeaderClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Body ──
  cardBody: {
    backgroundColor: "#FFF9F1",
    padding: 18,
    gap: 18,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  modeChipTextActive: {
    color: colors.white,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5F5A52",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldInput: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#E0D0BA",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
  },
  fieldInputError: {
    borderBottomColor: "#FCA5A5",
  },
  fieldError: {
    fontSize: 12,
    color: colors.notification,
  },
  editorArea: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  editor: {
    minHeight: 190,
    backgroundColor: colors.surface,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  secondaryActionText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  metaSection: {
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#EAD8BF",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E0D0BA",
  },
  pillActive: {
    backgroundColor: "#D7E7F5",
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  pillTextActive: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  attachmentsSection: {
    gap: 10,
  },
  attachmentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attachmentsSectionLabel: {
    flex: 1,
    color: "#5F5A52",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EAD8BF",
  },
  attachmentMeta: {
    flex: 1,
    gap: 1,
  },
  attachmentName: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  attachmentSize: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  // ── Footer ──
  cardFooter: {
    backgroundColor: "#F8ECDC",
    borderTopWidth: 1,
    borderTopColor: "#EAD8BF",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  footerActions: {
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
  actionBtnPrimaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
});
