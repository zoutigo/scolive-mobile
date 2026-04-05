import React, { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  type FlatListProps,
  type ListRenderItem,
} from "react-native";
import { colors } from "../../theme";

type InfiniteScrollListProps<T> = {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  emptyComponent?: React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
  endOfListLabel?: string;
} & Omit<
  FlatListProps<T>,
  | "data"
  | "renderItem"
  | "keyExtractor"
  | "onRefresh"
  | "refreshing"
  | "ListEmptyComponent"
  | "contentContainerStyle"
  | "ListFooterComponent"
>;

export function canTriggerInfiniteScroll(params: {
  itemCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  blockedByMomentum: boolean;
}) {
  return (
    params.itemCount > 0 &&
    params.hasMore &&
    !params.isLoadingMore &&
    !params.blockedByMomentum
  );
}

export function InfiniteScrollList<T>({
  data,
  renderItem,
  keyExtractor,
  onRefresh,
  refreshing = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  emptyComponent = null,
  contentContainerStyle,
  testID = "infinite-scroll-list",
  endOfListLabel = "Tous les éléments ont été chargés",
  onMomentumScrollBegin,
  onEndReached,
  onEndReachedThreshold,
  ...rest
}: InfiniteScrollListProps<T>) {
  const blockedByMomentumRef = useRef(false);

  const footer = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer} testID="infinite-scroll-loading-footer">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>Chargement…</Text>
        </View>
      );
    }

    if (!hasMore && data.length > 0) {
      return (
        <View style={styles.footer} testID="infinite-scroll-end-footer">
          <Text style={styles.endText}>{endOfListLabel}</Text>
        </View>
      );
    }

    return null;
  }, [data.length, endOfListLabel, hasMore, isLoadingMore]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={emptyComponent}
      ListFooterComponent={footer}
      contentContainerStyle={contentContainerStyle}
      onMomentumScrollBegin={(event) => {
        blockedByMomentumRef.current = false;
        onMomentumScrollBegin?.(event);
      }}
      onEndReached={(info) => {
        onEndReached?.(info);
        if (
          canTriggerInfiniteScroll({
            itemCount: data.length,
            hasMore,
            isLoadingMore,
            blockedByMomentum: blockedByMomentumRef.current,
          })
        ) {
          blockedByMomentumRef.current = true;
          onLoadMore?.();
        }
      }}
      onEndReachedThreshold={onEndReachedThreshold ?? 0.35}
      showsVerticalScrollIndicator={false}
      testID={testID}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  endText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
