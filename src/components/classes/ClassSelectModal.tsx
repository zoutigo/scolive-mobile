import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import type { TimetableClassOption } from "../../types/timetable.types";

type Props = {
  visible: boolean;
  classes: TimetableClassOption[];
  onSelect: (classId: string, className: string) => void;
  onDismiss: () => void;
};

export function ClassSelectModal({
  visible,
  classes,
  onSelect,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.className.toLowerCase().includes(q));
  }, [classes, query]);

  const handleSelect = useCallback(
    (item: TimetableClassOption) => {
      setQuery("");
      onSelect(item.classId, item.className);
    },
    [onSelect],
  );

  const handleDismiss = useCallback(() => {
    setQuery("");
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDismiss}
      testID="class-select-modal"
    >
      <View style={styles.overlay}>
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          testID="class-select-sheet"
        >
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <Text style={styles.title} testID="class-select-title">
              Choisir une classe
            </Text>
            <TouchableOpacity
              onPress={handleDismiss}
              testID="class-select-close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons
              name="search-outline"
              size={16}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher une classe…"
              placeholderTextColor={colors.textSecondary}
              clearButtonMode="while-editing"
              autoCapitalize="none"
              testID="class-select-search"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.classId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(item)}
                testID={`class-select-item-${item.classId}`}
                activeOpacity={0.7}
              >
                <View style={styles.itemInner}>
                  <Text
                    style={styles.itemLabel}
                    testID={`class-select-label-${item.classId}`}
                  >
                    {item.className}
                  </Text>
                  {item.studentCount != null && item.studentCount > 0 ? (
                    <Text style={styles.itemMeta}>
                      {item.studentCount} élève
                      {item.studentCount > 1 ? "s" : ""}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucune classe trouvée</Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            testID="class-select-list"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "75%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.warmBorder,
    alignSelf: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  itemInner: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.warmBorder,
  },
  empty: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
