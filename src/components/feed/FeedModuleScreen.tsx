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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { feedApi } from "../../api/feed.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { ConfirmDialog } from "../ConfirmDialog";
import { FeedComposerCard } from "./FeedComposerCard";
import { FeedPostCard } from "./FeedPostCard";
import { orderFeedPosts } from "./feed.helpers";
import type {
  CreateFeedPayload,
  FeedFilter,
  FeedListMeta,
  FeedPost,
  FeedPostType,
  FeedViewerRole,
} from "../../types/feed.types";

const FILTERS: Array<{
  key: FeedFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "all", label: "Tout", icon: "albums-outline" },
  { key: "featured", label: "À la une", icon: "sparkles-outline" },
  { key: "polls", label: "Sondages", icon: "stats-chart-outline" },
  { key: "mine", label: "Mes posts", icon: "person-outline" },
];

type FeedPagePayload = {
  items: FeedPost[];
  meta: FeedListMeta;
};

type Props = {
  schoolSlug?: string | null;
  viewerRole: FeedViewerRole | null;
  renderHeader: (controls: {
    toggleSearch: () => void;
    searchVisible: boolean;
  }) => React.ReactNode;
  loadPage: (input: {
    page: number;
    filter: FeedFilter;
    search: string;
  }) => Promise<FeedPagePayload>;
  testIDPrefix: string;
  listTestID: string;
  endOfListLabel: string;
  emptyTitle: string;
  emptyMessage: string;
  deleteSuccessMessage: string;
  deleteContextLabel: string;
  searchPlaceholder?: string;
  canCompose?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroSearchEnabled?: boolean;
  heroComposerActionsEnabled?: boolean;
  onCreatePost?: (payload: CreateFeedPayload) => Promise<FeedPost>;
  onUploadInlineImage?: (file: {
    uri: string;
    name: string;
    mimeType: string;
  }) => Promise<{ url: string }>;
  unavailableTitle?: string;
  unavailableMessage?: string;
  onPostsChange?: (posts: FeedPost[]) => void;
};

