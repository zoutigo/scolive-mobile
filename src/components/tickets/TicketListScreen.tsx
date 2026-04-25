import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
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
import { useDrawer } from "../navigation/drawer-context";
import { AssistanceFaqPanel } from "./AssistanceFaqPanel";
import { TicketCard } from "./TicketCard";
import { AssistanceGuidePanel } from "./AssistanceGuidePanel";
import type {
  TicketListItem,
  TicketStatus,
  TicketType,
} from "../../types/tickets.types";

type AssistanceTabKey = "manual" | "faq" | "tickets" | "chat";
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

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

const ASSISTANCE_TABS: Array<{
  key: AssistanceTabKey;
  label: string;
  icon: IoniconName;
}> = [
  { key: "manual", label: "Guide", icon: "book-outline" },
  { key: "faq", label: "FAQ", icon: "help-circle-outline" },
  { key: "tickets", label: "Bug", icon: "bug-outline" },
  { key: "chat", label: "Chat", icon: "chatbubbles-outline" },
];

export function TicketListScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
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

  const [activeTab, setActiveTab] = useState<AssistanceTabKey>("tickets");
  const [searchText, setSearchText] = useState(search);

  useEffect(() => {
    if (activeTab !== "tickets") return;
    void loadTickets();
  }, [loadTickets, filterStatus, filterType, activeTab]);

  const handleSearch = useCallback(
    (text: string) => {
      if (activeTab !== "tickets") return;
      setSearchText(text);
      setSearch(text);
      void loadTickets();
    },
    [activeTab, setSearch, loadTickets],
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

  const subtitle =
    activeTab === "tickets"
      ? isPlatform
        ? `${meta?.total ?? 0} ticket(s)`
        : "Mes signalements"
      : activeTab === "manual"
        ? "Manuel utilisateur"
        : activeTab === "faq"
          ? "Questions fréquentes"
          : "Discussion en direct";

  const isTicketsTab = activeTab === "tickets";

  const placeholder = (
    <View
      style={styles.placeholderWrap}
      testID={`assistance-${activeTab}-panel`}
    >
      <Ionicons
        name={
          activeTab === "manual"
            ? "book-outline"
            : activeTab === "faq"
              ? "help-circle-outline"
              : "chatbubbles-outline"
        }
        size={44}
        color={colors.warmBorder}
      />
      <Text style={styles.placeholderTitle}>
        {activeTab === "manual"
          ? "Manuel utilisateur"
          : activeTab === "faq"
            ? "FAQ"
            : "Chat assistance"}
      </Text>
      <Text style={styles.placeholderSubtitle}>
        {activeTab === "manual"
          ? "Structure prête pour brancher les sections du guide utilisateur."
          : activeTab === "faq"
            ? "Structure prête pour afficher les questions/réponses fréquentes."
            : "Structure prête pour intégrer une conversation de support en direct."}
      </Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderCardTitle}>Aperçu UI</Text>
        <Text style={styles.placeholderCardText}>
          {activeTab === "manual"
            ? "- Introduction\n- Prise en main\n- Parcours par rôle"
            : activeTab === "faq"
              ? "- Connexion\n- Notifications\n- Problèmes courants"
              : "- Historique des échanges\n- Champ de saisie\n- Statut de disponibilité"}
        </Text>
      </View>
    </View>
  );

  if (isLoading && tickets.length === 0 && isTicketsTab) {
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
        subtitle={subtitle}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={androidStatusInset}
        testID="ticket-list-header"
      />

      <View style={styles.topTabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topTabsInner}
        >
          {ASSISTANCE_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.topTab, isActive && styles.topTabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
                testID={`assistance-tab-${tab.key}`}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.topTabLabel,
                    isActive && styles.topTabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isTicketsTab ? (
        <>
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

          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + 20 }]}
            onPress={() => router.push("/(home)/tickets/create")}
            testID="ticket-list-fab"
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </TouchableOpacity>
        </>
      ) : activeTab === "manual" ? (
        <AssistanceGuidePanel />
      ) : activeTab === "faq" ? (
        <AssistanceFaqPanel />
      ) : (
        <View style={styles.placeholderContainer}>{placeholder}</View>
      )}
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
  topTabsWrap: {
    marginTop: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  topTabsInner: {
    paddingHorizontal: 12,
    gap: 4,
  },
  topTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  topTabActive: {
    borderBottomColor: colors.primary,
  },
  topTabLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  topTabLabelActive: {
    color: colors.primary,
    fontWeight: "700",
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
  placeholderContainer: {
    flex: 1,
  },
  placeholderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 19,
  },
  placeholderCard: {
    marginTop: 10,
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  placeholderCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  placeholderCardText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
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
