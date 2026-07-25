import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useUsersStore } from "../../store/users.store";
import { usersApi } from "../../api/users.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { SelectField } from "../tests-admin/SelectField";
import { ROLE_COLORS, UserCard } from "./UserCard";
import { UserDetailModal } from "./UserDetailModal";
import type {
  SchoolRole,
  SchoolUser,
  SchoolUserAccountFilter,
  SchoolUserRoleFilter,
  SchoolUsersFilters,
  SchoolYearOption,
} from "../../types/users.types";
import { moduleBack } from "../../utils/moduleBack";

const SEARCH_DEBOUNCE_MS = 400;

const ROLE_FILTER_KEYS: SchoolUserRoleFilter[] = [
  "ALL",
  "TEACHER",
  "PARENT",
  "STUDENT",
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
  "SCHOOL_STAFF",
];

const ROLE_LEGEND_KEYS: SchoolRole[] = ROLE_FILTER_KEYS.filter(
  (key): key is SchoolRole => key !== "ALL",
);

const ACCOUNT_FILTER_KEYS: SchoolUserAccountFilter[] = [
  "ALL",
  "WITH_ACCOUNT",
  "WITHOUT_ACCOUNT",
];

type DraftFilters = Pick<
  SchoolUsersFilters,
  "role" | "hasAccount" | "schoolYearId"
>;

function hasActiveFilters(filters: DraftFilters) {
  return (
    filters.role !== "ALL" ||
    filters.hasAccount !== "ALL" ||
    filters.schoolYearId !== ""
  );
}

// Year only applies to enrollments (STUDENT) or teaching assignments
// (TEACHER) — a mixed role list (ALL, or any other single role) has no
// school-year relationship to filter on.
function yearFilterApplies(role: SchoolUserRoleFilter) {
  return role === "STUDENT" || role === "TEACHER";
}

function UserSeparator() {
  return <View style={separatorStyles.line} />;
}

const separatorStyles = StyleSheet.create({
  line: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: "#E8CCAE",
    opacity: 0.5,
  },
});

