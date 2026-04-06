import React, { useMemo, useRef, useState } from "react";
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
import { colors } from "../../theme";
import { RichTextToolbar } from "../editor/RichTextToolbar";
import type {
  CreateFeedPayload,
  FeedAudienceScope,
  FeedPostType,
  FeedViewerRole,
} from "../../types/feed.types";
import { isStaffRole } from "./feed.helpers";

type DraftAttachment = {
  id: string;
  fileName: string;
  sizeLabel: string;
};

type Props = {
  viewerRole: FeedViewerRole;
  onSubmit: (payload: CreateFeedPayload) => Promise<void>;
  onUploadInlineImage: (file: {
    uri: string;
    name: string;
    mimeType: string;
  }) => Promise<{ url: string }>;
  onCancel?: () => void;
};

const COLOR_PRESETS = [
  { label: "Bleu profond", value: "#0C5FA8" },
  { label: "Vert école", value: "#217346" },
  { label: "Rouge alerte", value: "#B42318" },
  { label: "Noir", value: "#1B1F23" },
] as const;

function formatFileSize(bytes: number) {
  if (!bytes || bytes < 1024) return `${bytes || 0} o`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getAudienceOptions(role: FeedViewerRole) {
  if (role === "PARENT") {
    return [{ scope: "PARENTS_ONLY" as const, label: "Parents uniquement" }];
  }
  if (role === "STUDENT") {
    return [{ scope: "CLASS" as const, label: "Ma classe" }];
  }
  if (isStaffRole(role)) {
    return [
      { scope: "SCHOOL_ALL" as const, label: "Toute l'école" },
      { scope: "PARENTS_STUDENTS" as const, label: "Parents & élèves" },
      { scope: "PARENTS_ONLY" as const, label: "Parents uniquement" },
      { scope: "STAFF_ONLY" as const, label: "Équipe interne" },
    ];
  }
  return [{ scope: "SCHOOL_ALL" as const, label: "Toute l'école" }];
}

function buildFormatBlockCommand(tag: "h2" | "blockquote"): string {
  return `document.execCommand('formatBlock', false, '<${tag}>'); true;`;
}

function hasTextContent(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s|&nbsp;/g, "").length > 0;
}

