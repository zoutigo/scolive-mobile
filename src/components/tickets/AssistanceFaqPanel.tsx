import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { helpFaqsApi } from "../../api/help-faqs.api";
import type {
  HelpFaqItem,
  HelpFaqScopeType,
  HelpFaqSourceWithThemes,
  HelpFaqTheme,
} from "../../types/help-faqs.types";

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

type Props = {
  canManageOverride?: boolean;
  onManage?: () => void;
};

export function AssistanceFaqPanel({
  canManageOverride = true,
  onManage,
}: Props) {
  const [permissions, setPermissions] = useState({
    canManageGlobal: false,
    canManageSchool: false,
  });
  const [sources, setSources] = useState<HelpFaqSourceWithThemes[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<ViewFilter>("all");
  const [activeThemeKey, setActiveThemeKey] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("themes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setSources(themesResponse.sources);

      if (themesResponse.sources[0]?.themes[0]) {
        const first = themesResponse.sources[0].themes[0];
        setActiveThemeKey(`${themesResponse.sources[0].key}:${first.id}`);
        setExpandedItemIds(first.items[0] ? [first.items[0].id] : []);
      } else {
        setActiveThemeKey(null);
        setExpandedItemIds([]);
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
        {adminMode && onManage ? (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={onManage}
            testID="assistance-faq-manage-btn"
          >
            <Ionicons name="settings-outline" size={14} color={colors.white} />
            <Text style={styles.manageBtnLabel}>Gérer la FAQ</Text>
          </TouchableOpacity>
        ) : null}
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
  manageBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageBtnLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
});
