import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { feedApi } from "../../api/feed.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { ConfirmDialog } from "../ConfirmDialog";
import { FeedComposerCard } from "./FeedComposerCard";
import { FeedFilterTabs } from "./FeedFilterTabs";
import { FeedPostCard } from "./FeedPostCard";
import { orderFeedPosts } from "./feed.helpers";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  CreateFeedPayload,
  FeedFilter,
  FeedListMeta,
  FeedPost,
  FeedPostType,
  FeedViewerRole,
} from "../../types/feed.types";

const SCREEN_WIDTH = Dimensions.get("window").width;

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
  onCreatePost?: (payload: CreateFeedPayload) => Promise<FeedPost>;
  onUploadInlineImage?: (file: {
    uri: string;
    name: string;
    mimeType: string;
  }) => Promise<{ url: string }>;
  onUploadAttachment?: (file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }) => Promise<{
    fileName: string;
    fileUrl: string | null;
    sizeLabel: string | null;
  }>;
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
  searchPlaceholder,
  canCompose = false,
  onCreatePost,
  onUploadInlineImage,
  onUploadAttachment,
  unavailableTitle,
  unavailableMessage,
  onPostsChange,
}: Props) {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const effectiveSearchPlaceholder =
    searchPlaceholder ?? t("feed.search.placeholder");
  const effectiveUnavailableTitle =
    unavailableTitle ?? t("feed.unavailable.title");
  const effectiveUnavailableMessage =
    unavailableMessage ?? t("feed.unavailable.message");
  const insets = useSafeAreaInsets();
  const showToast = useSuccessToastStore((state) => state.show);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [meta, setMeta] = useState<FeedListMeta | null>(null);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType] = useState<FeedPostType>("POST");
  const [deleteCandidate, setDeleteCandidate] = useState<FeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const seenPostIdsRef = useRef<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<
    Partial<Record<FeedFilter, number>>
  >({});
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const markRead = useCallback((postId: string) => {
    if (seenPostIdsRef.current.has(postId)) return;
    seenPostIdsRef.current.add(postId);
    setUnreadCounts((prev) => {
      const current = prev[filterRef.current] ?? 0;
      if (current <= 0) return prev;
      return { ...prev, [filterRef.current]: current - 1 };
    });
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((token) => {
        if (token.isViewable && token.item) {
          const post = token.item as FeedPost;
          if (!seenPostIdsRef.current.has(post.id)) {
            seenPostIdsRef.current.add(post.id);
            setUnreadCounts((prev) => {
              const current = prev[filterRef.current] ?? 0;
              if (current <= 0) return prev;
              return { ...prev, [filterRef.current]: current - 1 };
            });
          }
        }
      });
    },
  );

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
      if (!schoolSlug) return;

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

        if (mode !== "more") {
          const unseenCount = response.items.filter(
            (p) => !seenPostIdsRef.current.has(p.id),
          ).length;
          setUnreadCounts((prev) => ({
            ...prev,
            [filter]: unseenCount,
          }));
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : tRef.current("feed.errors.loadFailed"),
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
    if (!canCompose || !onCreatePost) return;

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
        title:
          payload.type === "POLL"
            ? t("feed.toast.pollPublishedTitle")
            : t("feed.toast.postPublishedTitle"),
        message:
          payload.type === "POLL"
            ? t("feed.toast.pollPublishedMessage")
            : t("feed.toast.postPublishedMessage"),
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: t("feed.toast.publishErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("feed.toast.publishErrorMessage"),
      });
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
        title: t("feed.toast.likeErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("feed.toast.likeErrorMessage"),
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
        title: t("feed.toast.commentErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("feed.toast.commentErrorMessage"),
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
        title: t("feed.toast.voteErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("feed.toast.voteErrorMessage"),
      });
    }
  }

  async function handleDeletePost() {
    if (!schoolSlug || !deleteCandidate) return;

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
        title: t("feed.toast.deleteSuccessTitle"),
        message: deleteSuccessMessage,
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: t("feed.toast.deleteErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("feed.toast.deleteErrorMessage"),
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
          <Text style={styles.emptyTitle}>{effectiveUnavailableTitle}</Text>
          <Text style={styles.emptySub}>{effectiveUnavailableMessage}</Text>
        </View>
      </View>
    );
  }

  const visiblePosts =
    filter === "mine"
      ? orderFeedPosts(posts.filter((post) => post.authoredByViewer))
      : orderFeedPosts(posts);

  const listBottomPadding =
    Math.max(insets.bottom, 18) + BOTTOM_TAB_BAR_HEIGHT + 72;

  function renderDetailPager() {
    const safeIndex = Math.min(detailIndex ?? 0, visiblePosts.length - 1);
    return (
      <View style={styles.pagerRoot}>
        <View style={styles.pagerNav}>
          <TouchableOpacity
            style={styles.pagerBackBtn}
            onPress={() => setDetailIndex(null)}
            testID="feed-detail-back"
          >
            <Ionicons name="arrow-back" size={15} color={colors.primary} />
            <Text style={styles.pagerBackText}>
              {t("feed.detail.backToList")}
            </Text>
          </TouchableOpacity>
          <Text style={styles.pagerCount} testID="feed-detail-pager-count">
            {safeIndex + 1} / {visiblePosts.length}
          </Text>
        </View>

        <FlatList
          data={visiblePosts}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={safeIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.pagerPage}>
              <ScrollView
                contentContainerStyle={[
                  styles.pagerScrollContent,
                  { paddingBottom: listBottomPadding },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <FeedPostCard
                  post={item}
                  onToggleLike={handleToggleLike}
                  onAddComment={handleAddComment}
                  onVote={handleVote}
                  onDelete={item.canManage ? setDeleteCandidate : undefined}
                />
              </ScrollView>
            </View>
          )}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setDetailIndex(newIndex);
            const post = visiblePosts[newIndex];
            if (post) markRead(post.id);
          }}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          decelerationRate="fast"
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {renderHeader({
        toggleSearch: () => setSearchVisible((value) => !value),
        searchVisible,
      })}

      <FeedFilterTabs
        activeFilter={filter}
        unreadCounts={unreadCounts}
        onSelect={(f) => {
          setFilter(f);
          setDetailIndex(null);
        }}
      />

      {searchVisible ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.searchWrap}
        >
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={effectiveSearchPlaceholder}
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
            styles.composerWrap,
            { paddingBottom: Math.max(insets.bottom, 20) + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FeedComposerCard
            key={`feed-composer-${composerType}`}
            viewerRole={viewerRole}
            initialType={composerType}
            onSubmit={handleCreatePost}
            onUploadInlineImage={onUploadInlineImage}
            onUploadAttachment={onUploadAttachment}
            onCancel={() => setComposerOpen(false)}
          />
        </ScrollView>
      ) : isLoading && posts.length === 0 ? (
        <View style={styles.center} testID={`${testIDPrefix}-loading`}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : detailIndex !== null ? (
        renderDetailPager()
      ) : (
        <InfiniteScrollList
          data={visiblePosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <FeedPostCard
              post={item}
              onToggleLike={handleToggleLike}
              onAddComment={handleAddComment}
              onVote={handleVote}
              onDelete={item.canManage ? setDeleteCandidate : undefined}
              onPress={() => setDetailIndex(index)}
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
                {search ? t("feed.empty.noResultsTitle") : emptyTitle}
              </Text>
              <Text style={styles.emptySub}>
                {search ? t("feed.empty.noResultsMessage") : emptyMessage}
              </Text>
            </View>
          }
          hasMore={
            filter === "mine" ? false : meta ? posts.length < meta.total : false
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
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          testID={listTestID}
        />
      )}

      {!composerOpen && detailIndex === null && canCompose ? (
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
        title={t("feed.deleteDialog.title")}
        subtitle={t("feed.deleteDialog.subtitle")}
        message={t("feed.deleteDialog.message").replace(
          "{context}",
          deleteContextLabel,
        )}
        confirmLabel={t("feed.deleteDialog.confirm")}
        cancelLabel={t("feed.deleteDialog.cancel")}
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
  composerScroll: {
    flex: 1,
  },
  composerWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 0,
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
  pagerRoot: {
    flex: 1,
  },
  pagerNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  pagerBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingRight: 8,
  },
  pagerBackText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  pagerCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  pagerPage: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  pagerScrollContent: {
    padding: 16,
    gap: 12,
  },
});