export function SchoolAdminUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug, user } = useAuthStore();

  const {
    users,
    hasMore,
    total,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    filters,
    setFilters,
    setUsers,
    appendUsers,
    setLoading,
    setLoadingMore,
    setRefreshing,
    setError,
    reset,
  } = useUsersStore();

  const [selectedUser, setSelectedUser] = useState<SchoolUser | null>(null);
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
    role: filters.role,
    hasAccount: filters.hasAccount,
    schoolYearId: filters.schoolYearId,
  });
  const [filterScrollOverflowing, setFilterScrollOverflowing] = useState(false);
  const [filterScrollNearBottom, setFilterScrollNearBottom] = useState(false);
  const filterScrollLayoutHeightRef = useRef(0);
  const filterScrollContentHeightRef = useRef(0);
  const showFilterScrollHint =
    filterScrollOverflowing && !filterScrollNearBottom;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = filters.search;

  // ── Load first page ───────────────────────────────────────────────────────────
  // Reads filters from getState() to avoid stale-closure issues with debounced
  // search: the debounce callback captures this function before the state update
  // completes, so reading from the store at call time guarantees fresh values.
  const loadFirstPage = useCallback(
    async (refresh = false) => {
      if (!schoolSlug) return;
      const { filters: f } = useUsersStore.getState();
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await usersApi.list(schoolSlug, {
          search: f.search,
          role: f.role,
          hasAccount: f.hasAccount,
          schoolYearId: yearFilterApplies(f.role) ? f.schoolYearId : undefined,
          page: 1,
        });
        setUsers(result.data, result.hasMore, 1, result.total);
      } catch {
        setError(t("users.errors.loadFailed"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [schoolSlug, setUsers, setLoading, setRefreshing, setError, t],
  );

  // ── Load more pages ───────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!schoolSlug || isLoadingMore || !hasMore) return;
    const { filters: f, page: currentPage } = useUsersStore.getState();
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await usersApi.list(schoolSlug, {
        search: f.search,
        role: f.role,
        hasAccount: f.hasAccount,
        schoolYearId: yearFilterApplies(f.role) ? f.schoolYearId : undefined,
        page: nextPage,
      });
      appendUsers(result.data, result.hasMore, nextPage);
    } catch {
      // silent — user can pull to refresh
    } finally {
      setLoadingMore(false);
    }
  }, [schoolSlug, isLoadingMore, hasMore, appendUsers, setLoadingMore]);

  // ── Initial load & filter change ──────────────────────────────────────────────
  useEffect(() => {
    void loadFirstPage(false);
  }, [filters.role, filters.hasAccount, filters.schoolYearId]);

  // ── Debounced search ──────────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (text: string) => {
      setFilters({ search: text });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void loadFirstPage(false);
      }, SEARCH_DEBOUNCE_MS);
    },
    [setFilters, loadFirstPage],
  );

  const handleClearSearch = useCallback(() => {
    setFilters({ search: "" });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void loadFirstPage(false);
  }, [setFilters, loadFirstPage]);

  // ── School years for the "Année scolaire" dropdown ────────────────────────────
  useEffect(() => {
    if (!schoolSlug) return;
    usersApi
      .listSchoolYears(schoolSlug)
      .then(setSchoolYears)
      .catch(() => setSchoolYears([]));
  }, [schoolSlug]);

  // ── Filters panel ──────────────────────────────────────────────────────────────
  function openFilters() {
    setDraftFilters({
      role: filters.role,
      hasAccount: filters.hasAccount,
      schoolYearId: filters.schoolYearId,
    });
    filterScrollLayoutHeightRef.current = 0;
    filterScrollContentHeightRef.current = 0;
    setFilterScrollOverflowing(false);
    setFilterScrollNearBottom(false);
    setFiltersOpen(true);
  }

  function closeFilters() {
    setDraftFilters({
      role: filters.role,
      hasAccount: filters.hasAccount,
      schoolYearId: filters.schoolYearId,
    });
    setFiltersOpen(false);
  }

  function toggleFilters() {
    if (filtersOpen) closeFilters();
    else openFilters();
  }

  function applyFilters() {
    setFilters({
      role: draftFilters.role,
      hasAccount: draftFilters.hasAccount,
      schoolYearId: yearFilterApplies(draftFilters.role)
        ? draftFilters.schoolYearId
        : "",
    });
    setFiltersOpen(false);
  }

  function resetFilters() {
    const cleared: DraftFilters = {
      role: "ALL",
      hasAccount: "ALL",
      schoolYearId: "",
    };
    setDraftFilters(cleared);
    setFilters(cleared);
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

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      reset();
    };
  }, []);

  // ── Render item ───────────────────────────────────────────────────────────────
  const renderUser = useCallback(
    ({ item, index }: { item: SchoolUser; index: number }) => (
      <UserCard
        user={item}
        index={index}
        onPress={setSelectedUser}
        testID={`user-card-${item.id}`}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: SchoolUser) => item.id, []);

  const emptyComponent = isLoading ? null : (
    <View style={styles.centered}>
      {error ? null : (
        <EmptyState
          icon={
            searchInput || hasActiveFilters(filters)
              ? "search-outline"
              : "people-outline"
          }
          title={
            searchInput || hasActiveFilters(filters)
              ? t("users.empty.titleSearch")
              : t("users.empty.title")
          }
          message={
            searchInput || hasActiveFilters(filters)
              ? t("users.empty.messageSearch")
              : t("users.empty.message")
          }
        />
      )}
    </View>
  );

  if (selectedUser) {
    return (
      <UserDetailModal
        user={selectedUser}
        schoolSlug={schoolSlug ?? ""}
        onClose={() => setSelectedUser(null)}
        testID="users-detail-modal"
      />
    );
  }

  const yearOptions = [
    { value: "", label: t("users.filters.allYears") },
    ...schoolYears.map((y) => ({ value: y.id, label: y.label })),
  ];
  const yearFieldDisabled = !yearFilterApplies(draftFilters.role);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="school-admin-users-screen"
    >
      {/* Header */}
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={t("users.header.title")}
          subtitle={user?.schoolName}
          onBack={() => moduleBack(router)}
          testID="users-header"
          backTestID="users-back"
          titleTestID="users-title"
          subtitleTestID="users-subtitle"
          topInset={insets.top}
        />
      </View>

      {/* Search + filter toggle */}
      <View style={styles.searchRow} testID="users-search-row">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={handleSearchChange}
            placeholder={t("users.search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={t("users.search.accessibilityLabel")}
            testID="users-search-input"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="users-search-clear"
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
            hasActiveFilters(filters) && styles.filterToggleActive,
          ]}
          onPress={toggleFilters}
          testID="users-filter-toggle"
          accessibilityLabel={t("users.filters.toggleAccessibilityLabel")}
        >
          <Ionicons
            name={hasActiveFilters(filters) ? "filter" : "filter-outline"}
            size={18}
            color={hasActiveFilters(filters) ? colors.white : colors.accentTeal}
          />
          {total > 0 ? (
            <View style={styles.filterToggleBadge} testID="users-total">
              <Text style={styles.filterToggleBadgeLabel}>
                {total > 99 ? "99+" : total}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {total > 0 && !filtersOpen ? (
        <View style={styles.totalRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.legendContent}
            testID="users-role-legend"
          >
            {ROLE_LEGEND_KEYS.map((role) => (
              <View key={role} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: ROLE_COLORS[role].bg },
                  ]}
                />
                <Text style={styles.legendLabel}>
                  {t(`users.role.short.${role}`)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner} testID="users-error">
          <Ionicons name="alert-circle" size={16} color={colors.notification} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Filters panel — exclusive of the list below */}
      {filtersOpen ? (
        <View style={styles.filterPanel} testID="users-filter-panel">
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelHeaderIcon}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentTealDark}
              />
            </View>
            <Text style={styles.filterPanelHeaderTitle}>
              {t("users.filters.toggleAccessibilityLabel")}
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
              testID="users-filter-scroll"
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("users.filters.roleLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  {ROLE_FILTER_KEYS.map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.filterChip,
                        draftFilters.role === key && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          role: key,
                        }))
                      }
                      testID={`users-filter-role-${key.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.role === key &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {t(`users.role.${key}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("users.filters.accountLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  {ACCOUNT_FILTER_KEYS.map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.filterChip,
                        draftFilters.hasAccount === key &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          hasAccount: key,
                        }))
                      }
                      testID={`users-filter-account-${key.toLowerCase()}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.hasAccount === key &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {t(`users.account.${key}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("users.filters.yearLabel")}
                </Text>
                <View
                  style={yearFieldDisabled ? styles.filterFieldDisabled : null}
                  pointerEvents={yearFieldDisabled ? "none" : "auto"}
                >
                  <SelectField
                    options={yearOptions}
                    value={draftFilters.schoolYearId}
                    onChange={(value) =>
                      setDraftFilters((current) => ({
                        ...current,
                        schoolYearId: value,
                      }))
                    }
                    placeholder={t("users.filters.allYears")}
                    closeLabel={t("users.filters.close")}
                    testIDPrefix="users-filter-year"
                  />
                </View>
                {yearFieldDisabled ? (
                  <Text style={styles.filterFieldHint}>
                    {t("users.filters.yearHint")}
                  </Text>
                ) : null}
              </View>
            </ScrollView>
            {showFilterScrollHint ? (
              <View
                style={styles.filterScrollHint}
                pointerEvents="none"
                testID="users-filter-scroll-hint"
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
              testID="users-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("users.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID="users-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("users.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={applyFilters}
              testID="users-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("users.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("users.loading")} />
        </View>
      ) : (
        <InfiniteScrollList
          data={users}
          renderItem={renderUser}
          keyExtractor={keyExtractor}
          onRefresh={() => void loadFirstPage(true)}
          refreshing={isRefreshing}
          onLoadMore={() => void loadMore()}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          emptyComponent={emptyComponent}
          contentContainerStyle={
            users.length === 0 ? styles.emptyList : undefined
          }
          endOfListLabel={t("users.endOfList")}
          ItemSeparatorComponent={UserSeparator}
          testID="users-list"
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {},
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  filterToggle: {
    position: "relative",
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
  filterToggleBadge: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    minWidth: 16,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    backgroundColor: colors.warmAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  filterToggleBadgeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.white,
  },
  totalRow: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  legendContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyList: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.notification,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.notification,
  },

  // ── Filter panel (teal, per improve-mobile-search pattern) ───────────────────
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
  filterFieldDisabled: {
    opacity: 0.45,
  },
  filterFieldHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
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
});
