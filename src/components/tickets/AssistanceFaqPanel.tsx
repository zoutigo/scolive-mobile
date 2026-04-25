import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RichEditor } from "react-native-pell-rich-editor";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { helpFaqsApi } from "../../api/help-faqs.api";
import type {
  HelpFaq,
  HelpFaqAudience,
  HelpFaqItem,
  HelpFaqScopeType,
  HelpFaqSourceWithThemes,
  HelpFaqTheme,
  HelpPublicationStatus,
} from "../../types/help-faqs.types";
import { RichTextToolbar } from "../editor/RichTextToolbar";

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
type ViewFilter = "all" | "GLOBAL" | "SCHOOL";
type ViewMode = "themes" | "content";

type SearchItem = HelpFaqItem & {
  faqId: string;
  sourceKey: string;
  scopeType: HelpFaqScopeType;
  scopeLabel: string;
  schoolId: string | null;
  schoolName: string | null;
  themeTitle?: string;
};

type DecoratedTheme = HelpFaqTheme & {
  sourceKey: string;
  scopeType: HelpFaqScopeType;
  scopeLabel: string;
};

const AUDIENCES: HelpFaqAudience[] = [
  "PARENT",
  "TEACHER",
  "STUDENT",
  "SCHOOL_ADMIN",
  "STAFF",
];

const STATUSES: HelpPublicationStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type Props = {
  canManageOverride?: boolean;
};

