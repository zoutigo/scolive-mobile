import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { RichEditor } from "react-native-pell-rich-editor";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { helpGuidesApi } from "../../api/help-guides.api";
import type {
  HelpChapterItem,
  HelpGuideAudience,
  HelpGuideItem,
  HelpPlanNode,
} from "../../types/help-guides.types";
import { RichTextToolbar } from "../editor/RichTextToolbar";

const guideSchema = z.object({
  title: z.string().min(3, "Titre requis"),
  audience: z.enum(["PARENT", "TEACHER", "STUDENT", "SCHOOL_ADMIN", "STAFF"]),
});

const chapterSchema = z
  .object({
    title: z.string().min(3, "Titre requis"),
    contentType: z.enum(["RICH_TEXT", "VIDEO"]),
    contentHtml: z.string().optional(),
    videoUrl: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contentType === "RICH_TEXT" && !value.contentHtml?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentHtml"],
        message: "Contenu requis",
      });
    }
    if (value.contentType === "VIDEO" && !value.videoUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["videoUrl"],
        message: "URL vidéo requise",
      });
    }
  });

type GuideFormValues = z.infer<typeof guideSchema>;
type ChapterFormValues = z.infer<typeof chapterSchema>;
type GuideViewMode = "plan" | "content";

function flattenPlan(nodes: HelpPlanNode[]): HelpPlanNode[] {
  const result: HelpPlanNode[] = [];
  function walk(items: HelpPlanNode[]) {
    items.forEach((item) => {
      result.push(item);
      walk(item.children);
    });
  }
  walk(nodes);
  return result;
}

type AssistanceGuidePanelProps = {
  canManageOverride?: boolean;
};

