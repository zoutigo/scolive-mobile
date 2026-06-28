import React, { useCallback, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewabilityConfig,
  type ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { FeedPostCard } from "./FeedPostCard";
import { useTranslation } from "../../i18n/useTranslation";
import type { FeedPost } from "../../types/feed.types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  posts: FeedPost[];
  initialIndex: number;
  onClose: () => void;
  onMarkRead: (postId: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onVote?: (postId: string, optionId: string) => void;
  onDelete?: (post: FeedPost) => void;
};

export function FeedPostDetailModal({
  posts,
  initialIndex,
  onClose,
  onMarkRead,
  onToggleLike,
  onAddComment,
  onVote,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<FeedPost>>(null);
  const currentIndexRef = useRef(initialIndex);

  const onMarkReadRef = useRef(onMarkRead);
  onMarkReadRef.current = onMarkRead;

  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 60,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((token) => {
        if (token.isViewable && token.item) {
          onMarkReadRef.current((token.item as FeedPost).id);
        }
      });
    },
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FeedPost; index: number }) => (
      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              {index + 1} / {posts.length}
            </Text>
          </View>
          <FeedPostCard
            post={item}
            onToggleLike={onToggleLike}
            onAddComment={onAddComment}
            onVote={onVote}
            onDelete={item.canManage ? onDelete : undefined}
          />
        </ScrollView>
      </View>
    ),
    [insets.bottom, posts.length, onToggleLike, onAddComment, onVote, onDelete],
  );

  const keyExtractor = useCallback((item: FeedPost) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<FeedPost> | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  const onScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      currentIndexRef.current = newIndex;
    },
    [],
  );

  return (
    <Modal
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="feed-detail-close"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t("feed.detail.headerTitle")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onScrollEnd}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          decelerationRate="fast"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    gap: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 38,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  pagination: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.warmSurface,
  },
  paginationText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