export function AssistanceFaqPanel({ canManageOverride = true }: Props) {
  const editorRef = useRef<RichEditor>(null);
  const [permissions, setPermissions] = useState({
    canManageGlobal: false,
    canManageSchool: false,
  });
  const [schoolScope, setSchoolScope] = useState<{
    schoolId: string;
    schoolName: string;
  } | null>(null);
  const [sources, setSources] = useState<HelpFaqSourceWithThemes[]>([]);
  const [adminFaqs, setAdminFaqs] = useState<HelpFaq[]>([]);
  const [editableFaqId, setEditableFaqId] = useState<string | null>(null);
  const [editableThemeId, setEditableThemeId] = useState<string | null>(null);
  const [editableItemId, setEditableItemId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<ViewFilter>("all");
  const [activeThemeKey, setActiveThemeKey] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("themes");
  const [loading, setLoading] = useState(true);
  const [savingFaq, setSavingFaq] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const decoratedThemes = useMemo<DecoratedTheme[]>(() => {
    return sources
      .filter((source) =>
        selectedFilter === "all" ? true : source.scopeType === selectedFilter,
      )
      .flatMap((source) =>
        source.themes.map((theme) => ({
          ...theme,
          sourceKey: source.key,
          scopeType: source.scopeType,
          scopeLabel: source.scopeLabel,
        })),
      );
  }, [selectedFilter, sources]);

  const activeTheme = useMemo(
    () =>
      decoratedThemes.find(
        (theme) => `${theme.sourceKey}:${theme.id}` === activeThemeKey,
      ) ??
      decoratedThemes[0] ??
      null,
    [activeThemeKey, decoratedThemes],
  );

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
  const adminMode = permissions.canManageGlobal
    ? "GLOBAL"
    : permissions.canManageSchool
      ? "SCHOOL"
      : null;

  async function loadFaqData() {
    setLoading(true);
    setError(null);
    try {
      const current = await helpFaqsApi.getCurrent();
      const themesResponse = await helpFaqsApi.getThemes();
      const nextPermissions = {
        canManageGlobal:
          current.permissions.canManageGlobal && canManageOverride,
        canManageSchool:
          current.permissions.canManageSchool && canManageOverride,
      };
      setPermissions(nextPermissions);
      setSchoolScope(current.schoolScope);
      setSources(themesResponse.sources);

      if (themesResponse.sources[0]?.themes[0]) {
        const first = themesResponse.sources[0].themes[0];
        setActiveThemeKey(`${themesResponse.sources[0].key}:${first.id}`);
        setExpandedItemIds(first.items[0] ? [first.items[0].id] : []);
      } else {
        setActiveThemeKey(null);
        setExpandedItemIds([]);
      }

      if (nextPermissions.canManageGlobal) {
        const admin = await helpFaqsApi.listGlobalAdmin();
        setAdminFaqs(admin.items);
        setEditableFaqId(
          (currentFaqId) => currentFaqId ?? admin.items[0]?.id ?? null,
        );
      } else if (nextPermissions.canManageSchool) {
        const admin = await helpFaqsApi.listSchoolAdmin();
        setAdminFaqs(admin.items);
        setEditableFaqId(
          (currentFaqId) => currentFaqId ?? admin.items[0]?.id ?? null,
        );
      } else {
        setAdminFaqs([]);
        setEditableFaqId(null);
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
    void loadFaqData();
  }, [canManageOverride]);

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
      editorRef.current?.setContentHTML("");
      return;
    }
    itemForm.reset({
      question: editableItem.question,
      orderIndex: editableItem.orderIndex,
      answerHtml: editableItem.answerHtml,
      status: editableItem.status,
    });
    editorRef.current?.setContentHTML(editableItem.answerHtml);
  }, [editableItem, editableTheme, itemForm]);

  function toggleItem(itemId: string) {
    setExpandedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId],
    );
  }

  async function runSearch() {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const result = await helpFaqsApi.search(search.trim());
      setSearchResults(result.items);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Recherche impossible",
      );
    }
  }

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
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Enregistrement impossible",
      );
    } finally {
      setSavingFaq(false);
    }
  }

  async function saveTheme(values: ThemeFormValues) {
    if (!editableFaqId) {
      setError("Aucune FAQ sélectionnée");
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
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Enregistrement impossible",
      );
    } finally {
      setSavingTheme(false);
    }
  }

  async function saveItem(values: ItemFormValues) {
    if (!editableTheme) {
      setError("Aucun thème sélectionné");
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
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Enregistrement impossible",
      );
    } finally {
      setSavingItem(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <Text style={styles.loadingText}>Chargement de la FAQ…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="assistance-faq-panel-mobile"
    >
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons
            name="help-circle-outline"
            size={14}
            color={colors.primary}
          />
          <Text style={styles.heroBadgeLabel}>FAQ multi-sources</Text>
        </View>
        <Text style={styles.heroTitle}>
          Application et école au même endroit
        </Text>
        <Text style={styles.heroDescription}>
          Le parent, l’élève ou l’enseignant retrouve les réponses Scolive et
          les réponses propres à son établissement dans le même onglet.
        </Text>
        <View style={styles.filterRow}>
          {[
            { value: "all", label: "Toutes" },
            { value: "GLOBAL", label: "Scolive" },
            { value: "SCHOOL", label: "École" },
          ].map((entry) => (
            <TouchableOpacity
              key={entry.value}
              style={[
                styles.filterChip,
                selectedFilter === entry.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(entry.value as ViewFilter)}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  selectedFilter === entry.value &&
                    styles.filterChipLabelActive,
                ]}
              >
                {entry.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher dans l'app ou l'école"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            onSubmitEditing={() => void runSearch()}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => void runSearch()}
          >
            <Text style={styles.searchBtnLabel}>Chercher</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sources</Text>
        {sources
          .filter((source) =>
            selectedFilter === "all"
              ? true
              : source.scopeType === selectedFilter,
          )
          .map((source) => (
            <View key={source.key} style={styles.sourceCard}>
              <Text style={styles.sourceBadge}>{source.scopeLabel}</Text>
              <Text style={styles.sourceTitle}>{source.faq.title}</Text>
              <Text style={styles.sourceMeta}>
                {source.themes.length} thème(s)
              </Text>
            </View>
          ))}
      </View>

      {searchResults.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Résultats</Text>
          {searchResults
            .filter((item) =>
              selectedFilter === "all"
                ? true
                : item.scopeType === selectedFilter,
            )
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultCard}
                onPress={() => {
                  setSearchResults([]);
                  setSelectedFilter(item.scopeType);
                  setActiveThemeKey(`${item.sourceKey}:${item.themeId}`);
                  setExpandedItemIds([item.id]);
                  setViewMode("content");
                }}
              >
                <Text style={styles.resultTheme}>{item.scopeLabel}</Text>
                <Text style={styles.resultQuestion}>{item.question}</Text>
                <Text style={styles.resultMeta}>{item.themeTitle}</Text>
              </TouchableOpacity>
            ))}
        </View>
      ) : null}

      {viewMode === "content" ? (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setViewMode("themes")}
            testID="assistance-faq-back-to-themes-mobile"
          >
            <Ionicons
              name="arrow-back-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.backBtnLabel}>Retour aux thèmes</Text>
          </TouchableOpacity>

          {activeTheme ? (
            <>
              <View style={styles.themeHeader}>
                <Text style={styles.themeLabel}>{activeTheme.scopeLabel}</Text>
                <Text style={styles.themeTitle}>{activeTheme.title}</Text>
                {activeTheme.description ? (
                  <Text style={styles.themeDescription}>
                    {activeTheme.description}
                  </Text>
                ) : null}
              </View>
              {activeTheme.items.map((item) => {
                const expanded = expandedItemIds.includes(item.id);
                return (
                  <View key={item.id} style={styles.questionCard}>
                    <TouchableOpacity
                      style={styles.questionHeader}
                      onPress={() => toggleItem(item.id)}
                    >
                      <Text style={styles.questionLabel}>{item.question}</Text>
                      <Ionicons
                        name={
                          expanded
                            ? "chevron-up-outline"
                            : "chevron-down-outline"
                        }
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                    {expanded ? (
                      <Text style={styles.answerText}>{item.answerText}</Text>
                    ) : null}
                  </View>
                );
              })}
            </>
          ) : (
            <Text style={styles.emptyText}>Aucun thème disponible.</Text>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thèmes</Text>
          {sources
            .filter((source) =>
              selectedFilter === "all"
                ? true
                : source.scopeType === selectedFilter,
            )
            .map((source) => (
              <View key={source.key} style={styles.themeSection}>
                <Text style={styles.themeSectionLabel}>
                  {source.scopeLabel}
                </Text>
                {source.themes.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={styles.themeCard}
                    onPress={() => {
                      setActiveThemeKey(`${source.key}:${theme.id}`);
                      setExpandedItemIds(
                        theme.items[0] ? [theme.items[0].id] : [],
                      );
                      setViewMode("content");
                    }}
                  >
                    <View>
                      <Text style={styles.themeCardTitle}>{theme.title}</Text>
                      <Text style={styles.themeCardCount}>
                        {theme.items.length} question(s)
                      </Text>
                    </View>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
        </View>
      )}

      {adminMode ? (
        <View
          style={styles.adminWrap}
          testID="assistance-faq-admin-forms-mobile"
        >
          <Text style={styles.adminModeTitle}>
            {adminMode === "GLOBAL"
              ? "Administration FAQ Scolive"
              : `Administration FAQ de ${schoolScope?.schoolName ?? "l'école"}`}
          </Text>
          <Text style={styles.adminModeSubtitle}>
            {adminMode === "GLOBAL"
              ? "Base commune à toute la plateforme"
              : "Base propre à votre établissement"}
          </Text>
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
              />
            )}
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={faqForm.handleSubmit((values) => void saveFaq(values))}
            disabled={!faqForm.formState.isValid || savingFaq}
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
              />
            )}
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={themeForm.handleSubmit((values) => void saveTheme(values))}
            disabled={!themeForm.formState.isValid || savingTheme}
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
              />
            )}
          />
          <Controller
            control={itemForm.control}
            name="answerHtml"
            render={({ field: { onChange }, fieldState }) => (
              <>
                <View style={styles.editorShell}>
                  <RichTextToolbar
                    editorRef={editorRef}
                    onPressColor={() =>
                      Alert.alert("Couleur du texte", "Choix rapide", [
                        {
                          text: "Bleu",
                          onPress: () =>
                            editorRef.current?.setForeColor("#0C5FA8"),
                        },
                        { text: "Annuler", style: "cancel" },
                      ])
                    }
                    onPressHeading={() =>
                      editorRef.current?.command(
                        "document.execCommand('formatBlock', false, '<h2>'); true;",
                      )
                    }
                    onPressQuote={() =>
                      editorRef.current?.command(
                        "document.execCommand('formatBlock', false, '<blockquote>'); true;",
                      )
                    }
                  />
                  <RichEditor
                    ref={editorRef}
                    style={styles.editor}
                    initialHeight={180}
                    editorStyle={{
                      backgroundColor: colors.white,
                      color: colors.textPrimary,
                      placeholderColor: colors.textSecondary,
                    }}
                    placeholder="Rédiger la réponse"
                    onChange={onChange}
                  />
                </View>
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
            disabled={!itemForm.formState.isValid || savingItem}
          >
            <Text style={styles.primaryBtnLabel}>
              {editableItemId ? "Mettre à jour" : "Créer"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 32, gap: 14 },
  loadingCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 18,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 12,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E8F1FA",
  },
  heroBadgeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipLabelActive: { color: colors.white },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  searchBtn: {
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchBtnLabel: { fontSize: 12, fontWeight: "700", color: colors.white },
  errorBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5C2C7",
    backgroundColor: "#FFF1F3",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: { fontSize: 13, color: colors.notification },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  sourceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 14,
    gap: 4,
  },
  sourceBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sourceTitle: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
  sourceMeta: { fontSize: 12, color: colors.textSecondary },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 14,
    gap: 6,
  },
  resultTheme: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  resultQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  resultMeta: { fontSize: 12, color: colors.textSecondary },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backBtnLabel: { fontSize: 13, fontWeight: "700", color: colors.primary },
  themeHeader: {
    borderRadius: 18,
    backgroundColor: "#EEF5FB",
    padding: 14,
    gap: 4,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  themeTitle: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  themeDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  questionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  answerText: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  themeSection: { gap: 8 },
  themeSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  themeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 16,
  },
  themeCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  themeCardCount: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
  adminWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12,
  },
  adminFaqsRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  adminFaqChip: {
    borderRadius: 999,
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
  adminModeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -4,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
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
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  chipLabelActive: { color: colors.white },
  editorShell: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 10,
    gap: 10,
  },
  editor: { minHeight: 180, backgroundColor: colors.white },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingVertical: 13,
  },
  primaryBtnLabel: { fontSize: 14, fontWeight: "800", color: colors.white },
});
