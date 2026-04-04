import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
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
import { FolderTabs } from "../../../src/components/messaging/FolderTabs";
import { MessageRow } from "../../../src/components/messaging/MessageRow";
import type {
  FolderKey,
  MessageListItem,
} from "../../../src/types/messaging.types";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();

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

  const load = useCallback(() => {
    if (schoolSlug) loadMessages(schoolSlug);
  }, [schoolSlug, loadMessages]);

  // Reload when folder or search changes
  useEffect(() => {
    load();
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
    if (schoolSlug) refreshMessages(schoolSlug);
  }

  function handleLoadMore() {
    if (schoolSlug && meta && messages.length < meta.total && !isLoading) {
      loadMoreMessages(schoolSlug);
    }
  }

  const hasMore = meta ? messages.length < meta.total : false;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>

        {searchVisible ? (
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
              onPress={() => {
                setSearch("");
                setSearchVisible(false);
              }}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        ) : (
          <>
            <Text style={styles.headerTitle}>Messagerie</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setSearchVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                testID="messages-search-btn"
              >
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

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
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageRow item={item} onPress={handlePress} />
          )}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
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
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                style={styles.loadMore}
                onPress={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Charger plus ({meta!.total - messages.length} restants)
                  </Text>
                )}
              </TouchableOpacity>
            ) : null
          }
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { flexShrink: 0 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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

  loadMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
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
