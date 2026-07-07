import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { helpFaqsApi } from "../../api/help-faqs.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { extractApiError } from "../../utils/api-error";
import type {
  HelpFaq,
  HelpFaqAudience,
  HelpFaqSourceWithThemes,
} from "../../types/help-faqs.types";
import {
  RichEditorField,
  type RichEditorFieldRef,
} from "../editor/RichEditorField";

const faqSchema = z.object({
  title: z.string().min(3, "Titre requis"),
  audience: z.enum(["PARENT", "TEACHER", "STUDENT", "SCHOOL_ADMIN", "STAFF"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  description: z.string().max(300, "300 caractères max").optional(),
});

const themeSchema = z.object({
  title: z.string().min(3, "Titre requis"),
  orderIndex: z.number().int().min(0),
  description: z.string().max(300, "300 caractères max").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

const itemSchema = z.object({
  question: z.string().min(6, "Question requise"),
  orderIndex: z.number().int().min(0),
  answerHtml: z.string().min(1, "Réponse requise"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type FaqFormValues = z.infer<typeof faqSchema>;
type ThemeFormValues = z.infer<typeof themeSchema>;
type ItemFormValues = z.infer<typeof itemSchema>;

const AUDIENCES: HelpFaqAudience[] = [
  "PARENT",
  "TEACHER",
  "STUDENT",
  "SCHOOL_ADMIN",
  "STAFF",
];

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

type Props = {
  onDone: () => void;
};

export function AssistanceFaqAdminForms({ onDone }: Props) {
  const editorRef = useRef<RichEditorFieldRef>(null);
  const { showSuccess, showError } = useSuccessToastStore();

  const [adminMode, setAdminMode] = useState<"GLOBAL" | "SCHOOL" | null>(null);
  const [schoolScope, setSchoolScope] = useState<{
    schoolId: string;
    schoolName: string;
  } | null>(null);
  const [sources, setSources] = useState<HelpFaqSourceWithThemes[]>([]);
  const [adminFaqs, setAdminFaqs] = useState<HelpFaq[]>([]);
  const [editableFaqId, setEditableFaqId] = useState<string | null>(null);
  const [editableThemeId, setEditableThemeId] = useState<string | null>(null);
  const [editableItemId, setEditableItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingFaq, setSavingFaq] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const faqForm = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      audience: "PARENT",
      status: "DRAFT",
      description: "",
    },
  });

  const themeForm = useForm<ThemeFormValues>({
    resolver: zodResolver(themeSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      orderIndex: 0,
      description: "",
      status: "DRAFT",
    },
  });

  const itemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    mode: "onChange",
    defaultValues: {
      question: "",
      orderIndex: 0,
      answerHtml: "",
      status: "DRAFT",
    },
  });

  const editableSource = useMemo(
    () => sources.find((source) => source.faq.id === editableFaqId) ?? null,
    [editableFaqId, sources],
  );
  const editableTheme = useMemo(
    () =>
      editableSource?.themes.find((theme) => theme.id === editableThemeId) ??
      null,
    [editableSource, editableThemeId],
  );
  const editableItem = useMemo(
    () =>
      editableTheme?.items.find((item) => item.id === editableItemId) ?? null,
    [editableTheme, editableItemId],
  );

  async function loadFaqData() {
    setLoading(true);
    try {
      const current = await helpFaqsApi.getCurrent();
      const themesResponse = await helpFaqsApi.getThemes();
      const mode = current.permissions.canManageGlobal
        ? "GLOBAL"
        : current.permissions.canManageSchool
          ? "SCHOOL"
          : null;
      setAdminMode(mode);
      setSchoolScope(current.schoolScope);
      setSources(themesResponse.sources);

      const admin =
        mode === "GLOBAL"
          ? await helpFaqsApi.listGlobalAdmin()
          : mode === "SCHOOL"
            ? await helpFaqsApi.listSchoolAdmin()
            : { items: [] };
      setAdminFaqs(admin.items);
      setEditableFaqId((current) => current ?? admin.items[0]?.id ?? null);
    } catch (loadError) {
      showError({ title: "Erreur", message: extractApiError(loadError) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFaqData();
  }, []);

  useEffect(() => {
    if (!editableSource) {
      faqForm.reset({
        title: "",
        audience: "PARENT",
        status: "DRAFT",
        description: "",
      });
      return;
    }
    faqForm.reset({
      title: editableSource.faq.title,
      audience: editableSource.faq.audience,
      status: editableSource.faq.status,
      description: editableSource.faq.description ?? "",
    });
  }, [editableSource, faqForm]);

  useEffect(() => {
    if (!editableTheme) {
      themeForm.reset({
        title: "",
        orderIndex: editableSource?.themes.length ?? 0,
        description: "",
        status: "DRAFT",
      });
      return;
    }
    themeForm.reset({
      title: editableTheme.title,
      orderIndex: editableTheme.orderIndex,
      description: editableTheme.description ?? "",
      status: editableTheme.status,
    });
  }, [editableSource, editableTheme, themeForm]);

  useEffect(() => {
    if (!editableItem) {
      itemForm.reset({
        question: "",
        orderIndex: editableTheme?.items.length ?? 0,
        answerHtml: "",
        status: "DRAFT",
      });
      editorRef.current?.clear();
      return;
    }
    itemForm.reset({
      question: editableItem.question,
      orderIndex: editableItem.orderIndex,
      answerHtml: editableItem.answerHtml,
      status: editableItem.status,
    });
    editorRef.current?.setContentHtml(editableItem.answerHtml);
  }, [editableItem, editableTheme, itemForm]);

  async function saveFaq(values: FaqFormValues) {
    setSavingFaq(true);
    try {
      const saved = editableFaqId
        ? adminMode === "SCHOOL"
          ? await helpFaqsApi.updateSchoolFaq(editableFaqId, {
              title: values.title,
              audience: values.audience,
              status: values.status,
              description: values.description?.trim() || "",
            })
          : await helpFaqsApi.updateGlobalFaq(editableFaqId, {
              title: values.title,
              audience: values.audience,
              status: values.status,
              description: values.description?.trim() || "",
            })
        : adminMode === "SCHOOL"
          ? await helpFaqsApi.createSchoolFaq({
              title: values.title,
              audience: values.audience,
              status: values.status,
              description: values.description?.trim() || "",
            })
          : await helpFaqsApi.createGlobalFaq({
              title: values.title,
              audience: values.audience,
              status: values.status,
              description: values.description?.trim() || "",
            });
      setEditableFaqId(saved.id);
      await loadFaqData();
      showSuccess({
        title: editableFaqId ? "FAQ mise à jour" : "FAQ créée",
        message: `« ${saved.title} » a été enregistrée.`,
      });
    } catch (saveError) {
      showError({ title: "Erreur", message: extractApiError(saveError) });
    } finally {
      setSavingFaq(false);
    }
  }

  async function saveTheme(values: ThemeFormValues) {
    if (!editableFaqId) {
      showError({ title: "Erreur", message: "Aucune FAQ sélectionnée." });
      return;
    }
    setSavingTheme(true);
    try {
      const saved = editableTheme
        ? adminMode === "SCHOOL"
          ? await helpFaqsApi.updateSchoolTheme(editableTheme.id, {
              title: values.title,
              orderIndex: values.orderIndex,
              description: values.description?.trim() || "",
              status: values.status,
            })
          : await helpFaqsApi.updateGlobalTheme(editableTheme.id, {
              title: values.title,
              orderIndex: values.orderIndex,
              description: values.description?.trim() || "",
              status: values.status,
            })
        : adminMode === "SCHOOL"
          ? await helpFaqsApi.createSchoolTheme(editableFaqId, {
              title: values.title,
              orderIndex: values.orderIndex,
              description: values.description?.trim() || "",
              status: values.status,
            })
          : await helpFaqsApi.createGlobalTheme(editableFaqId, {
              title: values.title,
              orderIndex: values.orderIndex,
              description: values.description?.trim() || "",
              status: values.status,
            });
      setEditableThemeId(saved.id);
      await loadFaqData();
      showSuccess({
        title: editableTheme ? "Thème mis à jour" : "Thème créé",
        message: `« ${saved.title} » a été enregistré.`,
      });
    } catch (saveError) {
      showError({ title: "Erreur", message: extractApiError(saveError) });
    } finally {
      setSavingTheme(false);
    }
  }

  async function saveItem(values: ItemFormValues) {
    if (!editableTheme) {
      showError({ title: "Erreur", message: "Aucun thème sélectionné." });
      return;
    }
    setSavingItem(true);
    try {
      const payload = {
        question: values.question,
        orderIndex: values.orderIndex,
        answerHtml: values.answerHtml,
        answerJson: { html: values.answerHtml },
        status: values.status,
      };
      const saved = editableItem
        ? adminMode === "SCHOOL"
          ? await helpFaqsApi.updateSchoolItem(editableItem.id, payload)
          : await helpFaqsApi.updateGlobalItem(editableItem.id, payload)
        : adminMode === "SCHOOL"
          ? await helpFaqsApi.createSchoolItem(editableTheme.id, payload)
          : await helpFaqsApi.createGlobalItem(editableTheme.id, payload);
      setEditableItemId(saved.id);
      await loadFaqData();
      showSuccess({
        title: editableItem ? "Question mise à jour" : "Question créée",
        message: `« ${saved.question} » a été enregistrée.`,
      });
    } catch (saveError) {
      showError({ title: "Erreur", message: extractApiError(saveError) });
    } finally {
      setSavingItem(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading} testID="assistance-faq-admin-loading">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="assistance-faq-admin-forms-mobile"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.adminModeTitle}>
          {adminMode === "GLOBAL"
            ? "Administration FAQ Scolive"
            : `Administration FAQ de ${schoolScope?.schoolName ?? "l'école"}`}
        </Text>

        {adminFaqs.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.adminFaqsRow}>
              {adminFaqs.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.adminFaqChip,
                    editableFaqId === entry.id && styles.adminFaqChipActive,
                  ]}
                  onPress={() => {
                    setEditableFaqId(entry.id);
                    const source = sources.find(
                      (item) => item.faq.id === entry.id,
                    );
                    setEditableThemeId(source?.themes[0]?.id ?? null);
                    setEditableItemId(source?.themes[0]?.items[0]?.id ?? null);
                  }}
                  testID={`assistance-faq-admin-select-${entry.id}`}
                >
                  <Text
                    style={[
                      styles.adminFaqChipLabel,
                      editableFaqId === entry.id &&
                        styles.adminFaqChipLabelActive,
                    ]}
                  >
                    {entry.schoolName ?? "Scolive"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : null}

        <Text style={styles.adminSectionTitle}>
          {adminMode === "GLOBAL" ? "FAQ Scolive" : "FAQ école"}
        </Text>
        <Controller
          control={faqForm.control}
          name="title"
          render={({ field: { onChange, value }, fieldState }) => (
            <>
              <TextInput
                style={[styles.input, fieldState.error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Titre de la FAQ"
                placeholderTextColor={colors.textSecondary}
                testID="assistance-faq-admin-faq-title"
              />
              {fieldState.error ? (
                <Text style={styles.fieldError}>
                  {fieldState.error.message}
                </Text>
              ) : null}
            </>
          )}
        />
        <Controller
          control={faqForm.control}
          name="audience"
          render={({ field: { onChange, value } }) => (
            <View style={styles.chipsWrap}>
              {AUDIENCES.map((entry) => (
                <TouchableOpacity
                  key={entry}
                  style={[styles.chip, value === entry && styles.chipActive]}
                  onPress={() => onChange(entry)}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      value === entry && styles.chipLabelActive,
                    ]}
                  >
                    {entry}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        <Controller
          control={faqForm.control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <View style={styles.chipsWrap}>
              {STATUSES.map((entry) => (
                <TouchableOpacity
                  key={entry}
                  style={[styles.chip, value === entry && styles.chipActive]}
                  onPress={() => onChange(entry)}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      value === entry && styles.chipLabelActive,
                    ]}
                  >
                    {entry}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        <Controller
          control={faqForm.control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              value={value}
              onChangeText={onChange}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              testID="assistance-faq-admin-faq-description"
            />
          )}
        />
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={faqForm.handleSubmit((values) => void saveFaq(values))}
          disabled={savingFaq}
          testID="assistance-faq-admin-faq-submit"
        >
          <Text style={styles.primaryBtnLabel}>
            {editableFaqId ? "Mettre à jour" : "Créer"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.adminSectionTitle}>Thème</Text>
        <Controller
          control={themeForm.control}
          name="title"
          render={({ field: { onChange, value }, fieldState }) => (
            <>
              <TextInput
                style={[styles.input, fieldState.error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Titre du thème"
                placeholderTextColor={colors.textSecondary}
                testID="assistance-faq-admin-theme-title"
              />
              {fieldState.error ? (
                <Text style={styles.fieldError}>
                  {fieldState.error.message}
                </Text>
              ) : null}
            </>
          )}
        />
        <Controller
          control={themeForm.control}
          name="orderIndex"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(value)}
              onChangeText={(text) => onChange(Number(text || 0))}
              testID="assistance-faq-admin-theme-order"
            />
          )}
        />
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={themeForm.handleSubmit((values) => void saveTheme(values))}
          disabled={savingTheme}
          testID="assistance-faq-admin-theme-submit"
        >
          <Text style={styles.primaryBtnLabel}>
            {editableThemeId ? "Mettre à jour" : "Créer"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.adminSectionTitle}>Question / Réponse</Text>
        <Controller
          control={itemForm.control}
          name="question"
          render={({ field: { onChange, value }, fieldState }) => (
            <>
              <TextInput
                style={[styles.input, fieldState.error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Question"
                placeholderTextColor={colors.textSecondary}
                testID="assistance-faq-admin-item-question"
              />
              {fieldState.error ? (
                <Text style={styles.fieldError}>
                  {fieldState.error.message}
                </Text>
              ) : null}
            </>
          )}
        />
        <Controller
          control={itemForm.control}
          name="orderIndex"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(value)}
              onChangeText={(text) => onChange(Number(text || 0))}
              testID="assistance-faq-admin-item-order"
            />
          )}
        />
        <Controller
          control={itemForm.control}
          name="answerHtml"
          render={({ field: { onChange }, fieldState }) => (
            <>
              <RichEditorField
                ref={editorRef}
                placeholder="Rédiger la réponse"
                onChangeHtml={onChange}
                colorPresets={[{ label: "Bleu", value: "#0C5FA8" }]}
                labels={{
                  colorMenuTitle: "Couleur du texte",
                  colorMenuMessage: "Choix rapide",
                  cancel: "Annuler",
                  permissionDeniedTitle: "Permission refusée",
                  permissionDeniedMessage: "Autorisez l'accès à la galerie.",
                  imageErrorTitle: "Image non ajoutée",
                  imageErrorFallbackMessage: "Impossible d'ajouter l'image.",
                }}
                onUploadInlineImage={(file) =>
                  helpFaqsApi.uploadInlineImage(file)
                }
                minHeight={180}
              />
              {fieldState.error ? (
                <Text style={styles.fieldError}>
                  {fieldState.error.message}
                </Text>
              ) : null}
            </>
          )}
        />
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={itemForm.handleSubmit((values) => void saveItem(values))}
          disabled={savingItem}
          testID="assistance-faq-admin-item-submit"
        >
          <Text style={styles.primaryBtnLabel}>
            {editableItemId ? "Mettre à jour" : "Créer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={onDone}
          testID="assistance-faq-admin-done"
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
  adminFaqsRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  adminFaqChip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  adminFaqChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  adminFaqChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  adminFaqChipLabelActive: { color: colors.white },
  adminModeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.notification },
  textarea: { minHeight: 92, textAlignVertical: "top" },
  fieldError: { marginTop: -4, fontSize: 12, color: colors.notification },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  chipLabelActive: { color: colors.white },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 13,
  },
  primaryBtnLabel: { fontSize: 14, fontWeight: "800", color: colors.white },
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
