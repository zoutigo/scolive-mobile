import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { StudentLifeEvent } from "../../types/discipline.types";
import { LifeEventCard } from "./LifeEventCard";

interface Props {
  events: StudentLifeEvent[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySub?: string;
  showActions?: boolean;
  canEdit?: (event: StudentLifeEvent) => boolean;
  canDelete?: (event: StudentLifeEvent) => boolean;
  onEdit?: (event: StudentLifeEvent) => void;
  onDelete?: (event: StudentLifeEvent) => void;
  onRefresh?: () => void;
  testID?: string;
}

export function DisciplineList({
  events,
  isLoading = false,
  isRefreshing = false,
  emptyIcon = "shield-checkmark-outline",
  emptyTitle = "Aucun événement",
  emptySub = "Aucun événement enregistré pour cette période.",
  showActions = false,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onRefresh,
  testID,
}: Props) {
  if (isLoading && events.length === 0) {
    return (
      <View style={styles.centered} testID="discipline-list-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (events.length === 0) {
    return (
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
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID={testID ?? "discipline-list"}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    >
      {events.map((event) => (
        <LifeEventCard
          key={event.id}
          event={event}
          showActions={showActions}
          canEdit={canEdit ? canEdit(event) : false}
          canDelete={canDelete ? canDelete(event) : false}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },

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
