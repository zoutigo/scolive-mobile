import React, { useCallback, useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../src/theme";
import { useAuthStore } from "../../src/store/auth.store";
import { useFeedStore } from "../../src/store/feed.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { feedApi } from "../../src/api/feed.api";
import { InfiniteScrollList } from "../../src/components/lists/InfiniteScrollList";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { FeedComposerCard } from "../../src/components/feed/FeedComposerCard";
import { FeedPostCard } from "../../src/components/feed/FeedPostCard";
import type {
  FeedFilter,
  FeedPost,
  FeedViewerRole,
} from "../../src/types/feed.types";

const FILTERS: Array<{
  key: FeedFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "all", label: "Tout", icon: "albums-outline" },
  { key: "featured", label: "À la une", icon: "sparkles-outline" },
  { key: "polls", label: "Sondages", icon: "stats-chart-outline" },
];

const FEED_ROLES: FeedViewerRole[] = [
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
  "SCHOOL_STAFF",
  "TEACHER",
  "PARENT",
  "STUDENT",
];

function resolveViewerRole(
  role: string | null | undefined,
): FeedViewerRole | null {
  if (!role) return null;
  return FEED_ROLES.includes(role as FeedViewerRole)
    ? (role as FeedViewerRole)
    : null;
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { schoolSlug, user } = useAuthStore();
  const showToast = useSuccessToastStore((state) => state.show);
  const viewerRole = resolveViewerRole(user?.activeRole ?? user?.role ?? null);
  const {
    posts,
    meta,
    filter,
    search,
    isLoading,
    isRefreshing,
    isLoadingMore,
    setFilter,
    setSearch,
    loadFeed,
    refreshFeed,
    loadMoreFeed,
    prependPost,
    removePost,
    applyLike,
    appendComment,
    applyPollVote,
  } = useFeedStore();

  const [searchVisible, setSearchVisible] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<FeedPost | null>(null);
  const load = useCallback(async () => {
    if (!schoolSlug) return;
    try {
      await loadFeed(schoolSlug);
    } catch (error) {
      console.error("FEED_LOAD_FAILED", error);
    }
  }, [loadFeed, schoolSlug]);

  useEffect(() => {
    void load();
  }, [load, filter, search]);

  function handleRefresh() {
    if (!schoolSlug) return;
    void refreshFeed(schoolSlug).catch((error) => {
      console.error("FEED_REFRESH_FAILED", error);
    });
  }

  function handleLoadMore() {
    if (!schoolSlug || !meta || posts.length >= meta.total || isLoadingMore) {
      return;
    }
    void loadMoreFeed(schoolSlug).catch((error) => {
      console.error("FEED_LOAD_MORE_FAILED", error);
    });
  }

  async function handleCreatePost(
    payload: Parameters<typeof feedApi.create>[1],
  ) {
    if (!schoolSlug) return;
    try {
      const created = await feedApi.create(schoolSlug, payload);
      prependPost(created);
      showToast({
        variant: "success",
        title: payload.type === "POLL" ? "Sondage publié" : "Actualité publiée",
        message:
          payload.type === "POLL"
            ? "Le sondage est maintenant visible dans le fil."
            : "Votre publication a été ajoutée au fil d'actualité.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Publication impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de publier cette actualité pour le moment.",
      });
      throw error;
    }
  }

  async function handleToggleLike(postId: string) {
    if (!schoolSlug) return;
    try {
      const result = await feedApi.toggleLike(schoolSlug, postId);
      applyLike(postId, result.liked, result.likesCount);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Réaction indisponible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer votre réaction.",
      });
    }
  }

  async function handleAddComment(postId: string, text: string) {
    if (!schoolSlug) return;
    try {
      const result = await feedApi.addComment(schoolSlug, postId, text);
      appendComment(postId, result.comment);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Commentaire non envoyé",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'ajouter ce commentaire.",
      });
    }
  }

  async function handleVote(postId: string, optionId: string) {
    if (!schoolSlug) return;
    try {
      const result = await feedApi.votePoll(schoolSlug, postId, optionId);
      applyPollVote(postId, result.votedOptionId, result.options);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Vote indisponible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer votre vote.",
      });
    }
  }

  async function handleDeletePost() {
    if (!schoolSlug || !deleteCandidate) {
      return;
    }

    const target = deleteCandidate;
    try {
      await feedApi.remove(schoolSlug, target.id);
      removePost(target.id);
      showToast({
        variant: "success",
        title: "Publication supprimée",
        message: "Cette actualité n'apparaît plus dans le fil.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Suppression impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer cette publication.",
      });
    } finally {
      setDeleteCandidate(null);
    }
  }

  async function handleUploadInlineImage(file: {
    uri: string;
    name: string;
    mimeType: string;
  }) {
    if (!schoolSlug) {
      throw new Error("Établissement introuvable");
    }
    return feedApi.uploadInlineImage(schoolSlug, file);
  }

  if (!viewerRole) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyTitle}>Fil indisponible</Text>
        <Text style={styles.emptySub}>
          Ce rôle ne dispose pas encore du module d'actualité.
        </Text>
      </View>
    );
  }

  const listBottomPadding = Math.max(insets.bottom, 18) + 90;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="feed-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Fil d'actualité</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => setSearchVisible((value) => !value)}
          testID="feed-search-btn"
        >
          <Ionicons name="search-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {searchVisible ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.searchWrap}
        >
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une publication"
            placeholderTextColor={colors.textSecondary}
            testID="feed-search-input"
          />
          <TouchableOpacity
            style={styles.searchClose}
            onPress={() => {
              setSearch("");
              setSearchVisible(false);
            }}
            testID="feed-search-close"
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      ) : null}

      {composerOpen ? (
        <ScrollView
          style={styles.composerScroll}
          contentContainerStyle={[
            styles.composerScrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.composerWrap}>
            <FeedComposerCard
              viewerRole={viewerRole}
              onSubmit={handleCreatePost}
              onUploadInlineImage={handleUploadInlineImage}
              onCancel={() => setComposerOpen(false)}
            />
          </View>
        </ScrollView>
      ) : isLoading && posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="newspaper-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Partager une annonce utile</Text>
              <Text style={styles.heroSub}>
                Informations d'école, rappels, sondages et vie quotidienne.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.heroAction}
              onPress={() => setComposerOpen(true)}
              testID="feed-open-composer"
            >
              <Ionicons name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          <InfiniteScrollList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FeedPostCard
                post={item}
                onToggleLike={handleToggleLike}
                onAddComment={handleAddComment}
                onVote={handleVote}
                onDelete={item.canManage ? setDeleteCandidate : undefined}
              />
            )}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            emptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="newspaper-outline"
                  size={46}
                  color={colors.warmBorder}
                />
                <Text style={styles.emptyTitle}>
                  {search
                    ? "Aucun résultat"
                    : "Aucune actualité pour le moment"}
                </Text>
                <Text style={styles.emptySub}>
                  {search
                    ? "Essayez d'autres mots-clés."
                    : "Les informations importantes de l'établissement apparaîtront ici."}
                </Text>
              </View>
            }
            hasMore={meta ? posts.length < meta.total : false}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            endOfListLabel="Vous avez atteint la fin du fil"
            contentContainerStyle={
              posts.length === 0
                ? [styles.emptyContainer, { paddingBottom: listBottomPadding }]
                : [styles.listContent, { paddingBottom: listBottomPadding }]
            }
            testID="feed-list"
          />
        </>
      )}

      {!composerOpen ? (
        <View
          style={[
            styles.bottomFilterBar,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
          testID="feed-filter-bottom-bar"
        >
          {FILTERS.map((entry) => (
            <TouchableOpacity
              key={entry.key}
              style={[
                styles.bottomFilterItem,
                filter === entry.key && styles.bottomFilterItemActive,
              ]}
              onPress={() => setFilter(entry.key)}
              testID={`feed-filter-${entry.key}`}
            >
              <Ionicons
                name={entry.icon}
                size={18}
                color={
                  filter === entry.key ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.bottomFilterLabel,
                  filter === entry.key && styles.bottomFilterLabelActive,
                ]}
              >
                {entry.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {!composerOpen ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: listBottomPadding - 4 }]}
          onPress={() => setComposerOpen(true)}
          activeOpacity={0.88}
          testID="feed-compose-fab"
        >
          <Ionicons name="create-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={Boolean(deleteCandidate)}
        title="Supprimer cette publication ?"
        subtitle="Action visible immédiatement"
        message="La publication sera retirée du fil d'actualité pour tous les utilisateurs autorisés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => {
          void handleDeletePost();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    marginTop: 2,
  },
  headerCopy: {
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.textPrimary,
  },
  searchClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D7E7F5",
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  heroAction: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  composerWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  composerScroll: {
    flex: 1,
  },
  composerScrollContent: {
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 14,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 10,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  bottomFilterBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.warmBorder,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  bottomFilterItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 52,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  bottomFilterItemActive: {
    backgroundColor: "#D7E7F5",
  },
  bottomFilterLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  bottomFilterLabelActive: {
    color: colors.primary,
  },
});
