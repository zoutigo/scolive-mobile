import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../../src/theme";
import { useMessagingStore } from "../../../src/store/messaging.store";
import { useAuthStore } from "../../../src/store/auth.store";
import { useFamilyStore } from "../../../src/store/family.store";
import { FolderTabs } from "../../../src/components/messaging/FolderTabs";
import { MessageRow } from "../../../src/components/messaging/MessageRow";
import { InfiniteScrollList } from "../../../src/components/lists/InfiniteScrollList";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { buildChildHomeTarget } from "../../../src/components/navigation/nav-config";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { useDrawer } from "../../../src/components/navigation/drawer-context";
import type {
  FolderKey,
  MessageListItem,
} from "../../../src/types/messaging.types";

export default function MessagesScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <MessagesScreenContent />
    </AppShell>
  );
}

function MessagesScreenContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { schoolSlug } = useAuthStore();
  const { children, activeChildId } = useFamilyStore();

  const {
    folder,
    messages,
    meta,
    isLoading,
    isRefreshing,
    search,
    unreadCount,
    setFolder,
    setSearch,
    loadMessages,
    refreshMessages,
    loadMoreMessages,
  } = useMessagingStore();

  const [searchVisible, setSearchVisible] = useState(false);

  const load = useCallback(async () => {
    if (!schoolSlug) return;
    try {
      await loadMessages(schoolSlug);
    } catch (error) {
      console.error("MESSAGES_LOAD_FAILED", error);
    }
  }, [schoolSlug, loadMessages]);

  // Reload when folder or search changes
  useEffect(() => {
    void load();
  }, [load, folder, search]);

  function handleFolderChange(f: FolderKey) {
    setFolder(f);
  }

  function handlePress(item: MessageListItem) {
    router.push({
      pathname: "/(home)/messages/[messageId]",
      params: { messageId: item.id },
    });
  }

  function handleCompose() {
    router.push("/(home)/messages/compose");
  }

  function handleRefresh() {
    if (!schoolSlug) return;
    void refreshMessages(schoolSlug).catch((error) => {
      console.error("MESSAGES_REFRESH_FAILED", error);
    });
  }

  function handleLoadMore() {
    if (schoolSlug && meta && messages.length < meta.total && !isLoading) {
      void loadMoreMessages(schoolSlug).catch((error) => {
        console.error("MESSAGES_LOAD_MORE_FAILED", error);
      });
    }
  }

  const hasMore = meta ? messages.length < meta.total : false;
  const activeChild =
    children.find((entry) => entry.id === activeChildId) ?? children[0] ?? null;
  const subtitle = activeChild
    ? activeChild.className
      ? `${activeChild.firstName} ${activeChild.lastName} • ${activeChild.className}`
      : `${activeChild.firstName} ${activeChild.lastName}`
    : undefined;

  return (
    <View style={styles.root}>
      {searchVisible ? (
        <View style={[styles.searchHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              setSearch("");
              setSearchVisible(false);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="back-btn"
          >
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <KeyboardAvoidingView
            style={styles.searchContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher…"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={search}
              onChangeText={(v) => setSearch(v)}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              testID="messages-search-input"
            />
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => {
                setSearch("");
                setSearchVisible(false);
              }}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={openDrawer}
            testID="messages-menu-btn"
          >
            <Ionicons name="menu-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.headerWrap}>
          <ModuleHeader
            title="Messagerie"
            subtitle={subtitle}
            onBack={() => {
              if (activeChildId) {
                router.push(buildChildHomeTarget(activeChildId) as never);
                return;
              }
              router.back();
            }}
            rightIcon="menu-outline"
            onRightPress={openDrawer}
            testID="messages-header"
            backTestID="back-btn"
            titleTestID="messages-header-title"
            subtitleTestID="messages-header-subtitle"
            rightTestID="messages-menu-btn"
            topInset={insets.top}
          />
        </View>
      )}

      {!activeChildId && !searchVisible ? (
        <View style={styles.searchEntryRow}>
          <TouchableOpacity
            style={styles.searchEntryBtn}
            onPress={() => setSearchVisible(true)}
            testID="messages-search-btn"
          >
            <Ionicons name="search-outline" size={16} color={colors.primary} />
            <Text style={styles.searchEntryLabel}>Rechercher un message</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Folder Tabs */}
      <FolderTabs
        activeFolder={folder}
        unreadCount={unreadCount}
        onSelect={handleFolderChange}
      />

      {/* Message List */}
      {isLoading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <InfiniteScrollList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageRow item={item} onPress={handlePress} />
          )}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          emptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color={colors.warmBorder}
                />
                <Text style={styles.emptyTitle}>
                  {search
                    ? "Aucun résultat"
                    : folder === "inbox"
                      ? "Aucun message reçu"
                      : folder === "sent"
                        ? "Aucun message envoyé"
                        : folder === "drafts"
                          ? "Aucun brouillon"
                          : "Archives vides"}
                </Text>
                <Text style={styles.emptySub}>
                  {search
                    ? "Essayez avec d'autres mots-clés"
                    : "Les messages apparaîtront ici"}
                </Text>
              </View>
            ) : null
          }
          hasMore={hasMore}
          isLoadingMore={isLoading && messages.length > 0}
          onLoadMore={handleLoadMore}
          endOfListLabel="Tous les messages ont été chargés"
          contentContainerStyle={
            messages.length === 0 ? styles.emptyContainer : undefined
          }
          testID="messages-list"
        />
      )}

      {/* FAB Compose */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={handleCompose}
        activeOpacity={0.85}
        testID="compose-fab"
      >
        <Ionicons name="create-outline" size={26} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: 16 },
  searchEntryRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchEntryBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchEntryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },

  searchHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 11,
    gap: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.4)",
    paddingVertical: 4,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.warmAccent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
