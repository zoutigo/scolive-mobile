import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import type { RecipientOption } from "../../types/messaging.types";

interface Props {
  visible: boolean;
  recipients: RecipientOption[];
  selected: RecipientOption[];
  onClose: () => void;
  onConfirm: (selected: RecipientOption[]) => void;
}

export function RecipientPickerModal({
  visible,
  recipients,
  selected,
  onClose,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] =
    useState<RecipientOption[]>(selected);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.subtitle?.toLowerCase().includes(q),
    );
  }, [recipients, search]);

  function toggle(option: RecipientOption) {
    setLocalSelected((prev) => {
      const exists = prev.some((r) => r.value === option.value);
      if (exists) return prev.filter((r) => r.value !== option.value);
      return [...prev, option];
    });
  }

  function handleOpen() {
    setLocalSelected(selected);
    setSearch("");
  }

  function handleConfirm() {
    onConfirm(localSelected);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleOpen}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelBtn}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Destinataires</Text>
            <TouchableOpacity
              onPress={handleConfirm}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="recipient-picker-confirm"
            >
              <Text
                style={[
                  styles.doneBtn,
                  localSelected.length === 0 && styles.doneBtnDisabled,
                ]}
              >
                OK ({localSelected.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons
              name="search-outline"
              size={16}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un destinataire…"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              testID="recipient-search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected chips */}
          {localSelected.length > 0 && (
            <View style={styles.chips}>
              {localSelected.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={styles.chip}
                  onPress={() => toggle(r)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {r.label}
                  </Text>
                  <Ionicons name="close" size={12} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(r) => r.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = localSelected.some(
                (r) => r.value === item.value,
              );
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => toggle(item)}
                  activeOpacity={0.7}
                  testID={`recipient-option-${item.value}`}
                >
                  <View
                    style={[
                      styles.itemAvatar,
                      isSelected && styles.itemAvatarSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemInitial,
                        isSelected && styles.itemInitialSelected,
                      ]}
                    >
                      {item.label[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={styles.itemContent}>
                    <Text
                      style={[
                        styles.itemLabel,
                        isSelected && styles.itemLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.itemSub} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="people-outline"
                  size={36}
                  color={colors.warmBorder}
                />
                <Text style={styles.emptyText}>Aucun destinataire trouvé</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cancelBtn: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  doneBtn: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  doneBtnDisabled: {
    opacity: 0.35,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(12,95,168,0.10)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    maxWidth: 160,
  },
  chipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    flex: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    gap: 12,
  },
  itemSelected: {
    backgroundColor: colors.warmSurface,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(12,95,168,0.10)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemAvatarSelected: {
    backgroundColor: colors.primary,
  },
  itemInitial: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  itemInitialSelected: {
    color: colors.white,
  },
  itemContent: { flex: 1 },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  itemLabelSelected: {
    fontWeight: "700",
    color: colors.primary,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.warmBorder,
    marginLeft: 68,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