export function FeedComposerCard({
  viewerRole,
  onSubmit,
  onUploadInlineImage,
  onCancel,
}: Props) {
  const editorRef = useRef<RichEditor>(null);
  const audienceOptions = useMemo(
    () => getAudienceOptions(viewerRole),
    [viewerRole],
  );
  const [type, setType] = useState<FeedPostType>("POST");
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [featuredDays, setFeaturedDays] = useState("0");
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [selectedAudienceScope, setSelectedAudienceScope] =
    useState<FeedAudienceScope>(audienceOptions[0]?.scope ?? "SCHOOL_ALL");
  const [submitting, setSubmitting] = useState(false);

  function openTextColorMenu() {
    Alert.alert(
      "Couleur du texte",
      "Choisissez une couleur",
      [
        ...COLOR_PRESETS.map((preset) => ({
          text: preset.label,
          onPress: () => editorRef.current?.setForeColor(preset.value),
        })),
        { text: "Annuler", style: "cancel" as const },
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
      Alert.alert("Permission refusée", "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.85,
      exif: false,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
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
        "Image non ajoutée",
        error instanceof Error ? error.message : "Impossible d'ajouter l'image.",
      );
    }
  }

  async function addAttachment() {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ["application/*", "image/*", "text/*"],
    });

    if (result.canceled) {
      return;
    }

    setAttachments((current) => {
      const next = [...current];
      result.assets.forEach((asset) => {
        const key = `${asset.name}:${asset.size ?? 0}`;
        if (next.some((entry) => `${entry.fileName}:${entry.sizeLabel}` === key)) {
          return;
        }
        next.push({
          id: `${asset.name}-${Date.now()}-${next.length}`,
          fileName: asset.name,
          sizeLabel: formatFileSize(asset.size ?? 0),
        });
      });
      return next;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((entry) => entry.id !== id));
  }

  function canSubmit() {
    if (!title.trim()) {
      return false;
    }

    if (type === "POLL") {
      return (
        pollQuestion.trim().length > 0 &&
        pollOptions.map((option) => option.trim()).filter(Boolean).length >= 2
      );
    }

    return true;
  }

  async function handleSubmit() {
    if (!canSubmit()) {
      return;
    }

    const resolvedBodyHtml = await resolveEditorHtml();
    const resolvedHasBody = hasTextContent(resolvedBodyHtml);

    if (!resolvedHasBody) {
      Alert.alert(
        "Contenu manquant",
        "Ajoutez du contenu avant de publier cette actualité.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        bodyHtml: resolvedBodyHtml,
        audienceScope: selectedAudienceScope,
        audienceLabel:
          audienceOptions.find((option) => option.scope === selectedAudienceScope)
            ?.label ?? "Toute l'école",
        featuredDays: Number(featuredDays) > 0 ? Number(featuredDays) : undefined,
        pollQuestion: type === "POLL" ? pollQuestion.trim() : undefined,
        pollOptions:
          type === "POLL"
            ? pollOptions.map((option) => option.trim()).filter(Boolean)
            : undefined,
        attachments: attachments.map((attachment) => ({
          fileName: attachment.fileName,
          sizeLabel: attachment.sizeLabel,
        })),
      });

      setType("POST");
      setTitle("");
      setBodyHtml("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setFeaturedDays("0");
      setAttachments([]);
      onCancel?.();
    } catch {
      // FeedScreen handles user-facing failure feedback via centered toast.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card} testID="feed-composer-card">
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>Publication</Text>
          <Text style={styles.heading}>Partager une actualité</Text>
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
              {value === "POST" ? "Post" : "Sondage"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Titre de la publication"
        placeholderTextColor={colors.textSecondary}
        testID="feed-composer-title"
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
          placeholder="Rédigez le contenu de l'actualité…"
          editorStyle={{
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            placeholderColor: colors.textSecondary,
            contentCSSText:
              "font-size: 15px; line-height: 1.6; color: #1F2933; padding: 12px 0;",
          }}
          onChange={(html) => {
            setBodyHtml(html);
          }}
          testID="feed-rich-editor"
        />
      </View>

      {type === "POLL" ? (
        <View style={styles.pollCard}>
          <TextInput
            style={styles.titleInput}
            value={pollQuestion}
            onChangeText={setPollQuestion}
            placeholder="Question du sondage"
            placeholderTextColor={colors.textSecondary}
            testID="feed-composer-poll-question"
          />
          {pollOptions.map((option, index) => (
            <TextInput
              key={`poll-option-${index + 1}`}
              style={styles.titleInput}
              value={option}
              onChangeText={(value) =>
                setPollOptions((current) =>
                  current.map((entry, currentIndex) =>
                    currentIndex === index ? value : entry,
                  ),
                )
              }
              placeholder={`Option ${index + 1}`}
              placeholderTextColor={colors.textSecondary}
              testID={`feed-composer-poll-option-${index + 1}`}
            />
          ))}
          {pollOptions.length < 5 ? (
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() =>
                setPollOptions((current) => [...current, ""])
              }
              testID="feed-composer-add-poll-option"
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.secondaryActionText}>Ajouter une option</Text>
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
              selectedAudienceScope === option.scope && styles.audienceChipActive,
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
            { label: "Standard", value: "0" },
            { label: "3 j", value: "3" },
            { label: "7 j", value: "7" },
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
                  featuredDays === option.value && styles.audienceChipTextActive,
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
          <Text style={styles.attachmentsHeading}>Pièces jointes</Text>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => {
              void addAttachment();
            }}
            testID="feed-add-attachment"
          >
            <Ionicons name="attach-outline" size={16} color={colors.primary} />
            <Text style={styles.secondaryActionText}>Joindre</Text>
          </TouchableOpacity>
        </View>

        {attachments.length === 0 ? (
          <Text style={styles.attachmentsEmpty}>
            Aucune pièce jointe pour cette publication.
          </Text>
        ) : (
          attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentRow}>
              <View style={styles.attachmentMeta}>
                <Text style={styles.attachmentName}>{attachment.fileName}</Text>
                <Text style={styles.attachmentSize}>{attachment.sizeLabel}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeAttachment(attachment.id)}
                testID={`feed-remove-attachment-${attachment.id}`}
              >
                <Ionicons name="close-circle" size={18} color={colors.notification} />
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
            <Text style={styles.bottomSecondaryText}>Annuler</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[
            styles.bottomPrimary,
            !canSubmit() && styles.bottomPrimaryDisabled,
          ]}
          disabled={!canSubmit() || submitting}
          onPress={() => {
            void handleSubmit();
          }}
          testID="feed-composer-submit"
        >
          <Ionicons name="send-outline" size={16} color={colors.white} />
          <Text style={styles.bottomPrimaryText}>
            {submitting
              ? "Publication…"
              : type === "POLL"
                ? "Publier le sondage"
                : "Publier"}
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