export function FeedModuleScreen({
  schoolSlug,
  viewerRole,
  renderHeader,
  loadPage,
  testIDPrefix,
  listTestID,
  endOfListLabel,
  emptyTitle,
  emptyMessage,
  deleteSuccessMessage,
  deleteContextLabel,
  searchPlaceholder = "Rechercher une publication",
  canCompose = false,
  heroTitle,
  heroSubtitle,
  heroSearchEnabled = false,
  heroComposerActionsEnabled = false,
  onCreatePost,
  onUploadInlineImage,
  unavailableTitle = "Fil indisponible",
  unavailableMessage = "Ce rôle ne dispose pas encore du module d'actualité.",
  onPostsChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const showToast = useSuccessToastStore((state) => state.show);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [meta, setMeta] = useState<FeedListMeta | null>(null);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<FeedPostType>("POST");
  const [deleteCandidate, setDeleteCandidate] = useState<FeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const commitPosts = useCallback(
    (updater: FeedPost[] | ((current: FeedPost[]) => FeedPost[])) => {
      setPosts((current) => {
        const next =
          typeof updater === "function"
            ? (updater as (current: FeedPost[]) => FeedPost[])(current)
            : updater;
        onPostsChange?.(next);
        return next;
      });
    },
    [onPostsChange],
  );

  const load = useCallback(
    async (mode: "load" | "refresh" | "more" = "load") => {
      if (!schoolSlug) {
        return;
      }

      if (mode === "load") setIsLoading(true);
      if (mode === "refresh") setIsRefreshing(true);
      if (mode === "more") setIsLoadingMore(true);

      try {
        setErrorMessage(null);
        const page = mode === "more" ? (meta?.page ?? 1) + 1 : 1;
        const response = await loadPage({
          page,
          filter: filter === "mine" ? "all" : filter,
          search: search.trim(),
        });

        commitPosts((current) =>
          mode === "more"
            ? [
                ...current,
                ...response.items.filter(
                  (item) => !current.some((post) => post.id === item.id),
                ),
              ]
            : response.items,
        );
        setMeta(response.meta);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger le fil.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [filter, loadPage, schoolSlug, search],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreatePost(payload: CreateFeedPayload) {
    if (!canCompose || !onCreatePost) {
      return;
    }

    try {
      const created = await onCreatePost(payload);
      commitPosts((current) => [
        created,
        ...current.filter((entry) => entry.id !== created.id),
      ]);
      setMeta((current) =>
        current ? { ...current, total: current.total + 1 } : current,
      );
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
      commitPosts((current) =>
        current.map((entry) =>
          entry.id === postId
            ? {
                ...entry,
                likedByViewer: result.liked,
                likesCount: result.likesCount,
              }
            : entry,
        ),
      );
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
      commitPosts((current) =>
        current.map((entry) =>
          entry.id === postId
            ? { ...entry, comments: [...entry.comments, result.comment] }
            : entry,
        ),
      );
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
      commitPosts((current) =>
        current.map((entry) => {
          if (entry.id !== postId || entry.type !== "POLL" || !entry.poll) {
            return entry;
          }
          return {
            ...entry,
            poll: {
              ...entry.poll,
              votedOptionId: result.votedOptionId,
              options: result.options,
            },
          };
        }),
      );
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
      commitPosts((current) =>
        current.filter((entry) => entry.id !== target.id),
      );
      setMeta((current) =>
        current
          ? { ...current, total: Math.max(0, current.total - 1) }
          : current,
      );
      showToast({
        variant: "success",
        title: "Publication supprimée",
        message: deleteSuccessMessage,
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

  if (!viewerRole) {
    return (
      <View style={styles.root}>
        {renderHeader({
          toggleSearch: () => setSearchVisible((value) => !value),
          searchVisible,
        })}
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{unavailableTitle}</Text>
          <Text style={styles.emptySub}>{unavailableMessage}</Text>
        </View>
      </View>
    );
  }

  const visiblePosts =
    filter === "mine"
      ? orderFeedPosts(posts.filter((post) => post.authoredByViewer))
      : orderFeedPosts(posts);

  const showHeroSearch = heroSearchEnabled;
  const showHeroComposerActions =
    heroComposerActionsEnabled &&
    canCompose &&
    Boolean(onCreatePost) &&
    Boolean(onUploadInlineImage);
  const showCompactHeroControls =
    !heroTitle && !heroSubtitle && (showHeroSearch || showHeroComposerActions);
  const listBottomPadding =
    Math.max(insets.bottom, 18) +
    (canCompose && !showHeroComposerActions ? 90 : 72);
  const showHeroControls = showHeroSearch || showHeroComposerActions;

  return (
    <View style={styles.root}>
      {renderHeader({
        toggleSearch: () => setSearchVisible((value) => !value),
        searchVisible,
      })}

      {searchVisible && !showHeroSearch ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.searchWrap}
        >
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            testID={`${testIDPrefix}-search-input`}
          />
          <TouchableOpacity
            style={styles.searchClose}
            onPress={() => {
              setSearch("");
              setSearchVisible(false);
            }}
            testID={`${testIDPrefix}-search-close`}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBanner} testID={`${testIDPrefix}-error`}>
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colors.notification}
          />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {composerOpen && canCompose && onCreatePost && onUploadInlineImage ? (
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
              key={`feed-composer-${composerType}`}
              viewerRole={viewerRole}
              initialType={composerType}
              onSubmit={handleCreatePost}
              onUploadInlineImage={onUploadInlineImage}
              onCancel={() => setComposerOpen(false)}
            />
          </View>
        </ScrollView>
      ) : isLoading && posts.length === 0 ? (
        <View style={styles.center} testID={`${testIDPrefix}-loading`}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {heroTitle || heroSubtitle || showHeroControls ? (
            <View style={styles.heroCard} testID={`${testIDPrefix}-hero-card`}>
              {showCompactHeroControls ? (
                <View
                  style={styles.heroControlsRow}
                  testID={`${testIDPrefix}-hero-controls-row`}
                >
                  {showHeroSearch ? (
                    <TouchableOpacity
                      style={styles.heroActionIcon}
                      onPress={() => setSearchVisible((value) => !value)}
                      testID={`${testIDPrefix}-hero-search-btn`}
                    >
                      <Ionicons
                        name="search-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  ) : null}
                  {showHeroComposerActions ? (
                    <>
                      <TouchableOpacity
                        style={styles.heroPrimaryAction}
                        onPress={() => {
                          setComposerType("POST");
                          setComposerOpen(true);
                        }}
                        testID={`${testIDPrefix}-open-composer-post`}
                      >
                        <Ionicons
                          name="add"
                          size={16}
                          color={colors.warmAccent}
                        />
                        <Text style={styles.heroPrimaryActionText}>Info</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.heroPrimaryAction}
                        onPress={() => {
                          setComposerType("POLL");
                          setComposerOpen(true);
                        }}
                        testID={`${testIDPrefix}-open-composer-poll`}
                      >
                        <Ionicons
                          name="add"
                          size={16}
                          color={colors.warmAccent}
                        />
                        <Text style={styles.heroPrimaryActionText}>
                          Sondage
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              ) : (
                <View style={styles.heroTopRow}>
                  {heroTitle || heroSubtitle ? (
                    <>
                      <View style={styles.heroIcon}>
                        <Ionicons
                          name="newspaper-outline"
                          size={22}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.heroCopy}>
                        {heroTitle ? (
                          <Text style={styles.heroTitle}>{heroTitle}</Text>
                        ) : null}
                        {heroSubtitle ? (
                          <Text style={styles.heroSub}>{heroSubtitle}</Text>
                        ) : null}
                      </View>
                    </>
                  ) : (
                    <View style={styles.heroTopSpacer} />
                  )}
                  {showHeroSearch ? (
                    <TouchableOpacity
                      style={styles.heroActionIcon}
                      onPress={() => setSearchVisible((value) => !value)}
                      testID={`${testIDPrefix}-hero-search-btn`}
                    >
                      <Ionicons
                        name="search-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  ) : null}
                  {!showHeroSearch && !showHeroComposerActions && canCompose ? (
                    <TouchableOpacity
                      style={styles.heroAction}
                      onPress={() => {
                        setComposerType("POST");
                        setComposerOpen(true);
                      }}
                      testID={`${testIDPrefix}-open-composer`}
                    >
                      <Ionicons name="add" size={18} color={colors.white} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {showHeroSearch && searchVisible ? (
                <View style={styles.heroSearchWrap}>
                  <TextInput
                    style={styles.heroSearchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    testID={`${testIDPrefix}-search-input`}
                  />
                  <TouchableOpacity
                    style={styles.heroSearchClose}
                    onPress={() => {
                      setSearch("");
                      setSearchVisible(false);
                    }}
                    testID={`${testIDPrefix}-search-close`}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ) : null}

              {showHeroComposerActions && !showCompactHeroControls ? (
                <View style={styles.heroActionsRow}>
                  <TouchableOpacity
                    style={styles.heroPrimaryAction}
                    onPress={() => {
                      setComposerType("POST");
                      setComposerOpen(true);
                    }}
                    testID={`${testIDPrefix}-open-composer-post`}
                  >
                    <Ionicons name="add" size={16} color={colors.warmAccent} />
                    <Text style={styles.heroPrimaryActionText}>Info</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.heroPrimaryAction}
                    onPress={() => {
                      setComposerType("POLL");
                      setComposerOpen(true);
                    }}
                    testID={`${testIDPrefix}-open-composer-poll`}
                  >
                    <Ionicons name="add" size={16} color={colors.warmAccent} />
                    <Text style={styles.heroPrimaryActionText}>Sondage</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ) : null}

          <InfiniteScrollList
            data={visiblePosts}
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
            onRefresh={() => {
              void load("refresh");
            }}
            emptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="newspaper-outline"
                  size={46}
                  color={colors.warmBorder}
                />
                <Text style={styles.emptyTitle}>
                  {search ? "Aucun résultat" : emptyTitle}
                </Text>
                <Text style={styles.emptySub}>
                  {search ? "Essayez d'autres mots-clés." : emptyMessage}
                </Text>
              </View>
            }
            hasMore={
              filter === "mine"
                ? false
                : meta
                  ? posts.length < meta.total
                  : false
            }
            isLoadingMore={isLoadingMore}
            onLoadMore={() => {
              if (
                filter === "mine" ||
                !meta ||
                posts.length >= meta.total ||
                isLoadingMore
              ) {
                return;
              }
              void load("more");
            }}
            endOfListLabel={endOfListLabel}
            contentContainerStyle={
              visiblePosts.length === 0
                ? [styles.emptyContainer, { paddingBottom: listBottomPadding }]
                : [styles.listContent, { paddingBottom: listBottomPadding }]
            }
            testID={listTestID}
          />
        </>
      )}

      {!composerOpen ? (
        <View
          style={[
            styles.bottomFilterBar,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
          testID={`${testIDPrefix}-filter-bottom-bar`}
        >
          {FILTERS.map((entry) => (
            <TouchableOpacity
              key={entry.key}
              style={[
                styles.bottomFilterItem,
                filter === entry.key && styles.bottomFilterItemActive,
              ]}
              onPress={() => setFilter(entry.key)}
              testID={`${testIDPrefix}-filter-${entry.key}`}
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

      {!composerOpen && canCompose && !showHeroComposerActions ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: listBottomPadding - 4 }]}
          onPress={() => setComposerOpen(true)}
          activeOpacity={0.88}
          testID={`${testIDPrefix}-compose-fab`}
        >
          <Ionicons name="create-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={Boolean(deleteCandidate)}
        title="Supprimer cette publication ?"
        subtitle="Action visible immédiatement"
        message={`La publication sera retirée du ${deleteContextLabel} pour les lecteurs autorisés.`}
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
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f2b6be",
    backgroundColor: "#fff0f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.notification,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(12,95,168,0.2)",
    backgroundColor: "rgba(12,95,168,0.1)",
    padding: 18,
    gap: 12,
  },
  heroTopRow: {
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
  heroTopSpacer: {
    flex: 1,
  },
  heroControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  heroActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(12,95,168,0.2)",
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroSearchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.textPrimary,
  },
  heroSearchClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroPrimaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  heroPrimaryActionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
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
