import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { RichEditor } from "react-native-pell-rich-editor";
import { colors } from "../../../src/theme";
import {
  messagingApi,
  MessagingMultipartError,
} from "../../../src/api/messaging.api";
import { useAuthStore } from "../../../src/store/auth.store";
import { useMessagingStore } from "../../../src/store/messaging.store";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { RichTextToolbar } from "../../../src/components/editor/RichTextToolbar";
import {
  ImageEditPanel,
  type ImageSize,
  type ImageAlign,
} from "../../../src/components/editor/ImageEditPanel";
import { RecipientPickerModal } from "../../../src/components/messaging/RecipientPickerModal";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import {
  useTranslation,
  type TranslateFn,
} from "../../../src/i18n/useTranslation";
import type {
  RecipientOption,
  MessagingRecipients,
} from "../../../src/types/messaging.types";
import { moduleBack } from "../../../src/utils/moduleBack";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttachedFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uri: string;
  /** true when backend returned 200, false = unsupported type, null = not tried */
  uploaded: boolean | null;
  /** Set when this attachment is carried over from a forwarded message — it is
   * sent by reference (forwardAttachmentIds) instead of being re-uploaded. */
  forwardedAttachmentId?: string;
  /** Set when this attachment already belongs to the draft being edited — the
   * update-draft endpoint does not support attachment changes, so these are
   * displayed read-only and never re-submitted. */
  existingAttachment?: boolean;
};

