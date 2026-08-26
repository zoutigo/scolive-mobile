import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { ConfirmDialog } from "../ConfirmDialog";
import { PageHelpModal, type PageHelpSection } from "../help/PageHelpModal";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import { FeedComposerCard } from "./FeedComposerCard";
import { FEED_FILTERS_TOUR_TARGETS } from "./feed-filters-tour.config";
import { FeedPostCard } from "./FeedPostCard";
import { orderFeedPosts } from "./feed.helpers";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  CreateFeedPayload,
  FeedFilters,
  FeedListMeta,
  FeedPost,
  FeedPostType,
  FeedTypeFilter,
  FeedViewerRole,
} from "../../types/feed.types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SEARCH_DEBOUNCE_MS = 300;

const NO_FEED_FILTERS: FeedFilters = { types: [], mine: false };

function hasActiveFeedFilters(filters: FeedFilters) {
  return filters.types.length > 0 || filters.mine;
}

type FeedPagePayload = {
  items: FeedPost[];
  meta: FeedListMeta;
};

type Props = {
  schoolSlug?: string | null;
  viewerRole: FeedViewerRole | null;
  renderHeader: (controls: { openHelp: () => void }) => React.ReactNode;
  loadPage: (input: {
    page: number;
    types: FeedTypeFilter[];
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
  /** Consultation seule : masque publication/commentaire/reaction, desactive
   * like et vote, quel que soit `canCompose`. Utilise quand un parent
   * consulte le fil de classe de son enfant via le menu enfant. */
  readOnly?: boolean;
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
  helpTitle: string;
  /** Flat paragraphs, no sub-chapters. Ignored when `helpSections` is provided. */
  helpBody?: string[];
  /** Paragraphs grouped under titled sub-chapters — preferred for new callers. */
  helpSections?: PageHelpSection[];
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
  readOnly = false,
  onCreatePost,
  onUploadInlineImage,
  onUploadAttachment,
  unavailableTitle,
  unavailableMessage,
  onPostsChange,
  helpTitle,
  helpBody,
  helpSections,
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
  const advanceOnboardingTourTarget = useOnboardingTourStore(
    (state) => state.advanceIfTarget,
  );
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [meta, setMeta] = useState<FeedListMeta | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<FeedFilters>(NO_FEED_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FeedFilters>(NO_FEED_FILTERS);
  const [filterScrollOverflowing, setFilterScrollOverflowing] = useState(false);
  const [filterScrollNearBottom, setFilterScrollNearBottom] = useState(false);
  const filterScrollLayoutHeightRef = useRef(0);
  const filterScrollContentHeightRef = useRef(0);
  const showFilterScrollHint =
    filterScrollOverflowing && !filterScrollNearBottom;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerType] = useState<FeedPostType>("POST");
  const [deleteCandidate, setDeleteCandidate] = useState<FeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

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
    advanceOnboardingTourTarget(FEED_FILTERS_TOUR_TARGETS.filterToggle);
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
    setDetailIndex(null);
    advanceOnboardingTourTarget(FEED_FILTERS_TOUR_TARGETS.apply);
  }

  function resetFilters() {
    setDraftFilters(NO_FEED_FILTERS);
    setAppliedFilters(NO_FEED_FILTERS);
  }

  function toggleDraftType(type: FeedTypeFilter) {
    setDraftFilters((current) => ({
      ...current,
      types: current.types.includes(type)
        ? current.types.filter((entry) => entry !== type)
        : [...current.types, type],
    }));
  }

  function clearDraftTypes() {
    setDraftFilters((current) => ({ ...current, types: [] }));
  }

  function toggleDraftMine() {
    setDraftFilters((current) => ({ ...current, mine: !current.mine }));
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
          types: appliedFilters.types,
          search: appliedSearch.trim(),
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
            : tRef.current("feed.errors.loadFailed"),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [appliedFilters, loadPage, schoolSlug, appliedSearch],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreatePost(payload: CreateFeedPayload) {
    if (!canCompose || readOnly || !onCreatePost) return;

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
        {renderHeader({ openHelp: () => setHelpVisible(true) })}
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{effectiveUnavailableTitle}</Text>
          <Text style={styles.emptySub}>{effectiveUnavailableMessage}</Text>
        </View>
      </View>
    );
  }

  const visiblePosts = appliedFilters.mine
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
                  onDelete={
                    item.canManage && !readOnly ? setDeleteCandidate : undefined
                  }
                  readOnly={readOnly}
                />
              </ScrollView>
            </View>
          )}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
            );
            setDetailIndex(newIndex);
          }}
          decelerationRate="fast"
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {renderHeader({ openHelp: () => setHelpVisible(true) })}

      <View style={styles.searchRow} testID={`${testIDPrefix}-search-row`}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInputField}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={effectiveSearchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={effectiveSearchPlaceholder}
            testID={`${testIDPrefix}-search-input`}
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchInput("")}
              testID={`${testIDPrefix}-search-clear`}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <OnboardingTarget id={FEED_FILTERS_TOUR_TARGETS.filterToggle}>
          <TouchableOpacity
            style={[
              styles.filterToggle,
              hasActiveFeedFilters(appliedFilters) && styles.filterToggleActive,
            ]}
            onPress={toggleFilters}
            testID={`${testIDPrefix}-filter-toggle`}
            accessibilityLabel={t("feed.filters.toggleAccessibilityLabel")}
          >
            <Ionicons
              name={
                hasActiveFeedFilters(appliedFilters)
                  ? "filter"
                  : "filter-outline"
              }
              size={18}
              color={
                hasActiveFeedFilters(appliedFilters)
                  ? colors.white
                  : colors.accentTeal
              }
            />
            {meta && meta.total > 0 ? (
              <View
                style={styles.filterToggleBadge}
                testID={`${testIDPrefix}-filter-total`}
              >
                <Text style={styles.filterToggleBadgeLabel}>
                  {meta.total > 99 ? "99+" : meta.total}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </OnboardingTarget>
      </View>

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

      {filtersOpen ? (
        <View
          style={styles.filterPanel}
          testID={`${testIDPrefix}-filter-panel`}
        >
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelHeaderIcon}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentTealDark}
              />
            </View>
            <Text style={styles.filterPanelHeaderTitle}>
              {t("feed.filters.toggleAccessibilityLabel")}
            </Text>
            {meta ? (
              <Text
                style={styles.filterResultsSummary}
                testID={`${testIDPrefix}-filter-results-summary`}
              >
                {t("feed.filters.resultsLabel").replace(
                  "{count}",
                  String(meta.total),
                )}
              </Text>
            ) : null}
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
              testID={`${testIDPrefix}-filter-scroll`}
            >
              <OnboardingTarget id={FEED_FILTERS_TOUR_TARGETS.typeChips}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>
                    {t("feed.filters.typeGroupLabel")}
                  </Text>
                  <View style={styles.filterChipsRow}>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        draftFilters.types.length === 0 &&
                          styles.filterChipActive,
                      ]}
                      onPress={clearDraftTypes}
                      testID={`${testIDPrefix}-filter-chip-all`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.types.length === 0 &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {t("feed.filters.all")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        draftFilters.types.includes("featured") &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => toggleDraftType("featured")}
                      testID={`${testIDPrefix}-filter-chip-featured`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.types.includes("featured") &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {t("feed.filters.featured")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        draftFilters.types.includes("polls") &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => toggleDraftType("polls")}
                      testID={`${testIDPrefix}-filter-chip-polls`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.types.includes("polls") &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {t("feed.filters.polls")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </OnboardingTarget>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("feed.filters.authorGroupLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      draftFilters.mine && styles.filterChipActive,
                    ]}
                    onPress={toggleDraftMine}
                    testID={`${testIDPrefix}-filter-chip-mine`}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftFilters.mine && styles.filterChipLabelActive,
                      ]}
                    >
                      {t("feed.filters.mine")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            {showFilterScrollHint ? (
              <View
                style={styles.filterScrollHint}
                pointerEvents="none"
                testID={`${testIDPrefix}-filter-scroll-hint`}
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
              testID={`${testIDPrefix}-filter-reset`}
            >
              <Text style={styles.filterActionResetLabel}>
                {t("feed.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID={`${testIDPrefix}-filter-close`}
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("feed.filters.close")}
              </Text>
            </TouchableOpacity>
            <OnboardingTarget
              id={FEED_FILTERS_TOUR_TARGETS.apply}
              style={styles.filterActionApplyTarget}
            >
              <TouchableOpacity
                style={styles.filterActionApply}
                onPress={applyFilters}
                testID={`${testIDPrefix}-filter-apply`}
              >
                <Ionicons name="checkmark" size={15} color={colors.white} />
                <Text style={styles.filterActionApplyLabel}>
                  {t("feed.filters.apply")}
                </Text>
              </TouchableOpacity>
            </OnboardingTarget>
          </View>
        </View>
      ) : composerOpen &&
        canCompose &&
        !readOnly &&
        onCreatePost &&
        onUploadInlineImage ? (
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
              onDelete={
                item.canManage && !readOnly ? setDeleteCandidate : undefined
              }
              onPress={() => setDetailIndex(index)}
              readOnly={readOnly}
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
                {appliedSearch ? t("feed.empty.noResultsTitle") : emptyTitle}
              </Text>
              <Text style={styles.emptySub}>
                {appliedSearch
                  ? t("feed.empty.noResultsMessage")
                  : emptyMessage}
              </Text>
            </View>
          }
          hasMore={
            appliedFilters.mine
              ? false
              : meta
                ? posts.length < meta.total
                : false
          }
          isLoadingMore={isLoadingMore}
          onLoadMore={() => {
            if (
              appliedFilters.mine ||
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
      )}

      {!filtersOpen &&
      !composerOpen &&
      detailIndex === null &&
      canCompose &&
      !readOnly ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: listBottomPadding - 4 }]}
          onPress={() => setComposerOpen(true)}
          activeOpacity={0.88}
          testID={`${testIDPrefix}-compose-fab`}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={helpTitle}
        body={helpBody}
        sections={helpSections}
        closeLabel={t("feed.help.close")}
        testID={`${testIDPrefix}-help`}
      />

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
  searchInputField: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
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
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  filterResultsSummary: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
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
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
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
  filterActionApplyTarget: {
    flex: 1,
  },
  filterActionApply: {
    flex: 1,
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
