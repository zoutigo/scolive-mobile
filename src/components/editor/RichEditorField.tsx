import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { RichEditor } from "react-native-pell-rich-editor";
import { colors } from "../../theme";
import { RichTextToolbar } from "./RichTextToolbar";
import { ColorPickerPanel } from "./ColorPickerPanel";
import {
  ImageEditPanel,
  type ImageAlign,
  type ImageSize,
} from "./ImageEditPanel";

export type RichEditorFieldRef = {
  focus: () => void;
  clear: () => void;
  setContentHtml: (html: string) => void;
  getContentHtml: () => Promise<string>;
};

export type RichEditorColorPreset = { label: string; value: string };

export type RichEditorPickedFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export type RichEditorUploadedMedia = { url: string };

export type RichEditorFieldLabels = {
  colorMenuTitle: string;
  colorMenuMessage: string;
  cancel: string;
  /** Only shown if onUploadInlineImage or onUploadInlineVideo is provided. */
  permissionDeniedTitle?: string;
  permissionDeniedMessage?: string;
  imageErrorTitle?: string;
  imageErrorFallbackMessage?: string;
  videoErrorTitle?: string;
  videoErrorFallbackMessage?: string;
};

export type RichEditorFieldProps = {
  initialHtml?: string;
  onChangeHtml?: (html: string) => void;
  placeholder: string;
  insertingPlaceholder?: string;
  minHeight?: number;

  colorPresets: readonly RichEditorColorPreset[];
  labels: RichEditorFieldLabels;

  onUploadInlineImage?: (
    file: RichEditorPickedFile,
  ) => Promise<RichEditorUploadedMedia>;
  imageInsertStyle?: string;

  onUploadInlineVideo?: (
    file: RichEditorPickedFile,
  ) => Promise<RichEditorUploadedMedia>;

  containerStyle?: StyleProp<ViewStyle>;
  editorBackgroundColor?: string;
  editorTextColor?: string;
  contentCSSText?: string;
  cssText?: string;

  editorTestID?: string;
  toolbarTestID?: string;
  quickToolsTestID?: string;
  colorButtonTestID?: string;
  headingButtonTestID?: string;
  quoteButtonTestID?: string;
  videoButtonTestID?: string;
};

/**
 * Extra swatches always offered by the color picker on top of whatever
 * colorPresets a caller passes in, so every RichEditorField instance gets a
 * richer palette without each screen having to list dozens of colors itself.
 */
/**
 * The underlying WebView bridge call can hang forever (message lost, WebView
 * not fully initialized yet) with no rejection — this bounds getContentHtml()
 * so a stuck submit falls back to the last known htmlState instead of hanging
 * the caller's form submission indefinitely with no feedback to the user.
 */
const GET_CONTENT_HTML_TIMEOUT_MS = 4000;