export const TEXT_COLOR_PRESETS = [
  {
    label: "Bleu profond",
    labelKey: "messaging.compose.colorMenu.deepBlue",
    value: "#0C5FA8",
  },
  {
    label: "Vert soutien",
    labelKey: "messaging.compose.colorMenu.supportGreen",
    value: "#217346",
  },
  {
    label: "Rouge alerte",
    labelKey: "messaging.compose.colorMenu.alertRed",
    value: "#B42318",
  },
  {
    label: "Noir",
    labelKey: "messaging.compose.colorMenu.black",
    value: "#1B1F23",
  },
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
    const key = file.forwardedAttachmentId ?? `${file.name}::${file.uri}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildQuotedBodyHtml(
  quoteHeader?: string,
  quoteBodyHtml?: string,
): string {
  if (!quoteBodyHtml) return "";
  const headerHtml = quoteHeader
    ? quoteHeader.split("\n").map(escapeHtmlText).join("<br/>")
    : "";
  return `<p>&nbsp;</p><p>&nbsp;</p>${
    headerHtml ? `<p>${headerHtml}</p>` : ""
  }<blockquote>${quoteBodyHtml}</blockquote>`;
}

export function buildPrefixedSubject(
  rawSubject: string,
  prefix: string,
): string {
  const normalized = rawSubject.trim();
  const trimmedPrefix = prefix.trim().toLowerCase();
  if (normalized.toLowerCase().startsWith(trimmedPrefix)) {
    return normalized;
  }
  return `${prefix}${normalized}`;
}

type ForwardAttachmentRef = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

function parseForwardAttachments(json?: string): AttachedFile[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as ForwardAttachmentRef[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((attachment) => ({
      id: `fwd-${attachment.id}`,
      name: attachment.fileName,
      size: attachment.sizeBytes,
      mimeType: attachment.mimeType,
      uri: "",
      uploaded: null,
      forwardedAttachmentId: attachment.id,
    }));
  } catch {
    return [];
  }
}

export function buildFormatBlockCommand(tag: "h2" | "blockquote"): string {
  return `document.execCommand('formatBlock', false, '<${tag}>'); true;`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenRecipients(
  data: MessagingRecipients,
  t: TranslateFn,
): RecipientOption[] {
  const teachers: RecipientOption[] = data.teachers.map((entry) => ({
    value: entry.value,
    label: entry.label,
    email: entry.email,
    subtitle:
      [
        ...(entry.subjects ?? []).slice(0, 2),
        ...(entry.classes ?? []).slice(0, 2),
      ]
        .filter(Boolean)
        .join(" · ") || t("messaging.recipientPicker.defaultTeacherSubtitle"),
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

function buildComposeSchema(t: TranslateFn) {
  return z.object({
    subject: z.string().trim().min(1, t("messaging.compose.subjectError")),
  });
}
type ComposeValues = z.infer<ReturnType<typeof buildComposeSchema>>;

function splitAttachmentsForSend(attachedFiles: AttachedFile[]) {
  const newFiles = attachedFiles.filter((file) => !file.forwardedAttachmentId);
  const forwardAttachmentIds = attachedFiles
    .filter((file): file is AttachedFile & { forwardedAttachmentId: string } =>
      Boolean(file.forwardedAttachmentId),
    )
    .map((file) => file.forwardedAttachmentId);

  return {
    attachments: newFiles.map((file) => ({
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
    })),
    forwardAttachmentIds:
      forwardAttachmentIds.length > 0 ? forwardAttachmentIds : undefined,
  };
}

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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();
  const { folder, loadMessages } = useMessagingStore();
  const showFeedbackToast = useSuccessToastStore((state) => state.show);
  const editorRef = useRef<RichEditor>(null);

  const {
    replyToSubject,
    replyToSenderId,
    replyToSenderLabel,
    forwardSubject,
    quoteHeader,
    quoteBodyHtml,
    forwardAttachments,
    prefilledRecipientId,
    prefilledRecipientLabel,
    prefilledRecipientEmail,
    draftId,
  } = useLocalSearchParams<{
    replyToSubject?: string;
    replyToSenderId?: string;
    replyToSenderLabel?: string;
    forwardSubject?: string;
    quoteHeader?: string;
    quoteBodyHtml?: string;
    forwardAttachments?: string;
    prefilledRecipientId?: string;
    prefilledRecipientLabel?: string;
    prefilledRecipientEmail?: string;
    draftId?: string;
  }>();

  const isReply = !!replyToSubject;
  const isForward = !!forwardSubject;
  const isEditingDraft = !!draftId;

  const initialSubject = isForward
    ? buildPrefixedSubject(
        forwardSubject ?? "",
        t("messaging.detail.forward.subjectPrefix"),
      )
    : isReply
      ? replyToSubject!.startsWith("Re:") || replyToSubject!.startsWith("RE:")
        ? replyToSubject!
        : `Re: ${replyToSubject}`
      : "";

  const initialBodyHtml = buildQuotedBodyHtml(quoteHeader, quoteBodyHtml);

  const composeSchema = useMemo(() => buildComposeSchema(t), [t]);

  const { control, handleSubmit, formState, getValues, watch, reset } =
    useForm<ComposeValues>({
      mode: "onChange",
      reValidateMode: "onChange",
      resolver: zodResolver(composeSchema),
      defaultValues: { subject: initialSubject },
    });

  const { submitCount } = formState;
  const watchedSubject = watch("subject");

  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [hasBody, setHasBody] = useState(hasTextContent(initialBodyHtml));
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<
    RecipientOption[]
  >(() => {
    if (replyToSenderId && replyToSenderLabel) {
      return [{ value: replyToSenderId, label: replyToSenderLabel }];
    }
    if (prefilledRecipientId && prefilledRecipientLabel) {
      return [
        {
          value: prefilledRecipientId,
          label: prefilledRecipientLabel,
          email: prefilledRecipientEmail ?? undefined,
        },
      ];
    }
    return [];
  });
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(() =>
    parseForwardAttachments(forwardAttachments),
  );
  const [editorHeight, setEditorHeight] = useState(200);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedImageSize, setSelectedImageSize] = useState<ImageSize | null>(
    null,
  );
  const [selectedImageAlign, setSelectedImageAlign] =
    useState<ImageAlign | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(isEditingDraft);
  const [draftLoadFailed, setDraftLoadFailed] = useState(false);

  // ── Load existing draft (edit mode) ─────────────────────────────────────────

  useEffect(() => {
    if (!draftId || !schoolSlug) return;
    let cancelled = false;
    setIsDraftLoading(true);
    setDraftLoadFailed(false);
    messagingApi
      .get(schoolSlug, draftId)
      .then((m) => {
        if (cancelled) return;
        reset({ subject: m.subject });
        const html = m.body || EMPTY_DRAFT_HTML;
        setBodyHtml(html);
        setHasBody(hasTextContent(html));
        setSelectedRecipients(
          m.recipients.map((r) => ({
            value: r.userId,
            label: `${r.lastName} ${r.firstName}`,
            email: r.email,
          })),
        );
        setAttachedFiles(
          m.attachments.map((a) => ({
            id: a.id,
            name: a.fileName,
            size: a.sizeBytes,
            mimeType: a.mimeType,
            uri: a.url,
            uploaded: true,
            existingAttachment: true,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setDraftLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsDraftLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftId, schoolSlug, reset]);

  // ── Load recipients ─────────────────────────────────────────────────────────

  const loadRecipients = useCallback(async () => {
    if (!schoolSlug) return;
    setRecipientsLoading(true);
    try {
      const data = await messagingApi.getRecipients(schoolSlug);
      setRecipients(flattenRecipients(data, t));
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
    if (bodyError) setBodyError(null);
  }

  // ── Inline image insertion ──────────────────────────────────────────────────

  function handleInsertImage() {
    Alert.alert(
      t("messaging.compose.insertImage.title"),
      t("messaging.compose.insertImage.message"),
      [
        {
          text: t("messaging.compose.insertImage.gallery"),
          onPress: pickFromGallery,
        },
        { text: t("messaging.compose.insertImage.camera"), onPress: takePhoto },
        { text: t("messaging.compose.cancel"), style: "cancel" },
      ],
    );
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("messaging.compose.errors.permissionDeniedTitle"),
        t("messaging.compose.errors.galleryPermission"),
      );
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
      Alert.alert(
        t("messaging.compose.errors.permissionDeniedTitle"),
        t("messaging.compose.errors.galleryPermission"),
      );
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
      Alert.alert(
        t("messaging.compose.errors.permissionDeniedTitle"),
        t("messaging.compose.errors.cameraPermission"),
      );
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
      Alert.alert(
        t("messaging.compose.errors.permissionDeniedTitle"),
        t("messaging.compose.errors.cameraPermission"),
      );
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
    Alert.alert(
      t("messaging.compose.attachMenu.title"),
      t("messaging.compose.attachMenu.message"),
      [
        {
          text: t("messaging.compose.attachMenu.takePhoto"),
          onPress: takeAttachmentPhoto,
        },
        {
          text: t("messaging.compose.attachMenu.openGallery"),
          onPress: pickAttachmentFromGallery,
        },
        {
          text: t("messaging.compose.attachMenu.insertFile"),
          onPress: handlePickDocument,
        },
        { text: t("messaging.compose.cancel"), style: "cancel" },
      ],
    );
  }

  function openTextColorMenu() {
    Alert.alert(
      t("messaging.compose.colorMenu.title"),
      t("messaging.compose.colorMenu.message"),
      [
        ...TEXT_COLOR_PRESETS.map((color) => ({
          text: t(color.labelKey),
          onPress: () => editorRef.current?.setForeColor(color.value),
        })),
        { text: t("messaging.compose.cancel"), style: "cancel" as const },
      ],
    );
  }

  function applyHeading() {
    editorRef.current?.command(buildFormatBlockCommand("h2"));
  }

  function applyQuote() {
    editorRef.current?.command(buildFormatBlockCommand("blockquote"));
  }

  function injectImageClickHandler() {
    editorRef.current?.commandDOM(`
      (function() {
        if (document.__rnImgListenerAdded) return;
        document.__rnImgListenerAdded = true;
        var imgCounter = 0;
        document.addEventListener('click', function(e) {
          var el = e.target;
          if (el && el.tagName === 'IMG') {
            if (!el.dataset.rnId) {
              el.dataset.rnId = 'img_' + (++imgCounter);
            }
            var widthStr = el.style.width || '';
            var size = null;
            var match = widthStr.match(/^(\\d+)%$/);
            if (match) size = parseInt(match[1], 10);
            var align = el.style.float || el.style.marginLeft === 'auto' ? 'center' : null;
            if (el.style.float === 'left') align = 'left';
            else if (el.style.float === 'right') align = 'right';
            else if (el.style.marginLeft === 'auto' && el.style.marginRight === 'auto') align = 'center';
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'IMAGE_TAPPED',
              id: el.dataset.rnId,
              size: size,
              align: align
            }));
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CLICK_OUTSIDE_IMAGE'
            }));
          }
        }, true);
      })();
    `);
  }

  function handleEditorMessage(message: {
    type: string;
    [key: string]: unknown;
  }) {
    if (message.type === "IMAGE_TAPPED") {
      const id = message.id as string | undefined;
      const size = message.size as ImageSize | null | undefined;
      const align = message.align as ImageAlign | null | undefined;
      setSelectedImageId(id ?? null);
      setSelectedImageSize(size ?? null);
      setSelectedImageAlign(align ?? null);
    } else if (message.type === "CLICK_OUTSIDE_IMAGE") {
      setSelectedImageId(null);
      setSelectedImageSize(null);
      setSelectedImageAlign(null);
    }
  }

  function applyImageSize(size: ImageSize) {
    if (!selectedImageId) return;
    setSelectedImageSize(size);
    editorRef.current?.commandDOM(`
      (function($) {
        var img = $('[data-rn-id="${selectedImageId}"]');
        if (img) {
          img.style.width = '${size}%';
          img.style.maxWidth = '${size}%';
          img.style.height = 'auto';
          img.style.display = 'block';
          if (!img.style.marginLeft) img.style.marginLeft = '0';
        }
      })($);
    `);
  }

  function applyImageAlign(align: ImageAlign) {
    if (!selectedImageId) return;
    setSelectedImageAlign(align);
    editorRef.current?.commandDOM(`
      (function($) {
        var img = $('[data-rn-id="${selectedImageId}"]');
        if (img) {
          img.style.display = 'block';
          if ('${align}' === 'left') {
            img.style.float = 'left';
            img.style.marginLeft = '0';
            img.style.marginRight = '12px';
          } else if ('${align}' === 'right') {
            img.style.float = 'right';
            img.style.marginRight = '0';
            img.style.marginLeft = '12px';
          } else {
            img.style.float = 'none';
            img.style.marginLeft = 'auto';
            img.style.marginRight = 'auto';
          }
        }
      })($);
    `);
  }

  function deleteSelectedImage() {
    if (!selectedImageId) return;
    editorRef.current?.commandDOM(`
      (function($) {
        var img = $('[data-rn-id="${selectedImageId}"]');
        if (img) img.parentNode.removeChild(img);
      })($);
    `);
    setSelectedImageId(null);
    setSelectedImageSize(null);
    setSelectedImageAlign(null);
  }

  function dismissImageEdit() {
    setSelectedImageId(null);
    setSelectedImageSize(null);
    setSelectedImageAlign(null);
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
        "width:100%;max-width:100%;height:auto;display:block;border-radius:8px;margin:8px 0;",
      );
    } catch {
      Alert.alert(
        t("messaging.compose.errors.genericTitle"),
        t("messaging.compose.errors.insertImageFailed"),
      );
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
      Alert.alert(
        t("messaging.compose.errors.genericTitle"),
        t("messaging.compose.errors.documentPickerFailed"),
      );
    }
  }

  function removeAttachment(id: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  const canSaveDraft =
    !isSending &&
    !isInsertingImage &&
    hasDraftContent({
      subject: watchedSubject,
      hasBody,
      selectedRecipients,
      attachedFiles,
    });

  const handleSend = handleSubmit(async (data: ComposeValues) => {
    if (selectedRecipients.length === 0) {
      setRecipientsError(t("messaging.compose.recipientsError"));
      return;
    }
    setRecipientsError(null);

    if (!hasBody) {
      setBodyError(t("messaging.compose.bodyError"));
      return;
    }
    setBodyError(null);

    await doSend(data.subject.trim());
  });

  async function handleSaveDraft() {
    if (!canSaveDraft || !schoolSlug) return;
    setIsSending(true);
    try {
      const currentSubject = getValues("subject");
      const subject =
        currentSubject.trim() || t("messaging.compose.defaultDraftSubject");
      const body = hasBody ? bodyHtml : EMPTY_DRAFT_HTML;
      const recipientUserIds = selectedRecipients.map((r) => r.value);

      if (isEditingDraft && draftId) {
        await messagingApi.updateDraft(schoolSlug, draftId, {
          subject,
          body,
          recipientUserIds,
        });
      } else {
        await messagingApi.send(schoolSlug, {
          subject,
          body,
          recipientUserIds,
          isDraft: true,
          ...splitAttachmentsForSend(attachedFiles),
        });
      }
      if (folder === "drafts") await loadMessages(schoolSlug);
      showFeedbackToast({
        variant: "success",
        title: t("messaging.compose.toasts.draftSavedTitle"),
        message: t("messaging.compose.toasts.draftSavedMessage"),
      });
      router.back();
    } catch (error) {
      const multipartError = getMultipartError(error);
      const message =
        multipartError &&
        multipartError.message &&
        multipartError.message !== "SEND_MESSAGE_FAILED"
          ? multipartError.message
          : t("messaging.compose.toasts.draftSaveErrorMessage");
      showFeedbackToast({
        variant: "error",
        title: t("messaging.compose.toasts.draftSaveErrorTitle"),
        message,
      });
    } finally {
      setIsSending(false);
    }
  }

  async function doSend(subject: string) {
    if (!schoolSlug) return;
    setIsSending(true);
    try {
      if (isEditingDraft && draftId) {
        await messagingApi.updateDraft(schoolSlug, draftId, {
          subject,
          body: bodyHtml,
          recipientUserIds: selectedRecipients.map((r) => r.value),
        });
        await messagingApi.sendDraft(schoolSlug, draftId);
      } else {
        await messagingApi.send(schoolSlug, {
          subject,
          body: bodyHtml,
          recipientUserIds: selectedRecipients.map((r) => r.value),
          ...splitAttachmentsForSend(attachedFiles),
        });
      }
      if (folder === "sent" || folder === "drafts") {
        await loadMessages(schoolSlug);
      }
      showFeedbackToast({
        variant: "success",
        title: t("messaging.compose.toasts.sentTitle"),
        message: t("messaging.compose.toasts.sentMessage"),
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
          : t("messaging.compose.toasts.sendErrorMessage");

      showFeedbackToast({
        variant: "error",
        title: t("messaging.compose.toasts.sendErrorTitle"),
        message,
      });
    } finally {
      setIsSending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const content = (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        {/* Header */}
        <ModuleHeader
          title={
            isEditingDraft
              ? t("messaging.compose.titleEditDraft")
              : isForward
                ? t("messaging.compose.titleForward")
                : isReply
                  ? t("messaging.compose.titleReply")
                  : t("messaging.compose.titleNew")
          }
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="compose-header"
          backTestID="compose-back"
          titleTestID="compose-header-title"
        />

        {/* Draft loading / error states */}
        {isDraftLoading ? (
          <View style={styles.center} testID="compose-draft-loading">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : draftLoadFailed ? (
          <View style={styles.center} testID="compose-draft-error">
            <Ionicons
              name="alert-circle-outline"
              size={32}
              color={colors.notification}
            />
            <Text style={styles.errorText}>
              {t("messaging.compose.errors.draftLoadFailedMessage")}
            </Text>
          </View>
        ) : (
          <>
            {/* Inserting image indicator */}
            {isInsertingImage && (
              <View style={styles.banner}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.bannerText}>
                  {t("messaging.compose.insertingImage")}
                </Text>
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
                <Text style={styles.fieldLabel}>
                  {t("messaging.compose.recipientsLabel")}
                </Text>
                <TouchableOpacity
                  style={styles.recipientField}
                  onPress={() => {
                    setPickerVisible(true);
                    setRecipientsError(null);
                  }}
                  activeOpacity={0.7}
                  testID="recipients-field"
                >
                  {selectedRecipients.length === 0 ? (
                    <Text style={styles.placeholder}>
                      {recipientsLoading
                        ? t("messaging.compose.recipientsLoading")
                        : t("messaging.compose.recipientsPlaceholder")}
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
              {recipientsError ? (
                <Text style={styles.inlineError} testID="recipients-error">
                  {recipientsError}
                </Text>
              ) : null}

              <View style={styles.divider} />

              {/* Subject */}
              <Controller
                control={control}
                name="subject"
                render={({ field, fieldState }) => {
                  const showErr =
                    !!fieldState.error &&
                    (fieldState.isDirty || submitCount > 0);
                  return (
                    <>
                      <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>
                          {t("messaging.compose.subjectLabel")}
                        </Text>
                        <TextInput
                          style={styles.subjectInput}
                          placeholder={t(
                            "messaging.compose.subjectPlaceholder",
                          )}
                          placeholderTextColor={colors.textSecondary}
                          value={field.value}
                          onChangeText={field.onChange}
                          maxLength={180}
                          returnKeyType="next"
                          testID="subject-input"
                        />
                      </View>
                      {showErr ? (
                        <Text style={styles.inlineError} testID="subject-error">
                          {fieldState.error?.message}
                        </Text>
                      ) : null}
                    </>
                  );
                }}
              />

              <View style={styles.divider} />

              {/* Formatting toolbar */}
              <RichTextToolbar
                editorRef={editorRef}
                onPressAddImage={handleInsertImage}
                onPressColor={openTextColorMenu}
                onPressHeading={applyHeading}
                onPressQuote={applyQuote}
              />

              {/* Image edit panel — shown when an image is tapped in editor */}
              {selectedImageId ? (
                <ImageEditPanel
                  onSizePress={applyImageSize}
                  onAlignPress={applyImageAlign}
                  onDelete={deleteSelectedImage}
                  onClose={dismissImageEdit}
                  currentSize={selectedImageSize}
                  currentAlign={selectedImageAlign}
                />
              ) : null}

              {/* Rich text editor — useContainer + onHeightChange pour auto-expansion */}
              <RichEditor
                ref={editorRef}
                style={[styles.richEditor, { height: editorHeight }]}
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
                  cssText:
                    "img { max-width: 100%; height: auto; display: block; margin: 8px 0; }",
                }}
                placeholder={t("messaging.compose.bodyPlaceholder")}
                onChange={handleEditorChange}
                onHeightChange={(h) => setEditorHeight(Math.max(200, h))}
                initialContentHTML={initialBodyHtml}
                useContainer
                initialFocus={false}
                editorInitializedCallback={injectImageClickHandler}
                onMessage={handleEditorMessage}
                testID="rich-editor"
              />

              {/* Body error */}
              {bodyError ? (
                <Text style={styles.inlineError} testID="body-error">
                  {bodyError}
                </Text>
              ) : null}

              {/* Attached files list */}
              {attachedFiles.length > 0 && (
                <View
                  style={styles.attachmentsSection}
                  testID="attachments-section"
                >
                  <Text style={styles.attachmentsSectionLabel}>
                    {t("messaging.compose.attachmentsTitle").replace(
                      "{count}",
                      String(attachedFiles.length),
                    )}
                  </Text>
                  {isEditingDraft ? (
                    <Text style={styles.attachmentsLockedHint}>
                      {t("messaging.compose.attachments.lockedHint")}
                    </Text>
                  ) : null}
                  {attachedFiles.map((file) => (
                    <View
                      key={file.id}
                      style={styles.attachmentRow}
                      testID={`attachment-${file.id}`}
                    >
                      <View
                        style={[
                          styles.attachmentIconBg,
                          {
                            backgroundColor:
                              fileIconColor(file.mimeType) + "18",
                          },
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
                          {file.forwardedAttachmentId
                            ? ` · ${t("messaging.compose.attachments.forwardedTag")}`
                            : ""}
                        </Text>
                      </View>
                      {file.existingAttachment ? null : (
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
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Bottom media/file toolbar */}
            <View
              style={[
                styles.bottomBarWrap,
                { paddingBottom: insets.bottom + 10 },
              ]}
            >
              <View style={styles.bottomBar} testID="compose-action-bar">
                {isEditingDraft ? null : (
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
                    <Text
                      style={[
                        styles.actionBarBtnLabel,
                        styles.attachActionBarBtnLabel,
                      ]}
                    >
                      {t("messaging.compose.attachBtn")}
                    </Text>
                  </TouchableOpacity>
                )}

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
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.actionBarBtnLabel}>
                    {t("messaging.compose.draftBtn")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBarBtn,
                    styles.sendActionBarBtn,
                    (isSending || isInsertingImage) &&
                      styles.actionBarBtnDisabled,
                  ]}
                  onPress={() => {
                    void handleSend();
                  }}
                  disabled={isSending || isInsertingImage}
                  testID="send-btn"
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color={colors.white} />
                      <Text
                        style={[
                          styles.actionBarBtnLabel,
                          styles.sendActionBarBtnLabel,
                        ]}
                      >
                        {t("messaging.compose.sendBtn")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
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

  return <AppShell showHeader={false}>{content}</AppShell>;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },

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
  inlineError: {
    fontSize: 12,
    color: colors.notification,
    paddingHorizontal: 16,
    marginTop: -6,
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
  attachmentsLockedHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
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
