import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { timetableApi } from "../../api/timetable.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import {
  LoadingBlock,
  ErrorBanner,
  EmptyState,
} from "../timetable/TimetableCommon";
import { moduleBack } from "../../utils/moduleBack";
import { extractApiError } from "../../utils/api-error";
import { useTranslation } from "../../i18n/useTranslation";
import type { TimetableClassOption } from "../../types/timetable.types";

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 60;
const COLUMNS = 3;

type ClassesFilters = { academicLevelId: string | null };
const NO_FILTERS: ClassesFilters = { academicLevelId: null };

function hasActiveFilters(filters: ClassesFilters) {
  return filters.academicLevelId != null;
}

type LevelOption = { id: string; label: string };
type LevelGroup = { id: string; label: string; items: TimetableClassOption[] };
type ListMeta = { page: number; limit: number; total: number };
type LoadMode = "reset" | "append" | "refresh";

export function AdminClassesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ClassesFilters>(NO_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ClassesFilters>(NO_FILTERS);

  const [classes, setClasses] = useState<TimetableClassOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>([]);
  const [listMeta, setListMeta] = useState<ListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filterScrollOverflowing, setFilterScrollOverflowing] = useState(false);
  const [filterScrollNearBottom, setFilterScrollNearBottom] = useState(false);
  const filterScrollLayoutHeightRef = useRef(0);
  const filterScrollContentHeightRef = useRef(0);
  const showFilterScrollHint =
    filterScrollOverflowing && !filterScrollNearBottom;

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadList = useCallback(
    async (
      page: number,
      filters: ClassesFilters,
      search: string,
      mode: LoadMode,
    ) => {
      if (!schoolSlug) return;
      if (mode === "append") setIsLoadingMore(true);
      else if (mode === "refresh") setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await timetableApi.getAdminClassList(schoolSlug, {
          academicLevelId: filters.academicLevelId ?? undefined,
          search: search || undefined,
          page,
          limit: PAGE_SIZE,
        });
        setClasses((current) =>
          mode === "append" ? [...current, ...result.data] : result.data,
        );
        setListMeta({
          page: result.page,
          limit: result.limit,
          total: result.total,
        });
        if (mode !== "append" && !filters.academicLevelId && !search) {
          const seen = new Map<string, string>();
          for (const item of result.data) {
            if (item.academicLevelId && !seen.has(item.academicLevelId)) {
              seen.set(
                item.academicLevelId,
                item.academicLevelName ?? item.academicLevelId,
              );
            }
          }
          setLevelOptions(Array.from(seen, ([id, label]) => ({ id, label })));
        }
      } catch (error) {
        setErrorMessage(extractApiError(error));
      } finally {
        if (mode === "append") setIsLoadingMore(false);
        else if (mode === "refresh") setIsRefreshing(false);
        else setIsLoading(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    void loadList(1, appliedFilters, appliedSearch, "reset");
  }, [appliedFilters, appliedSearch, loadList]);

  const hasMountedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
        return;
      }
      void loadList(1, appliedFilters, appliedSearch, "refresh");
    }, [loadList, appliedFilters, appliedSearch]),
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  function openFilters() {
    setDraftFilters(appliedFilters);
    filterScrollLayoutHeightRef.current = 0;
    filterScrollContentHeightRef.current = 0;
    setFilterScrollOverflowing(false);
    setFilterScrollNearBottom(false);
    setFiltersOpen(true);
  }
  function closeFilters() {
    setDraftFilters(appliedFilters);
    setFiltersOpen(false);
  }
  function toggleFilters() {
    if (filtersOpen) closeFilters();
    else openFilters();
  }
  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  }
  function resetFilters() {
    setDraftFilters(NO_FILTERS);
    setAppliedFilters(NO_FILTERS);
  }

  function recomputeFilterScrollOverflow() {
    setFilterScrollOverflowing(
      filterScrollContentHeightRef.current >
        filterScrollLayoutHeightRef.current + 4,
    );
  }
  function handleFilterScrollLayout(height: number) {
    filterScrollLayoutHeightRef.current = height;
    recomputeFilterScrollOverflow();
  }
  function handleFilterScrollContentSize(height: number) {
    filterScrollContentHeightRef.current = height;
    recomputeFilterScrollOverflow();
  }
  function handleFilterScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setFilterScrollNearBottom(distanceFromBottom < 12);
  }

  const totalPages = listMeta
    ? Math.max(1, Math.ceil(listMeta.total / listMeta.limit))
    : 1;
  const hasMore = listMeta ? listMeta.page < totalPages : false;

  function handleLoadMore() {
    if (!listMeta || isLoadingMore || !hasMore) return;
    void loadList(listMeta.page + 1, appliedFilters, appliedSearch, "append");
  }

  function handleRefresh() {
    void loadList(1, appliedFilters, appliedSearch, "refresh");
  }

  const groups = useMemo<LevelGroup[]>(() => {
    const map = new Map<string, LevelGroup>();
    for (const item of classes) {
      const key = item.academicLevelId ?? "__none__";
      const label = item.academicLevelName ?? t("classesAdmin.levels.none");
      if (!map.has(key)) map.set(key, { id: key, label, items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values());
  }, [classes, t]);

  const handleSelectClass = useCallback(
    (classId: string) => {
      router.push({
        pathname: "/(home)/admin-classes/[classId]",
        params: { classId },
      });
    },
    [router],
  );

  const handleCreateClass = useCallback(() => {
    router.push("/(home)/admin-classes/new");
  }, [router]);

  const isSearchOrFilterActive =
    appliedSearch.length > 0 || hasActiveFilters(appliedFilters);

  return (
    <View style={styles.root} testID="admin-classes-screen">
      <ModuleHeader
        title={t("classesAdmin.header.title")}
        onBack={() => moduleBack(router)}
        testID="admin-classes-header"
        backTestID="admin-classes-back"
        titleTestID="admin-classes-title"
        topInset={insets.top}
      />

      <View style={styles.searchRow} testID="admin-classes-search-row">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t("classesAdmin.search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={t("classesAdmin.search.accessibilityLabel")}
            testID="admin-classes-search-input"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchInput("")}
              testID="admin-classes-search-clear"
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.filterToggle,
            hasActiveFilters(appliedFilters) && styles.filterToggleActive,
          ]}
          onPress={toggleFilters}
          testID="admin-classes-filter-toggle"
          accessibilityLabel={t(
            "classesAdmin.filters.toggleAccessibilityLabel",
          )}
        >
          <Ionicons
            name={
              hasActiveFilters(appliedFilters) ? "filter" : "filter-outline"
            }
            size={18}
            color={
              hasActiveFilters(appliedFilters)
                ? colors.white
                : colors.accentTeal
            }
          />
        </TouchableOpacity>
      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel} testID="admin-classes-filter-panel">
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelHeaderIcon}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentTealDark}
              />
            </View>
            <Text style={styles.filterPanelHeaderTitle}>
              {t("classesAdmin.filters.toggleAccessibilityLabel")}
            </Text>
          </View>

          <View style={styles.filterScrollWrapper}>
            <ScrollView
              style={styles.filterScrollArea}
              contentContainerStyle={styles.filterScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              onLayout={(e) =>
                handleFilterScrollLayout(e.nativeEvent.layout.height)
              }
              onContentSizeChange={(_w, h) => handleFilterScrollContentSize(h)}
              onScroll={handleFilterScroll}
              scrollEventThrottle={16}
              testID="admin-classes-filter-scroll"
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("classesAdmin.filters.levelLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      draftFilters.academicLevelId == null &&
                        styles.filterChipActive,
                    ]}
                    onPress={() => setDraftFilters({ academicLevelId: null })}
                    testID="admin-classes-filter-level-all"
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftFilters.academicLevelId == null &&
                          styles.filterChipLabelActive,
                      ]}
                    >
                      {t("classesAdmin.filters.allOption")}
                    </Text>
                  </TouchableOpacity>
                  {levelOptions.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.filterChip,
                        draftFilters.academicLevelId === level.id &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setDraftFilters({ academicLevelId: level.id })
                      }
                      testID={`admin-classes-filter-level-${level.id}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.academicLevelId === level.id &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            {showFilterScrollHint ? (
              <View
                style={styles.filterScrollHint}
                pointerEvents="none"
                testID="admin-classes-filter-scroll-hint"
              >
                <View style={styles.filterScrollHintFade} />
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.accentTeal}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={resetFilters}
              testID="admin-classes-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("classesAdmin.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID="admin-classes-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("classesAdmin.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={applyFilters}
              testID="admin-classes-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("classesAdmin.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <ErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
            testID="admin-classes-error"
          />
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("classesAdmin.loading")} />
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon="book-outline"
            title={
              isSearchOrFilterActive
                ? t("classesAdmin.empty.titleSearch")
                : t("classesAdmin.empty.title")
            }
            message={
              isSearchOrFilterActive
                ? t("classesAdmin.empty.messageSearch")
                : t("classesAdmin.empty.message")
            }
          />
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          testID="admin-classes-list"
        >
          {groups.map((group) => {
            const fillerCount =
              (COLUMNS - (group.items.length % COLUMNS)) % COLUMNS;
            return (
              <View
                key={group.id}
                style={styles.levelGroup}
                testID={`admin-classes-level-group-${group.id}`}
              >
                <Text style={styles.levelGroupTitle}>{group.label}</Text>
                <View style={styles.levelGrid}>
                  {group.items.map((item) => (
                    <TouchableOpacity
                      key={item.classId}
                      style={styles.classCard}
                      onPress={() => handleSelectClass(item.classId)}
                      testID={`admin-classes-card-${item.classId}`}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.classCardName} numberOfLines={1}>
                        {item.className}
                      </Text>
                      <View style={styles.classCardMetaRow}>
                        <Ionicons
                          name="people-outline"
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.classCardMeta} numberOfLines={1}>
                          {item.studentCount}
                          {item.capacity != null ? `/${item.capacity}` : ""}
                        </Text>
                      </View>
                      <View style={styles.classCardMetaRow}>
                        <Ionicons
                          name="person-outline"
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.classCardMeta} numberOfLines={1}>
                          {item.referentTeacher
                            ? `${item.referentTeacher.firstName} ${item.referentTeacher.lastName}`
                            : t("classesAdmin.card.noReferent")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {Array.from({ length: fillerCount }).map((_, index) => (
                    <View
                      key={`filler-${group.id}-${index}`}
                      style={styles.classCardFiller}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          {hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={isLoadingMore}
              testID="admin-classes-load-more"
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.loadMoreLabel}>
                  {t("classesAdmin.loadMore")}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}

      {!filtersOpen ? (
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT },
          ]}
          onPress={handleCreateClass}
          testID="admin-classes-fab-create"
          accessibilityLabel={t("classesAdmin.fabCreate")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 96,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterToggleActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}33`,
    backgroundColor: colors.surface,
    gap: 14,
  },
  filterScrollWrapper: {
    flex: 1,
    position: "relative",
  },
  filterScrollArea: {
    flex: 1,
  },
  filterScrollContent: {
    gap: 14,
    paddingBottom: 12,
  },
  filterScrollHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScrollHintFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterPanelHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.accentTeal}1F`,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPanelHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipLabelActive: {
    color: colors.white,
  },
  filterActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterActionReset: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionResetLabel: {
    color: colors.warmAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionClose: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionCloseLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionApply: {
    flex: 1.3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 11,
  },
  filterActionApplyLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  levelGroup: {
    gap: 10,
    marginBottom: 20,
  },
  levelGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  classCard: {
    width: "31%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 10,
    padding: 10,
    gap: 5,
  },
  classCardFiller: {
    width: "31%",
  },
  classCardName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  classCardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  classCardMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  loadMoreButton: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  loadMoreLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
