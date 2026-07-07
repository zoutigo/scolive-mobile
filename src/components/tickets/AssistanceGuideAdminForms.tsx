import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { helpGuidesApi } from "../../api/help-guides.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { extractApiError } from "../../utils/api-error";
import type {
  HelpGuideAudience,
  HelpGuideItem,
} from "../../types/help-guides.types";
import {
  RichEditorField,
  type RichEditorFieldRef,
} from "../editor/RichEditorField";

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

const AUDIENCES: HelpGuideAudience[] = [
  "PARENT",
  "TEACHER",
  "STUDENT",
  "SCHOOL_ADMIN",
  "STAFF",
];

type Props = {
  onDone: () => void;
};

export function AssistanceGuideAdminForms({ onDone }: Props) {
  const editorRef = useRef<RichEditorFieldRef>(null);
  const { showSuccess, showError } = useSuccessToastStore();

  const [adminMode, setAdminMode] = useState<"GLOBAL" | "SCHOOL" | null>(null);
  const [schoolScope, setSchoolScope] = useState<{
    schoolId: string;
    schoolName: string;
  } | null>(null);
  const [adminGuides, setAdminGuides] = useState<HelpGuideItem[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingGuide, setSavingGuide] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);

  const guideForm = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    mode: "onChange",
    defaultValues: { title: "", audience: "PARENT" },
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

  async function load() {
    setLoading(true);
    try {
      const current = await helpGuidesApi.getCurrent();
      const mode = current.permissions.canManageGlobal
        ? "GLOBAL"
        : current.permissions.canManageSchool
          ? "SCHOOL"
          : null;
      setAdminMode(mode);
      setSchoolScope(current.schoolScope);
      const admin =
        mode === "GLOBAL"
          ? await helpGuidesApi.listGlobalAdmin()
          : mode === "SCHOOL"
            ? await helpGuidesApi.listSchoolAdmin()
            : { items: [] };
      setAdminGuides(admin.items);
      setSelectedGuideId((current) => current ?? admin.items[0]?.id ?? null);
    } catch (loadError) {
      showError({
        title: "Erreur",
        message: extractApiError(loadError),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createGuide(values: GuideFormValues) {
    setSavingGuide(true);
    try {
      const created =
        adminMode === "SCHOOL"
          ? await helpGuidesApi.createSchoolGuide({
              title: values.title,
              audience: values.audience,
            })
          : await helpGuidesApi.createGlobalGuide({
              title: values.title,
              audience: values.audience,
            });
      guideForm.reset({ title: "", audience: values.audience });
      setSelectedGuideId(created.id);
      await load();
      showSuccess({
        title: "Guide créé",
        message: `« ${created.title} » a été créé.`,
      });
    } catch (saveError) {
      showError({ title: "Erreur", message: extractApiError(saveError) });
    } finally {
      setSavingGuide(false);
    }
  }

  async function createChapter(values: ChapterFormValues) {
    if (!selectedGuideId) {
      showError({ title: "Erreur", message: "Aucun guide sélectionné." });
      return;
    }

    setSavingChapter(true);
    try {
      const payload = {
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
      };
      if (adminMode === "SCHOOL") {
        await helpGuidesApi.createSchoolChapter(selectedGuideId, payload);
      } else {
        await helpGuidesApi.createGlobalChapter(selectedGuideId, payload);
      }
      chapterForm.reset({
        title: "",
        contentType: "RICH_TEXT",
        contentHtml: "",
        videoUrl: "",
      });
      editorRef.current?.clear();
      await load();
      showSuccess({
        title: "Chapitre créé",
        message: `« ${values.title} » a été ajouté au guide.`,
      });
    } catch (saveError) {
      showError({ title: "Erreur", message: extractApiError(saveError) });
    } finally {
      setSavingChapter(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading} testID="assistance-guide-admin-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="assistance-guide-admin-forms-mobile"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          {adminMode === "SCHOOL"
            ? `Guide de ${schoolScope?.schoolName ?? "l'école"}`
            : "Guide Scolive"}
        </Text>

        {adminGuides.length > 0 ? (
          <View style={styles.adminSwitchRow}>
            {adminGuides.slice(0, 6).map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.adminChip,
                  entry.id === selectedGuideId && styles.adminChipActive,
                ]}
                onPress={() => setSelectedGuideId(entry.id)}
                testID={`assistance-guide-admin-select-${entry.id}`}
              >
                <Text
                  style={[
                    styles.adminChipLabel,
                    entry.id === selectedGuideId && styles.adminChipLabelActive,
                  ]}
                >
                  {entry.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.formLabel}>Créer un guide</Text>
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
                testID="assistance-guide-admin-guide-title"
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
              {AUDIENCES.map((item) => (
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
          onPress={guideForm.handleSubmit((values) => void createGuide(values))}
          disabled={savingGuide}
          testID="assistance-guide-admin-create-guide-submit"
        >
          <Text style={styles.primaryBtnLabel}>
            {savingGuide ? "Création…" : "Créer le guide"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Créer un chapitre</Text>
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
                testID="assistance-guide-admin-chapter-title"
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
                  style={[styles.input, fieldState.error && styles.inputError]}
                  placeholder="https://..."
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  testID="assistance-guide-admin-chapter-video-url"
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
                <RichEditorField
                  ref={editorRef}
                  initialHtml={value ?? ""}
                  onChangeHtml={onChange}
                  placeholder="Contenu du chapitre…"
                  insertingPlaceholder="Insertion du média…"
                  colorPresets={[
                    { label: "Bleu profond", value: "#0C5FA8" },
                    { label: "Vert école", value: "#217346" },
                    { label: "Rouge alerte", value: "#B42318" },
                    { label: "Noir", value: "#1B1F23" },
                  ]}
                  labels={{
                    colorMenuTitle: "Couleur du texte",
                    colorMenuMessage: "Choisissez une couleur",
                    cancel: "Annuler",
                    permissionDeniedTitle: "Permission refusée",
                    permissionDeniedMessage: "Autorisez l'accès à la galerie.",
                    imageErrorTitle: "Image non ajoutée",
                    imageErrorFallbackMessage: "Impossible d'ajouter l'image.",
                    videoErrorTitle: "Vidéo non ajoutée",
                    videoErrorFallbackMessage: "Impossible d'ajouter la vidéo.",
                  }}
                  onUploadInlineImage={(file) =>
                    helpGuidesApi.uploadInlineImage(file)
                  }
                  onUploadInlineVideo={(file) =>
                    helpGuidesApi.uploadInlineVideo(file)
                  }
                  minHeight={180}
                  contentCSSText="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.55; padding: 12px;"
                  editorTestID="assistance-guide-rich-editor-mobile"
                />
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
          disabled={savingChapter}
          testID="assistance-guide-admin-create-chapter-submit"
        >
          <Text style={styles.primaryBtnLabel}>
            {savingChapter ? "Création…" : "Créer le chapitre"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={onDone}
          testID="assistance-guide-admin-done"
        >
          <Text style={styles.doneBtnLabel}>Terminé</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  formsKeyboardArea: { flex: 1 },
  formScroll: { flex: 1 },
  formScrollContent: { padding: 16, gap: 10, paddingBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  adminSwitchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  adminChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.warmSurface,
  },
  adminChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  adminChipLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  adminChipLabelActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  inputError: { borderColor: colors.notification },
  audienceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  audienceChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
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
  audienceChipLabelActive: { color: colors.white },
  primaryBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  error: {
    fontSize: 12,
    color: colors.notification,
  },
  formActionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  doneBtn: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    alignItems: "center",
  },
  doneBtnLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});
