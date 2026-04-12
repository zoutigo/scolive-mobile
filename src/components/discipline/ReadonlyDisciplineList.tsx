import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { StudentLifeEvent } from "../../types/discipline.types";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { LifeEventCard } from "./LifeEventCard";

const DEFAULT_PAGE_SIZE = 8;

interface Props {
  events: StudentLifeEvent[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySub?: string;
  onRefresh?: () => void;
  testID?: string;
  pageSize?: number;
}

export function ReadonlyDisciplineList({
  events,
  isLoading = false,
  isRefreshing = false,
  emptyIcon = "shield-checkmark-outline",
  emptyTitle = "Aucun événement",
  emptySub = "Aucun événement enregistré pour cette période.",
  onRefresh,
  testID,
  pageSize = DEFAULT_PAGE_SIZE,
}: Props) {
  const eventIdsKey = React.useMemo(
    () => events.map((event) => event.id).join("|"),
    [events],
  );
  const [visibleCount, setVisibleCount] = React.useState(
    Math.min(pageSize, events.length),
  );

  React.useEffect(() => {
    setVisibleCount(Math.min(pageSize, events.length));
  }, [eventIdsKey, events.length, pageSize]);

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered} testID="discipline-list-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  return (
    <InfiniteScrollList
      data={visibleEvents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <LifeEventCard event={item} />}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      onLoadMore={() => {
        setVisibleCount((current) =>
          Math.min(current + pageSize, events.length),
        );
      }}
      hasMore={hasMore}
      emptyComponent={
        <View style={styles.empty} testID="discipline-list-empty">
          <View style={styles.emptyIconWrap}>
            <Ionicons
              name={emptyIcon as "shield-checkmark-outline"}
              size={48}
              color={colors.warmBorder}
            />
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySub}>{emptySub}</Text>
        </View>
      }
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      testID={testID ?? "discipline-list"}
      endOfListLabel="Tous les événements ont été chargés"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
});
