import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { colors } from "../../../src/theme";
import {
  messagingApi,
  MessagingMultipartError,
} from "../../../src/api/messaging.api";
import { useAuthStore } from "../../../src/store/auth.store";
import { useMessagingStore } from "../../../src/store/messaging.store";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { RecipientPickerModal } from "../../../src/components/messaging/RecipientPickerModal";
import type {
  RecipientOption,
  MessagingRecipients,
} from "../../../src/types/messaging.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttachedFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uri: string;
  /** true when backend returned 200, false = unsupported type, null = not tried */
  uploaded: boolean | null;
};

export const TEXT_COLOR_PRESETS = [
  { label: "Bleu profond", value: "#0C5FA8" },
  { label: "Vert soutien", value: "#217346" },
  { label: "Rouge alerte", value: "#B42318" },
  { label: "Noir", value: "#1B1F23" },
] as const;

const ATTACHMENT_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function normalizeMimeTypeAlias(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === "image/jpg") {
    return "image/jpeg";
  }
  return normalized;
}

function extractFileExtension(nameOrUri?: string): string | null {
  if (!nameOrUri) return null;
  const cleaned = nameOrUri.split("?")[0]?.trim();
  if (!cleaned) return null;
  const match = cleaned.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export function resolveAttachmentMimeType(params: {
  name?: string;
  uri?: string;
  mimeType?: string | null;
}): string {
  const providedMimeType = params.mimeType
    ? normalizeMimeTypeAlias(params.mimeType)
    : "";

  if (
    providedMimeType &&
    providedMimeType !== "application/octet-stream" &&
    providedMimeType !== "*/*"
  ) {
    return providedMimeType;
  }

  const extension =
    extractFileExtension(params.name) ?? extractFileExtension(params.uri);

  if (extension && ATTACHMENT_MIME_BY_EXTENSION[extension]) {
    return ATTACHMENT_MIME_BY_EXTENSION[extension];
  }

  return "application/octet-stream";
}

function dedupeAttachedFiles(files: AttachedFile[]): AttachedFile[] {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${file.name}::${file.uri}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildFormatBlockCommand(tag: "h2" | "blockquote"): string {
  return `document.execCommand('formatBlock', false, '<${tag}>'); true;`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenRecipients(data: MessagingRecipients): RecipientOption[] {
  const teachers: RecipientOption[] = data.teachers.map((t) => ({
    value: t.value,
    label: t.label,
    email: t.email,
    subtitle:
      [...(t.subjects ?? []).slice(0, 2), ...(t.classes ?? []).slice(0, 2)]
        .filter(Boolean)
        .join(" · ") || "Enseignant(e)",
  }));
  const staff: RecipientOption[] = data.staffPeople.map((s) => ({
    value: s.value,
    label: s.label,
    email: s.email,
    subtitle: s.functionLabel,
  }));
  const seen = new Set<string>();
  return [...teachers, ...staff].filter((r) => {
    if (seen.has(r.value)) return false;
    seen.add(r.value);
    return true;
  });
}

function hasTextContent(html: string): boolean {
  return html.replace(/<[^>]+>/g, "").replace(/\s|&nbsp;/g, "").length > 0;
}

export function fileIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "document-text-outline";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return "grid-outline";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "easel-outline";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document-outline";
  if (mimeType.startsWith("image/")) return "image-outline";
  return "attach-outline";
}

export function fileIconColor(mimeType: string): string {
  if (mimeType === "application/pdf") return "#DC3545";
  if (mimeType.includes("word")) return "#2B579A";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "#217346";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "#D24726";
  return colors.primary;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getMultipartError(error: unknown): MessagingMultipartError | null {
  if (error instanceof MessagingMultipartError) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    (("statusCode" in error && typeof error.statusCode === "number") ||
      ("responseBody" in error && typeof error.responseBody === "string") ||
      ("name" in error && error.name === "MessagingMultipartError"))
  ) {
    return error as MessagingMultipartError;
  }

  return null;
}

const EMPTY_DRAFT_HTML = "<p>&nbsp;</p>";

function hasDraftContent(params: {
  subject: string;
  hasBody: boolean;
  selectedRecipients: RecipientOption[];
  attachedFiles: AttachedFile[];
}): boolean {
  return (
    params.subject.trim().length > 0 ||
    params.hasBody ||
    params.selectedRecipients.length > 0 ||
    params.attachedFiles.length > 0
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ComposeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const { folder, loadMessages } = useMessagingStore();
  const showFeedbackToast = useSuccessToastStore((state) => state.show);
  const editorRef = useRef<RichEditor>(null);

  const { replyToSubject, replyToSenderId, replyToSenderLabel } =
    useLocalSearchParams<{
      replyToSubject?: string;
      replyToSenderId?: string;
      replyToSenderLabel?: string;
    }>();

  const isReply = !!replyToSubject;

  const [subject, setSubject] = useState(
    replyToSubject
      ? replyToSubject.startsWith("Re:") || replyToSubject.startsWith("RE:")
        ? replyToSubject
        : `Re: ${replyToSubject}`
      : "",
  );
  const [bodyHtml, setBodyHtml] = useState("");
  const [hasBody, setHasBody] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<
    RecipientOption[]
  >(
    replyToSenderId && replyToSenderLabel
      ? [{ value: replyToSenderId, label: replyToSenderLabel }]
      : [],
  );
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ── Load recipients ─────────────────────────────────────────────────────────

  const loadRecipients = useCallback(async () => {
    if (!schoolSlug) return;
    setRecipientsLoading(true);
    try {
      const data = await messagingApi.getRecipients(schoolSlug);
      setRecipients(flattenRecipients(data));
    } catch {
      // preselected reply recipient still works
    } finally {
      setRecipientsLoading(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  // ── Editor ──────────────────────────────────────────────────────────────────

  function handleEditorChange(html: string) {
    setBodyHtml(html);
    setHasBody(hasTextContent(html));
  }

  // ── Inline image insertion ──────────────────────────────────────────────────

  function handleInsertImage() {
    Alert.alert("Insérer une image", "Choisissez la source", [
      { text: "Galerie", onPress: pickFromGallery },
      { text: "Appareil photo", onPress: takePhoto },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      await insertImageAsset(result.assets[0]);
    }
  }

  async function pickAttachmentFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      addImageAttachmentAsset(result.assets[0]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      await insertImageAsset(result.assets[0]);
    }
  }

  async function takeAttachmentPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      addImageAttachmentAsset(result.assets[0]);
    }
  }

  function openAttachmentMenu() {
    Alert.alert("Joindre un fichier", "Choisissez le type de contenu", [
      { text: "Prendre une photo", onPress: takeAttachmentPhoto },
      { text: "Ouvrir la galerie", onPress: pickAttachmentFromGallery },
      { text: "Insérer un fichier", onPress: handlePickDocument },
      { text: "Annuler", style: "cancel" },
    ]);
  }

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
    editorRef.current?.command(buildFormatBlockCommand("h2"));
  }

  function applyQuote() {
    editorRef.current?.command(buildFormatBlockCommand("blockquote"));
  }

  async function insertImageAsset(asset: ImagePicker.ImagePickerAsset) {
    if (!schoolSlug) return;
    setIsInsertingImage(true);
    try {
      const url = await messagingApi.uploadInlineImage(
        schoolSlug,
        asset.uri,
        asset.mimeType ?? "image/jpeg",
        asset.fileName ?? `photo_${Date.now()}.jpg`,
      );
      editorRef.current?.insertImage(
        url,
        "max-width:100%;border-radius:8px;margin:8px 0;",
      );
    } catch {
      Alert.alert("Erreur", "Impossible d'insérer l'image. Réessayez.");
    } finally {
      setIsInsertingImage(false);
    }
  }

  function addImageAttachmentAsset(asset: ImagePicker.ImagePickerAsset) {
    const name =
      asset.fileName?.trim() ||
      `image_${Date.now()}.${asset.mimeType?.includes("png") ? "png" : "jpg"}`;

    const newFile: AttachedFile = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      size: asset.fileSize ?? 0,
      mimeType: resolveAttachmentMimeType({
        name,
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
      }),
      uri: asset.uri,
      uploaded: null,
    };

    setAttachedFiles((prev) => dedupeAttachedFiles([...prev, newFile]));
  }

  // ── File attachments (non-image documents) ──────────────────────────────────

  async function handlePickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        // Expo/Android uploads are reliable with a real cache file URI.
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newFiles: AttachedFile[] = result.assets.map((asset) => ({
        id: `${Date.now()}-${Math.random()}`,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: resolveAttachmentMimeType({
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType,
        }),
        uri: asset.uri,
        uploaded: null,
      }));

      setAttachedFiles((prev) => dedupeAttachedFiles([...prev, ...newFiles]));
    } catch {
      Alert.alert("Erreur", "Impossible d'ouvrir le sélecteur de fichiers.");
    }
  }

  function removeAttachment(id: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  const canSend =
    !isSending &&
    !isInsertingImage &&
    selectedRecipients.length > 0 &&
    subject.trim().length > 0 &&
    hasBody;
  const canSaveDraft =
    !isSending &&
    !isInsertingImage &&
    hasDraftContent({
      subject,
      hasBody,
      selectedRecipients,
      attachedFiles,
    });

  async function handleSend() {
    if (!canSend || !schoolSlug) return;
    await doSend();
  }

  async function handleSaveDraft() {
    if (!canSaveDraft || !schoolSlug) return;
    setIsSending(true);
    try {
      await messagingApi.send(schoolSlug, {
        subject: subject.trim() || "Brouillon sans objet",
        body: hasBody ? bodyHtml : EMPTY_DRAFT_HTML,
        recipientUserIds: selectedRecipients.map((r) => r.value),
        isDraft: true,
        attachments: attachedFiles.map((file) => ({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
        })),
      });
      if (folder === "drafts") await loadMessages(schoolSlug);
      showFeedbackToast({
        variant: "success",
        title: "Brouillon enregistré",
        message: "Votre brouillon a bien été sauvegardé.",
      });
      router.back();
    } catch (error) {
      const multipartError = getMultipartError(error);
      const message =
        multipartError &&
        multipartError.message &&
        multipartError.message !== "SEND_MESSAGE_FAILED"
          ? multipartError.message
          : "Impossible d'enregistrer le brouillon.";
      showFeedbackToast({
        variant: "error",
        title: "Enregistrement impossible",
        message,
      });
    } finally {
      setIsSending(false);
    }
  }

  async function doSend() {
    if (!schoolSlug) return;
    setIsSending(true);
    try {
      await messagingApi.send(schoolSlug, {
        subject: subject.trim(),
        body: bodyHtml,
        recipientUserIds: selectedRecipients.map((r) => r.value),
        attachments: attachedFiles.map((file) => ({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
        })),
      });
      if (folder === "sent") await loadMessages(schoolSlug);
      showFeedbackToast({
        variant: "success",
        title: "Message envoyé",
        message: "Votre message a bien été envoyé.",
      });
      router.back();
    } catch (error) {
      const multipartError = getMultipartError(error);

      if (multipartError) {
        console.error("MESSAGING_SEND_FAILED", {
          statusCode: multipartError.statusCode,
          message: multipartError.message,
          responseBody: multipartError.responseBody,
        });
      } else {
        console.error("MESSAGING_SEND_FAILED", error);
      }

      const message =
        multipartError &&
        multipartError.message &&
        multipartError.message !== "SEND_MESSAGE_FAILED"
          ? multipartError.message
          : "Impossible d'envoyer le message. Réessayez.";

      showFeedbackToast({
        variant: "error",
        title: "Envoi impossible",
        message,
      });
    } finally {
      setIsSending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="compose-back"
          >
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isReply ? "Répondre" : "Nouveau message"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Inserting image indicator */}
        {isInsertingImage && (
          <View style={styles.banner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.bannerText}>Insertion de l'image…</Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {/* Recipients */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>À</Text>
            <TouchableOpacity
              style={styles.recipientField}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
              testID="recipients-field"
            >
              {selectedRecipients.length === 0 ? (
                <Text style={styles.placeholder}>
                  {recipientsLoading
                    ? "Chargement des contacts…"
                    : "Choisir des destinataires"}
                </Text>
              ) : (
                <View style={styles.chips}>
                  {selectedRecipients.map((r) => (
                    <View key={r.value} style={styles.chip}>
                      <Text style={styles.chipText} numberOfLines={1}>
                        {r.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Subject */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Objet</Text>
            <TextInput
              style={styles.subjectInput}
              placeholder="Objet du message"
              placeholderTextColor={colors.textSecondary}
              value={subject}
              onChangeText={setSubject}
              maxLength={180}
              returnKeyType="next"
              testID="subject-input"
            />
          </View>

          <View style={styles.divider} />

          {/* Formatting toolbar */}
          <View style={styles.editorToolbarRow} testID="editor-quick-tools">
            <RichToolbar
              editor={editorRef}
              style={styles.richToolbar}
              iconTint={colors.textSecondary}
              selectedIconTint={colors.primary}
              disabledIconTint={colors.warmBorder}
              actions={[
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.setStrikethrough,
                actions.insertBulletsList,
                actions.insertOrderedList,
                actions.insertImage,
              ]}
              onPressAddImage={handleInsertImage}
              iconMap={{
                [actions.insertImage]: () => (
                  <Ionicons
                    name="image-outline"
                    size={20}
                    color={colors.primary}
                  />
                ),
              }}
              testID="rich-toolbar"
            />
            <View style={styles.editorQuickActions}>
            <TouchableOpacity
              style={styles.editorQuickToolBtn}
              onPress={openTextColorMenu}
              testID="editor-color-btn"
              accessibilityLabel="Couleur du texte"
            >
              <Ionicons
                name="color-palette-outline"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editorQuickToolBtn}
              onPress={applyHeading}
              testID="editor-heading-btn"
              accessibilityLabel="Titre"
            >
              <Ionicons
                name="text-outline"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editorQuickToolBtn}
              onPress={applyQuote}
              testID="editor-quote-btn"
              accessibilityLabel="Citation"
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
            </View>
          </View>

          {/* Rich text editor */}
          <RichEditor
            ref={editorRef}
            style={styles.richEditor}
            editorStyle={{
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              placeholderColor: colors.textSecondary,
              contentCSSText: `
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 15px;
                line-height: 1.6;
                padding: 16px;
                min-height: 200px;
              `,
            }}
            placeholder="Rédigez votre message…"
            onChange={handleEditorChange}
            useContainer
            initialFocus={false}
            testID="rich-editor"
          />

          {/* Attached files list */}
          {attachedFiles.length > 0 && (
            <View
              style={styles.attachmentsSection}
              testID="attachments-section"
            >
              <Text style={styles.attachmentsSectionLabel}>
                Pièces jointes ({attachedFiles.length})
              </Text>
              {attachedFiles.map((file) => (
                <View
                  key={file.id}
                  style={styles.attachmentRow}
                  testID={`attachment-${file.id}`}
                >
                  <View
                    style={[
                      styles.attachmentIconBg,
                      { backgroundColor: fileIconColor(file.mimeType) + "18" },
                    ]}
                  >
                    <Ionicons
                      name={fileIcon(file.mimeType) as "attach-outline"}
                      size={20}
                      color={fileIconColor(file.mimeType)}
                    />
                  </View>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.attachmentMeta}>
                      {formatFileSize(file.size)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeAttachment(file.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    testID={`remove-attachment-${file.id}`}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Bottom media/file toolbar */}
        <View
          style={[styles.bottomBarWrap, { paddingBottom: insets.bottom + 10 }]}
        >
          <View style={styles.bottomBar} testID="compose-action-bar">
          <TouchableOpacity
            style={[styles.actionBarBtn, styles.attachActionBarBtn]}
            onPress={openAttachmentMenu}
            testID="attachment-actions-btn"
          >
            <Ionicons
              name="attach-outline"
              size={20}
              color={colors.accentTeal}
            />
            <Text style={[styles.actionBarBtnLabel, styles.attachActionBarBtnLabel]}>
              Joindre
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBarBtn,
              styles.draftActionBarBtn,
              !canSaveDraft && styles.actionBarBtnDisabled,
            ]}
            onPress={handleSaveDraft}
            disabled={!canSaveDraft}
            testID="save-draft-btn"
          >
            <Ionicons name="save-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBarBtnLabel}>Brouillon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBarBtn,
              styles.sendActionBarBtn,
              !canSend && styles.actionBarBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!canSend}
            testID="send-btn"
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="send" size={18} color={colors.white} />
                <Text
                  style={[styles.actionBarBtnLabel, styles.sendActionBarBtnLabel]}
                >
                  Envoyer
                </Text>
              </>
            )}
          </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recipient picker */}
      <RecipientPickerModal
        visible={pickerVisible}
        recipients={recipients}
        selected={selectedRecipients}
        onClose={() => setPickerVisible(false)}
        onConfirm={(r) => setSelectedRecipients(r)}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
  },
  headerSpacer: { width: 22, height: 22 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(12,95,168,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  bannerText: { fontSize: 13, color: colors.primary, fontWeight: "500" },

  scroll: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingBottom: 132 },

  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: colors.surface,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    width: 48,
    paddingTop: 2,
  },
  recipientField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    minHeight: 24,
  },
  placeholder: { flex: 1, fontSize: 15, color: colors.textSecondary },
  chips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: "rgba(12,95,168,0.10)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 160,
  },
  chipText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  subjectInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },
  divider: { height: 1, backgroundColor: colors.warmBorder, marginLeft: 76 },

  editorToolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  richToolbar: {
    flex: 1,
    backgroundColor: "transparent",
    height: 46,
  },
  editorQuickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 10,
  },
  editorQuickToolBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  richEditor: {
    minHeight: 200,
    backgroundColor: colors.surface,
  },

  // ── Attachments ─────────────────────────────────────────────────────────────
  attachmentsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    padding: 16,
    gap: 10,
  },
  attachmentsSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  attachmentIconBg: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  attachmentInfo: { flex: 1 },
  attachmentName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  attachmentMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // ── Bottom action bar ───────────────────────────────────────────────────────
  bottomBarWrap: {
    backgroundColor: "rgba(247, 242, 234, 0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#7B5E45",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
  },
  actionBarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    flexShrink: 1,
  },
  actionBarBtnDisabled: { opacity: 0.45 },
  actionBarBtnLabel: {
    fontSize: 13,
    fontWeight: "700",
    includeFontPadding: false,
  },
  attachActionBarBtn: {
    backgroundColor: "rgba(56, 173, 169, 0.12)",
  },
  attachActionBarBtnLabel: {
    color: colors.accentTeal,
  },
  draftActionBarBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  sendActionBarBtn: {
    backgroundColor: colors.warmAccent,
  },
  sendActionBarBtnLabel: {
    color: colors.white,
  },
  actionBarLabel: {
    color: colors.primary,
  },
});
