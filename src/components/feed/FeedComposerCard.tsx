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

  // typeRef lets the stable schema closure read the current type at validation time
  const typeRef = useRef<FeedPostType>(type);
  typeRef.current = type;

  // tRef lets the stable schema closure read the current translation at validation time
  const tRef = useRef<TranslateFn>(t);
  tRef.current = t;

  // Schema initialized once via ref; superRefine reads typeRef.current/tRef.current at each call
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
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>{t("feed.composer.eyebrow")}</Text>
          <Text style={styles.heading}>{t("feed.composer.heading")}</Text>
        </View>
        {onCancel ? (
          <TouchableOpacity onPress={onCancel} testID="feed-composer-close">
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.modeRow}>
        {(["POST", "POLL"] as const).map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.modeChip, type === value && styles.modeChipActive]}
            onPress={() => setType(value)}
            testID={`feed-composer-type-${value.toLowerCase()}`}
          >
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

      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => {
          const err = showFieldErr(fieldState);
          return (
            <>
              <TextInput
                ref={titleRef}
                style={[styles.titleInput, err ? styles.inputError : null]}
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

      <View style={styles.editorShell}>
        <RichTextToolbar
          editorRef={editorRef}
          onPressAddImage={() => {
            void insertInlineImageFromGallery();
          }}
          onPressColor={openTextColorMenu}
          onPressHeading={applyHeading}
          onPressQuote={applyQuote}
        />
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

      {type === "POLL" ? (
        <View style={styles.pollCard}>
          <Controller
            control={control}
            name="pollQuestion"
            render={({ field, fieldState }) => {
              const err = showFieldErr(fieldState);
              return (
                <>
                  <TextInput
                    ref={pollQuestionRef}
                    style={[styles.titleInput, err ? styles.inputError : null]}
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
                  style={styles.titleInput}
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder={t("feed.composer.pollOptionPlaceholder").replace(
                    "{number}",
                    String(index + 1),
                  )}
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

      <View style={styles.audienceRow}>
        {audienceOptions.map((option) => (
          <TouchableOpacity
            key={option.scope}
            style={[
              styles.audienceChip,
              selectedAudienceScope === option.scope &&
                styles.audienceChipActive,
            ]}
            onPress={() => setSelectedAudienceScope(option.scope)}
            testID={`feed-audience-${option.scope.toLowerCase()}`}
          >
            <Text
              style={[
                styles.audienceChipText,
                selectedAudienceScope === option.scope &&
                  styles.audienceChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isStaffRole(viewerRole) ? (
        <View style={styles.featuredRow}>
          {[
            { label: t("feed.composer.featuredStandard"), value: "0" },
            { label: t("feed.composer.featured3Days"), value: "3" },
            { label: t("feed.composer.featured7Days"), value: "7" },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.audienceChip,
                featuredDays === option.value && styles.audienceChipActive,
              ]}
              onPress={() => setFeaturedDays(option.value)}
              testID={`feed-featured-${option.value}`}
            >
              <Text
                style={[
                  styles.audienceChipText,
                  featuredDays === option.value &&
                    styles.audienceChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={styles.attachmentsBox}>
        <View style={styles.attachmentsHeader}>
          <Text style={styles.attachmentsHeading}>
            {t("feed.attachments.title")}
          </Text>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              void addAttachment();
            }}
            testID="feed-add-attachment"
          >
            <Ionicons name="attach-outline" size={16} color={colors.primary} />
            <Text style={styles.secondaryActionText}>
              {t("feed.attachments.add")}
            </Text>
          </TouchableOpacity>
        </View>

        {attachments.length === 0 ? (
          <Text style={styles.attachmentsEmpty}>
            {t("feed.attachments.empty")}
          </Text>
        ) : (
          attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentRow}>
              <View style={styles.attachmentMeta}>
                <Text style={styles.attachmentName}>{attachment.fileName}</Text>
                <Text style={styles.attachmentSize}>
                  {attachment.sizeLabel}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeAttachment(attachment.id)}
                testID={`feed-remove-attachment-${attachment.id}`}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.notification}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomBar}>
        {onCancel ? (
          <TouchableOpacity
            style={styles.bottomSecondary}
            onPress={onCancel}
            testID="feed-composer-cancel"
          >
            <Text style={styles.bottomSecondaryText}>
              {t("feed.composer.cancel")}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[
            styles.bottomPrimary,
            isSubmitting && styles.bottomPrimaryDisabled,
          ]}
          disabled={isSubmitting}
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          testID="feed-composer-submit"
        >
          <Ionicons name="send-outline" size={16} color={colors.white} />
          <Text style={styles.bottomPrimaryText}>
            {isSubmitting
              ? t("feed.composer.publishing")
              : type === "POLL"
                ? t("feed.composer.publishPoll")
                : t("feed.composer.publish")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 18,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.warmAccent,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    color: colors.primary,
    fontWeight: "700",
  },
  modeChipTextActive: {
    color: colors.white,
  },
  titleInput: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: "#FCA5A5",
  },
  fieldError: {
    fontSize: 12,
    color: colors.notification,
    marginTop: -8,
  },
  editorShell: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    padding: 10,
    gap: 10,
  },
  editor: {
    minHeight: 190,
    backgroundColor: colors.surface,
    borderRadius: 14,
  },
  pollCard: {
    gap: 10,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryActionText: {
    color: colors.primary,
    fontWeight: "700",
  },
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featuredRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  audienceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  audienceChipActive: {
    backgroundColor: "#D7E7F5",
    borderColor: colors.primary,
  },
  audienceChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  audienceChipTextActive: {
    color: colors.primaryDark,
  },
  attachmentsBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    padding: 12,
    gap: 10,
  },
  attachmentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  attachmentsHeading: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  attachmentsEmpty: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentMeta: {
    flex: 1,
    gap: 2,
  },
  attachmentName: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  attachmentSize: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  bottomSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
  },
  bottomSecondaryText: {
    color: colors.primary,
    fontWeight: "700",
  },
  bottomPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  bottomPrimaryDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  bottomPrimaryText: {
    color: colors.white,
    fontWeight: "800",
  },
});