export function AssistanceGuidePanel({
  canManageOverride = true,
}: AssistanceGuidePanelProps) {
  const editorRef = useRef<RichEditor>(null);
  const [canManage, setCanManage] = useState(false);
  const [guide, setGuide] = useState<HelpGuideItem | null>(null);
  const [plan, setPlan] = useState<HelpPlanNode[]>([]);
  const [chapter, setChapter] = useState<HelpChapterItem | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<HelpChapterItem[]>([]);
  const [expandedChapterIds, setExpandedChapterIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<GuideViewMode>("plan");
  const [adminGuides, setAdminGuides] = useState<HelpGuideItem[]>([]);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInsertingMedia, setIsInsertingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guideForm = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      audience: "PARENT",
    },
  });

  const chapterForm = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      contentType: "RICH_TEXT",
      contentHtml: "",
      videoUrl: "",
    },
  });

  async function load(guideId?: string) {
    setLoading(true);
    setError(null);
    try {
      const current = await helpGuidesApi.getCurrent({
        ...(guideId ? { guideId } : {}),
      });
      const effectiveCanManage = current.canManage && canManageOverride;
      setCanManage(effectiveCanManage);
      setGuide(current.guide);
      const resolvedGuideId = guideId ?? current.guide?.id ?? null;
      setActiveGuideId(resolvedGuideId);

      const planResponse = await helpGuidesApi.getPlan({
        ...(resolvedGuideId ? { guideId: resolvedGuideId } : {}),
      });
      setPlan(planResponse.items);
      setExpandedChapterIds([]);
      setViewMode("plan");

      const first = flattenPlan(planResponse.items)[0];
      if (first) {
        const detail = await helpGuidesApi.getChapter(first.id, {
          ...(resolvedGuideId ? { guideId: resolvedGuideId } : {}),
        });
        setChapter(detail.chapter);
      } else {
        setChapter(null);
      }

      if (effectiveCanManage) {
        const adminList = await helpGuidesApi.listAdmin();
        setAdminGuides(adminList.items);
      } else {
        setAdminGuides([]);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Erreur de chargement",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [canManageOverride]);

  async function openChapter(chapterId: string) {
    try {
      const response = await helpGuidesApi.getChapter(chapterId, {
        ...(activeGuideId ? { guideId: activeGuideId } : {}),
      });
      setChapter(response.chapter);
      setViewMode("content");
    } catch (chapterError) {
      setError(
        chapterError instanceof Error
          ? chapterError.message
          : "Chapitre introuvable",
      );
    }
  }

  async function runSearch() {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    try {
      const response = await helpGuidesApi.search(search.trim(), {
        ...(activeGuideId ? { guideId: activeGuideId } : {}),
      });
      setResults(response.items);
      setViewMode("plan");
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Recherche impossible",
      );
    }
  }

  function toggleChapter(chapterId: string) {
    setExpandedChapterIds((current) =>
      current.includes(chapterId)
        ? current.filter((id) => id !== chapterId)
        : [...current, chapterId],
    );
  }

  async function createGuide(values: GuideFormValues) {
    setSaving(true);
    setError(null);
    try {
      const created = await helpGuidesApi.createGuide({
        title: values.title,
        audience: values.audience,
      });
      guideForm.reset({ title: "", audience: values.audience });
      await load(created.id);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Création impossible",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createChapter(values: ChapterFormValues) {
    if (!activeGuideId) {
      setError("Aucun guide sélectionné");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await helpGuidesApi.createChapter(activeGuideId, {
        title: values.title,
        contentType: values.contentType,
        contentHtml:
          values.contentType === "RICH_TEXT"
            ? values.contentHtml?.trim()
            : undefined,
        contentJson:
          values.contentType === "RICH_TEXT" && values.contentHtml?.trim()
            ? { html: values.contentHtml }
            : undefined,
        videoUrl:
          values.contentType === "VIDEO" ? values.videoUrl?.trim() : undefined,
      });
      chapterForm.reset({
        title: "",
        contentType: "RICH_TEXT",
        contentHtml: "",
        videoUrl: "",
      });
      editorRef.current?.setContentHTML("");
      await load(activeGuideId);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Création impossible",
      );
    } finally {
      setSaving(false);
    }
  }

  function openTextColorMenu() {
    Alert.alert("Couleur du texte", "Choisissez une couleur", [
      {
        text: "Bleu profond",
        onPress: () => editorRef.current?.setForeColor("#0C5FA8"),
      },
      {
        text: "Vert école",
        onPress: () => editorRef.current?.setForeColor("#217346"),
      },
      {
        text: "Rouge alerte",
        onPress: () => editorRef.current?.setForeColor("#B42318"),
      },
      {
        text: "Noir",
        onPress: () => editorRef.current?.setForeColor("#1B1F23"),
      },
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
    setIsInsertingMedia(true);
    try {
      const response = await helpGuidesApi.uploadInlineImage({
        uri: asset.uri,
        name: asset.fileName ?? `guide-inline-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
      editorRef.current?.insertImage(response.url);
    } catch (insertError) {
      Alert.alert(
        "Image non ajoutée",
        insertError instanceof Error
          ? insertError.message
          : "Impossible d'ajouter l'image.",
      );
    } finally {
      setIsInsertingMedia(false);
    }
  }

  function insertInlineVideoTag(videoUrl: string, title?: string) {
    const safeUrl = videoUrl.replace(/'/g, "\\'");
    const safeTitle = (title ?? "Vidéo").replace(/'/g, "\\'");
    editorRef.current?.command(`
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
    `);
  }

  async function insertInlineVideoFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la galerie.");
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
    setIsInsertingMedia(true);
    try {
      const response = await helpGuidesApi.uploadInlineVideo({
        uri: asset.uri,
        name: asset.fileName ?? `guide-inline-${Date.now()}.mp4`,
        mimeType: asset.mimeType ?? "video/mp4",
      });
      insertInlineVideoTag(response.url, asset.fileName ?? undefined);
    } catch (insertError) {
      Alert.alert(
        "Vidéo non ajoutée",
        insertError instanceof Error
          ? insertError.message
          : "Impossible d'ajouter la vidéo.",
      );
    } finally {
      setIsInsertingMedia(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading} testID="assistance-guide-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.containerContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      testID="assistance-guide-panel"
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>{guide?.title ?? "Guide utilisateur"}</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un chapitre"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => void runSearch()}
          >
            <Ionicons name="search" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {canManage ? (
          <View style={styles.adminSwitchRow}>
            {adminGuides.slice(0, 4).map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.adminChip,
                  entry.id === activeGuideId && styles.adminChipActive,
                ]}
                onPress={() => void load(entry.id)}
              >
                <Text
                  style={[
                    styles.adminChipLabel,
                    entry.id === activeGuideId && styles.adminChipLabelActive,
                  ]}
                >
                  {entry.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.bodyRow}>
        {viewMode === "plan" ? (
          <View style={styles.planCard}>
            {results.length > 0
              ? results.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.planItem,
                      chapter?.id === item.id && styles.planItemActive,
                    ]}
                    onPress={() => void openChapter(item.id)}
                  >
                    <Text
                      style={[
                        styles.planItemLabel,
                        chapter?.id === item.id && styles.planItemLabelActive,
                      ]}
                    >
                      {item.breadcrumb?.join(" > ") ?? item.title}
                    </Text>
                  </TouchableOpacity>
                ))
              : plan.map((root) => {
                  const isExpanded = expandedChapterIds.includes(root.id);
                  const hasChildren = root.children.length > 0;
                  return (
                    <View key={root.id}>
                      <TouchableOpacity
                        style={[styles.planItem, styles.planRootItem]}
                        onPress={() => {
                          if (hasChildren) {
                            toggleChapter(root.id);
                            return;
                          }
                          void openChapter(root.id);
                        }}
                      >
                        <Text style={styles.planItemLabel}>{root.title}</Text>
                        {hasChildren ? (
                          <Ionicons
                            name={
                              isExpanded
                                ? "chevron-up-outline"
                                : "chevron-down-outline"
                            }
                            size={16}
                            color={colors.textSecondary}
                          />
                        ) : null}
                      </TouchableOpacity>
                      {isExpanded
                        ? root.children.map((child) => (
                            <TouchableOpacity
                              key={child.id}
                              style={[
                                styles.planItem,
                                styles.planChildItem,
                                chapter?.id === child.id &&
                                  styles.planItemActive,
                              ]}
                              onPress={() => void openChapter(child.id)}
                            >
                              <Text
                                style={[
                                  styles.planItemLabel,
                                  chapter?.id === child.id &&
                                    styles.planItemLabelActive,
                                ]}
                              >
                                {child.title}
                              </Text>
                            </TouchableOpacity>
                          ))
                        : null}
                    </View>
                  );
                })}
          </View>
        ) : (
          <View style={styles.contentCard}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setViewMode("plan")}
              testID="assistance-guide-back-to-plan-mobile"
            >
              <Ionicons
                name="arrow-back-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.backBtnLabel}>Retour au plan</Text>
            </TouchableOpacity>
            {chapter ? (
              <>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                {chapter.summary ? (
                  <Text style={styles.chapterSummary}>{chapter.summary}</Text>
                ) : null}
                {chapter.contentType === "VIDEO" ? (
                  <TouchableOpacity
                    style={styles.videoBtn}
                    onPress={() => {
                      if (chapter.videoUrl) {
                        void Linking.openURL(chapter.videoUrl);
                      }
                    }}
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={16}
                      color={colors.white}
                    />
                    <Text style={styles.videoBtnLabel}>Ouvrir la vidéo</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.chapterText}>
                    {chapter.contentText || "Contenu riche disponible"}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.empty}>Sélectionnez un chapitre</Text>
            )}
          </View>
        )}
      </View>

      {canManage ? (
        <View
          style={styles.adminForms}
          testID="assistance-guide-admin-forms-mobile"
        >
          <Text style={styles.adminTitle}>Créer un guide</Text>
          <Controller
            control={guideForm.control}
            name="title"
            render={({ field: { onChange, value }, fieldState }) => (
              <>
                <TextInput
                  style={[styles.input, fieldState.error && styles.inputError]}
                  placeholder="Titre du guide"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                />
                {fieldState.error ? (
                  <Text style={styles.error}>{fieldState.error.message}</Text>
                ) : null}
              </>
            )}
          />

          <Controller
            control={guideForm.control}
            name="audience"
            render={({ field: { onChange, value } }) => (
              <View style={styles.audienceRow}>
                {(
                  [
                    "PARENT",
                    "TEACHER",
                    "STUDENT",
                    "SCHOOL_ADMIN",
                    "STAFF",
                  ] as HelpGuideAudience[]
                ).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.audienceChip,
                      value === item && styles.audienceChipActive,
                    ]}
                    onPress={() => onChange(item)}
                  >
                    <Text
                      style={[
                        styles.audienceChipLabel,
                        value === item && styles.audienceChipLabelActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={guideForm.handleSubmit(
              (values) => void createGuide(values),
            )}
            disabled={!guideForm.formState.isValid || saving}
          >
            <Text style={styles.primaryBtnLabel}>Créer guide</Text>
          </TouchableOpacity>

          <Text style={styles.adminTitle}>Créer un chapitre</Text>
          <Controller
            control={chapterForm.control}
            name="title"
            render={({ field: { onChange, value }, fieldState }) => (
              <>
                <TextInput
                  style={[styles.input, fieldState.error && styles.inputError]}
                  placeholder="Titre du chapitre"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                />
                {fieldState.error ? (
                  <Text style={styles.error}>{fieldState.error.message}</Text>
                ) : null}
              </>
            )}
          />

          <Controller
            control={chapterForm.control}
            name="contentType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.audienceRow}>
                {(["RICH_TEXT", "VIDEO"] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.audienceChip,
                      value === item && styles.audienceChipActive,
                    ]}
                    onPress={() => onChange(item)}
                  >
                    <Text
                      style={[
                        styles.audienceChipLabel,
                        value === item && styles.audienceChipLabelActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {chapterForm.watch("contentType") === "VIDEO" ? (
            <Controller
              control={chapterForm.control}
              name="videoUrl"
              render={({ field: { onChange, value }, fieldState }) => (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      fieldState.error && styles.inputError,
                    ]}
                    placeholder="https://..."
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                  />
                  {fieldState.error ? (
                    <Text style={styles.error}>{fieldState.error.message}</Text>
                  ) : null}
                </>
              )}
            />
          ) : (
            <Controller
              control={chapterForm.control}
              name="contentHtml"
              render={({ field: { onChange, value }, fieldState }) => (
                <>
                  <View style={styles.editorShell}>
                    <RichTextToolbar
                      editorRef={editorRef}
                      onPressAddImage={() => {
                        void insertInlineImageFromGallery();
                      }}
                      onPressAddVideo={() => {
                        void insertInlineVideoFromGallery();
                      }}
                      onPressColor={openTextColorMenu}
                      onPressHeading={applyHeading}
                      onPressQuote={applyQuote}
                    />
                    {isInsertingMedia ? (
                      <View style={styles.editorBanner}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                        <Text style={styles.editorBannerLabel}>
                          Insertion du média…
                        </Text>
                      </View>
                    ) : null}
                    <RichEditor
                      ref={editorRef}
                      style={styles.richEditor}
                      editorStyle={{
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                        placeholderColor: colors.textSecondary,
                        contentCSSText: `
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                          font-size: 14px;
                          line-height: 1.55;
                          padding: 12px;
                          min-height: 180px;
                        `,
                      }}
                      useContainer
                      initialFocus={false}
                      initialContentHTML={value ?? ""}
                      placeholder="Contenu du chapitre…"
                      onChange={onChange}
                      testID="assistance-guide-rich-editor-mobile"
                    />
                  </View>
                  {fieldState.error ? (
                    <Text style={styles.error}>{fieldState.error.message}</Text>
                  ) : null}
                </>
              )}
            />
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={chapterForm.handleSubmit(
              (values) => void createChapter(values),
            )}
            disabled={!chapterForm.formState.isValid || saving}
          >
            <Text style={styles.primaryBtnLabel}>Créer chapitre</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerContent: {
    gap: 10,
    marginTop: 10,
    paddingBottom: 16,
  },
  loading: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCard: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 13,
  },
  searchBtn: {
    width: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  adminSwitchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  adminChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.warmSurface,
  },
  adminChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  adminChipLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  adminChipLabelActive: {
    color: colors.white,
  },
  bodyRow: {
    gap: 10,
  },
  planCard: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingVertical: 6,
  },
  planItem: {
    paddingVertical: 8,
    paddingRight: 10,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  planRootItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  planChildItem: {
    paddingLeft: 22,
  },
  planItemActive: {
    backgroundColor: colors.warmHighlight,
  },
  planItemLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  planItemLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  contentCard: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary + "10",
  },
  backBtnLabel: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  chapterSummary: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chapterText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  videoBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  videoBtnLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  adminForms: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8,
  },
  adminTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 13,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  editorShell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.warmSurface,
    padding: 8,
    gap: 8,
  },
  editorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + "35",
    backgroundColor: colors.primary + "12",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  editorBannerLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  richEditor: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.notification,
  },
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  audienceChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.warmSurface,
  },
  audienceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  audienceChipLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  audienceChipLabelActive: {
    color: colors.white,
  },
  primaryBtn: {
    marginTop: 2,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtnLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  error: {
    fontSize: 12,
    color: colors.notification,
  },
});
