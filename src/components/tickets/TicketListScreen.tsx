import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTicketsStore } from "../../store/tickets.store";
import { useAuthStore } from "../../store/auth.store";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { TicketCard } from "./TicketCard";
import type {
  TicketListItem,
  TicketStatus,
  TicketType,
} from "../../types/tickets.types";

const STATUS_FILTERS: Array<{
  label: string;
  value: TicketStatus | undefined;
}> = [
  { label: "Tous", value: undefined },
  { label: "Ouvert", value: "OPEN" },
  { label: "En cours", value: "IN_PROGRESS" },
  { label: "Répondu", value: "ANSWERED" },
  { label: "Résolu", value: "RESOLVED" },
];

const TYPE_FILTERS: Array<{ label: string; value: TicketType | undefined }> = [
  { label: "Tous", value: undefined },
  { label: "Bug", value: "BUG" },
  { label: "Suggestion", value: "FEATURE_REQUEST" },
];

export function TicketListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    tickets,
    meta,
    isLoading,
    isRefreshing,
    filterStatus,
    filterType,
    search,
    setFilterStatus,
    setFilterType,
    setSearch,
    loadTickets,
    refreshTickets,
    loadMoreTickets,
  } = useTicketsStore();

  const [searchText, setSearchText] = useState(search);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets, filterStatus, filterType]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      setSearch(text);
      void loadTickets();
    },
    [setSearch, loadTickets],
  );

  const handleRefresh = useCallback(() => {
    void refreshTickets();
  }, [refreshTickets]);

  const handleLoadMore = useCallback(() => {
    void loadMoreTickets();
  }, [loadMoreTickets]);

  const handleTicketPress = useCallback(
    (ticket: TicketListItem) => {
      router.push({
        pathname: "/(home)/tickets/[ticketId]",
        params: { ticketId: ticket.id },
      });
    },
    [router],
  );

  const isPlatform = (user?.platformRoles.length ?? 0) > 0;
  const hasMore = meta ? tickets.length < meta.total : false;

  const androidStatusInset =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  const renderItem = useCallback(
    ({ item }: { item: TicketListItem }) => (
      <TicketCard ticket={item} onPress={handleTicketPress} />
    ),
    [handleTicketPress],
  );

  const emptyComponent = (
    <View style={styles.empty} testID="ticket-list-empty">
      <Ionicons name="help-circle-outline" size={48} color={colors.border} />
      <Text style={styles.emptyTitle}>Aucun ticket</Text>
      <Text style={styles.emptySubtitle}>
        Signalez un bug ou proposez une amélioration
      </Text>
    </View>
  );

  if (isLoading && tickets.length === 0) {
    return (
      <View style={styles.loader} testID="ticket-list-loading">
        <ModuleHeader
          title="Assistance"
          subtitle="Bugs &amp; suggestions"
          onBack={() => router.back()}
          topInset={androidStatusInset}
        />
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="ticket-list-screen"
    >
      <ModuleHeader
        title="Assistance"
        subtitle={
          isPlatform ? `${meta?.total ?? 0} ticket(s)` : "Mes signalements"
        }
        onBack={() => router.back()}
        rightIcon="add-circle-outline"
        onRightPress={() => router.push("/(home)/tickets/create")}
        topInset={androidStatusInset}
        testID="ticket-list-header"
      />

      {/* Barre de recherche */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={16}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Rechercher…"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            testID="ticket-list-search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtre type */}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[
              styles.filterChip,
              filterType === f.value && styles.filterChipActive,
            ]}
            onPress={() => setFilterType(f.value)}
            testID={`type-filter-${f.value ?? "all"}`}
          >
            <Text
              style={[
                styles.filterLabel,
                filterType === f.value && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtre statut */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[
              styles.filterChip,
              filterStatus === f.value && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(f.value)}
            testID={`status-filter-${f.value ?? "all"}`}
          >
            <Text
              style={[
                styles.filterLabel,
                filterStatus === f.value && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <InfiniteScrollList
        data={tickets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoading && tickets.length > 0}
        emptyComponent={emptyComponent}
        contentContainerStyle={styles.listContent}
        testID="ticket-flat-list"
      />

      {/* FAB créer */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push("/(home)/tickets/create")}
        testID="ticket-list-fab"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  searchRow: {
    marginTop: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  filterLabelActive: {
    color: colors.white,
    fontWeight: "600",
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
