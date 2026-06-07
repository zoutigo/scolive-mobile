import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
import { useAuthStore } from "../../store/auth.store";
import { useUsersStore } from "../../store/users.store";
import { usersApi } from "../../api/users.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useDrawer } from "../navigation/drawer-context";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { UserCard } from "./UserCard";
import { RoleFilterBar } from "./RoleFilterBar";
import { UserDetailModal } from "./UserDetailModal";
import type { SchoolUser, SchoolUserRoleFilter } from "../../types/users.types";

const DEBOUNCE_MS = 400;

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
  const { openDrawer } = useDrawer();
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
          page: 1,
        });
        setUsers(result.data, result.hasMore, 1, result.total);
      } catch {
        setError("Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [schoolSlug, setUsers, setLoading, setRefreshing, setError],
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
  }, [filters.role]);

  // ── Debounced search ──────────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (text: string) => {
      setFilters({ search: text });
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void loadFirstPage(false);
      }, DEBOUNCE_MS);
    },
    [setFilters, loadFirstPage],
  );

  const handleClearSearch = useCallback(() => {
    setFilters({ search: "" });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void loadFirstPage(false);
  }, [setFilters, loadFirstPage]);

  const handleRoleChange = useCallback(
    (role: SchoolUserRoleFilter) => {
      setFilters({ role });
    },
    [setFilters],
  );

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
            searchInput || filters.role !== "ALL"
              ? "search-outline"
              : "people-outline"
          }
          title={
            searchInput || filters.role !== "ALL"
              ? "Aucun résultat"
              : "Aucun utilisateur"
          }
          message={
            searchInput || filters.role !== "ALL"
              ? "Modifiez vos critères de recherche."
              : "Aucun utilisateur enregistré dans l'établissement."
          }
        />
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="school-admin-users-screen"
    >
      {/* Header */}
      <View style={styles.headerWrap}>
        <ModuleHeader
          title="Utilisateurs"
          subtitle={user?.schoolName}
          onBack={() => router.back()}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          testID="users-header"
          backTestID="users-back"
          titleTestID="users-title"
          subtitleTestID="users-subtitle"
          rightTestID="users-menu"
          topInset={insets.top}
        />
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            value={searchInput}
            onChangeText={handleSearchChange}
            placeholder="Nom, prénom, email, téléphone…"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
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
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {total > 0 ? (
          <Text style={styles.totalLabel} testID="users-total">
            {total} utilisateur{total > 1 ? "s" : ""}
          </Text>
        ) : null}
      </View>

      {/* Role filter chips */}
      <RoleFilterBar
        selected={filters.role}
        onSelect={handleRoleChange}
        testID="users-role-filter"
      />

      {/* Error */}
      {error ? (
        <View style={styles.errorBanner} testID="users-error">
          <Ionicons name="alert-circle" size={16} color={colors.notification} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <LoadingBlock label="Chargement des utilisateurs…" />
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
          endOfListLabel="Tous les utilisateurs ont été chargés"
          ItemSeparatorComponent={UserSeparator}
          testID="users-list"
        />
      )}

      {/* Detail modal */}
      <UserDetailModal
        user={selectedUser}
        schoolSlug={schoolSlug ?? ""}
        onClose={() => setSelectedUser(null)}
        testID="users-detail-modal"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    paddingHorizontal: 16,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  searchBar: {
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
  totalLabel: {
    fontSize: 12,
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
});