const EXTENDED_COLOR_PALETTE: readonly RichEditorColorPreset[] = [
  { label: "Noir", value: "#111827" },
  { label: "Gris ardoise", value: "#374151" },
  { label: "Gris", value: "#6B7280" },
  { label: "Rouge", value: "#DC2626" },
  { label: "Rouge foncé", value: "#B91C1C" },
  { label: "Orange", value: "#EA580C" },
  { label: "Ambre", value: "#D97706" },
  { label: "Jaune", value: "#CA8A04" },
  { label: "Vert citron", value: "#65A30D" },
  { label: "Vert", value: "#16A34A" },
  { label: "Émeraude", value: "#0F766E" },
  { label: "Cyan", value: "#0891B2" },
  { label: "Bleu", value: "#2563EB" },
  { label: "Bleu profond", value: "#08467D" },
  { label: "Indigo", value: "#4F46E5" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Magenta", value: "#C026D3" },
  { label: "Rose", value: "#DB2777" },
  { label: "Marron", value: "#92400E" },
  { label: "Blanc", value: "#FFFFFF" },
];

function mergeColorPresets(
  callerPresets: readonly RichEditorColorPreset[],
): RichEditorColorPreset[] {
  const seen = new Set(
    callerPresets.map((preset) => preset.value.toLowerCase()),
  );
  const extras = EXTENDED_COLOR_PALETTE.filter(
    (preset) => !seen.has(preset.value.toLowerCase()),
  );
  return [...callerPresets, ...extras];
}

/**
 * Re-measures the WebView content height and reports it back to RN. Needed
 * anywhere the DOM changes size without firing the input/keyup/paste events
 * that react-native-pell-rich-editor listens to internally — e.g. an <img>
 * finishing its async load, or a resize/align style change applied via
 * commandDOM — otherwise the RN-side height state goes stale and taller
 * content gets clipped by the container's overflow:hidden.
 */
const RECALC_HEIGHT_JS = `
  var __rnContent = document.getElementById('content');
  if (__rnContent && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OFFSET_HEIGHT', data: __rnContent.scrollHeight }));
  }
`;

function formatBlockCommand(tag: "h2" | "blockquote"): string {
  return `document.execCommand('formatBlock', false, '<${tag}>'); true;`;
}

function insertVideoCommand(videoUrl: string, title?: string): string {
  const safeUrl = videoUrl.replace(/'/g, "\\'");
  const safeTitle = (title ?? "video").replace(/'/g, "\\'");
  return `
    (function() {
      var video = document.createElement('video');
      video.src = '${safeUrl}';
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.borderRadius = '8px';
      video.style.margin = '8px 0';
      video.setAttribute('title', '${safeTitle}');
      var selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(video);
        range.setStartAfter(video);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        document.body.appendChild(video);
      }
    })();
    true;
  `;
}

/**
 * Same click-delegation script as app/(home)/messages/compose.tsx: tags every
 * tapped <img> with a stable data-rn-id and reports taps back through
 * onMessage so the RN side can position the ImageEditPanel — there is no way
 * to read image bounding boxes from the RN side otherwise.
 */
const INJECT_IMAGE_CLICK_HANDLER_SCRIPT = `
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
        var align = null;
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
    document.addEventListener('load', function(e) {
      if (e.target && e.target.tagName === 'IMG') {
        ${RECALC_HEIGHT_JS}
      }
    }, true);
  })();
`;

export const RichEditorField = forwardRef<
  RichEditorFieldRef,
  RichEditorFieldProps
>(function RichEditorField(
  {
    initialHtml = "",
    onChangeHtml,
    placeholder,
    insertingPlaceholder,
    minHeight = 200,
    colorPresets,
    labels,
    onUploadInlineImage,
    imageInsertStyle = "width:100%;max-width:100%;height:auto;display:block;border-radius:8px;margin:8px 0;",
    onUploadInlineVideo,
    containerStyle,
    editorBackgroundColor = colors.surface,
    editorTextColor = colors.textPrimary,
    contentCSSText,
    cssText,
    editorTestID,
    toolbarTestID,
    quickToolsTestID,
    colorButtonTestID,
    headingButtonTestID,
    quoteButtonTestID,
    videoButtonTestID,
  },
  ref,
) {
  const editorRef = useRef<RichEditor>(null);
  const [editorHeight, setEditorHeight] = useState(minHeight);
  const [htmlState, setHtmlState] = useState(initialHtml);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedImageSize, setSelectedImageSize] = useState<ImageSize | null>(
    null,
  );
  const [selectedImageAlign, setSelectedImageAlign] =
    useState<ImageAlign | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const mergedColorPresets = useMemo(
    () => mergeColorPresets(colorPresets),
    [colorPresets],
  );

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focusContentEditor?.(),
    clear: () => {
      editorRef.current?.setContentHTML?.("");
      setHtmlState("");
      setSelectedImageId(null);
      setSelectedImageSize(null);
      setSelectedImageAlign(null);
    },
    setContentHtml: (html: string) => {
      editorRef.current?.setContentHTML?.(html);
      setHtmlState(html);
      setSelectedImageId(null);
      setSelectedImageSize(null);
      setSelectedImageAlign(null);
    },
    getContentHtml: async () => {
      const getter = editorRef.current?.getContentHtml?.bind(editorRef.current);
      if (!getter) {
        return htmlState;
      }
      const html = await Promise.race([
        getter().catch(() => undefined),
        new Promise<undefined>((resolve) =>
          setTimeout(() => resolve(undefined), GET_CONTENT_HTML_TIMEOUT_MS),
        ),
      ]);
      if (typeof html === "string" && html.trim().length > 0) {
        return html;
      }
      return htmlState;
    },
  }));

  function handleChange(html: string) {
    setHtmlState(html);
    onChangeHtml?.(html);
  }

  function injectImageClickHandler() {
    editorRef.current?.commandDOM(INJECT_IMAGE_CLICK_HANDLER_SCRIPT);
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
    if (!selectedImageId) {
      return;
    }
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
        ${RECALC_HEIGHT_JS}
      })($);
    `);
  }

  function applyImageAlign(align: ImageAlign) {
    if (!selectedImageId) {
      return;
    }
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
        ${RECALC_HEIGHT_JS}
      })($);
    `);
  }

  function deleteSelectedImage() {
    if (!selectedImageId) {
      return;
    }
    editorRef.current?.commandDOM(`
      (function($) {
        var img = $('[data-rn-id="${selectedImageId}"]');
        if (img) img.parentNode.removeChild(img);
        ${RECALC_HEIGHT_JS}
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

  function applyHeading() {
    editorRef.current?.command(formatBlockCommand("h2"));
  }

  function applyQuote() {
    editorRef.current?.command(formatBlockCommand("blockquote"));
  }

  function openColorMenu() {
    setIsColorPickerOpen(true);
  }

  function closeColorMenu() {
    setIsColorPickerOpen(false);
  }

  function applyColor(value: string) {
    editorRef.current?.setForeColor(value);
    setIsColorPickerOpen(false);
  }

  async function pickAndInsertImage() {
    if (!onUploadInlineImage || isBusy) {
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        labels.permissionDeniedTitle ?? "",
        labels.permissionDeniedMessage ?? "",
      );
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
    setIsBusy(true);
    try {
      const uploaded = await onUploadInlineImage({
        uri: asset.uri,
        name: asset.fileName ?? `inline-image-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      editorRef.current?.insertImage(uploaded.url, imageInsertStyle);
    } catch (error) {
      Alert.alert(
        labels.imageErrorTitle ?? "",
        error instanceof Error
          ? error.message
          : (labels.imageErrorFallbackMessage ?? ""),
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function pickAndInsertVideo() {
    if (!onUploadInlineVideo || isBusy) {
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        labels.permissionDeniedTitle ?? "",
        labels.permissionDeniedMessage ?? "",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    setIsBusy(true);
    try {
      const uploaded = await onUploadInlineVideo({
        uri: asset.uri,
        name: asset.fileName ?? `inline-video-${Date.now()}.mp4`,
        mimeType: asset.mimeType ?? "video/mp4",
      });
      editorRef.current?.command(
        insertVideoCommand(uploaded.url, asset.fileName ?? undefined),
      );
    } catch (error) {
      Alert.alert(
        labels.videoErrorTitle ?? labels.imageErrorTitle ?? "",
        error instanceof Error
          ? error.message
          : (labels.videoErrorFallbackMessage ??
              labels.imageErrorFallbackMessage ??
              ""),
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <View style={containerStyle}>
      <View style={styles.toolbarWrapper}>
        <RichTextToolbar
          editorRef={editorRef}
          onPressAddImage={onUploadInlineImage ? pickAndInsertImage : undefined}
          onPressAddVideo={onUploadInlineVideo ? pickAndInsertVideo : undefined}
          mediaActionsDisabled={isBusy}
          onPressColor={openColorMenu}
          onPressHeading={applyHeading}
          onPressQuote={applyQuote}
          toolbarTestID={toolbarTestID}
          quickToolsTestID={quickToolsTestID}
          colorButtonTestID={colorButtonTestID}
          headingButtonTestID={headingButtonTestID}
          quoteButtonTestID={quoteButtonTestID}
          videoButtonTestID={videoButtonTestID}
        />
      </View>
      {isColorPickerOpen ? (
        <ColorPickerPanel
          presets={mergedColorPresets}
          onSelect={applyColor}
          onClose={closeColorMenu}
          title={labels.colorMenuTitle}
          message={labels.colorMenuMessage}
          closeAccessibilityLabel={labels.cancel}
        />
      ) : null}
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
      <View style={[styles.editorArea, { minHeight }]}>
        <RichEditor
          ref={editorRef}
          initialContentHTML={initialHtml}
          initialHeight={minHeight}
          placeholder={
            isBusy && insertingPlaceholder ? insertingPlaceholder : placeholder
          }
          style={[styles.editor, { height: editorHeight }]}
          editorStyle={{
            backgroundColor: editorBackgroundColor,
            color: editorTextColor,
            placeholderColor: colors.textSecondary,
            contentCSSText:
              contentCSSText ??
              "font-size: 15px; line-height: 1.6; padding: 12px 0;",
            cssText:
              cssText ??
              "img { max-width: 100%; height: auto; display: block; margin: 8px 0; }",
          }}
          onChange={handleChange}
          onHeightChange={(height) =>
            setEditorHeight(Math.max(minHeight, height))
          }
          onMessage={handleEditorMessage}
          editorInitializedCallback={injectImageClickHandler}
          useContainer
          testID={editorTestID}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  toolbarWrapper: {
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  editorArea: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  editor: {
    backgroundColor: "transparent",
  },
});
