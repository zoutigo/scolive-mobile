import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";

export type ImageSize = 25 | 50 | 75 | 100;
export type ImageAlign = "left" | "center" | "right";

type Props = {
  onSizePress: (size: ImageSize) => void;
  onAlignPress: (align: ImageAlign) => void;
  onDelete: () => void;
  onClose: () => void;
  currentSize?: ImageSize | null;
  currentAlign?: ImageAlign | null;
};

const ALIGN_SYMBOLS: Record<ImageAlign, string> = {
  left: "⇤",
  center: "⇔",
  right: "⇥",
};

export function ImageEditPanel({
  onSizePress,
  onAlignPress,
  onDelete,
  onClose,
  currentSize,
  currentAlign,
}: Props) {
  const { t } = useTranslation();

  const sizes: { value: ImageSize; labelKey: string }[] = [
    { value: 25, labelKey: "messaging.compose.imageEdit.sizeSmall" },
    { value: 50, labelKey: "messaging.compose.imageEdit.sizeMedium" },
    { value: 75, labelKey: "messaging.compose.imageEdit.sizeLarge" },
    { value: 100, labelKey: "messaging.compose.imageEdit.sizeFull" },
  ];

  const alignments: { value: ImageAlign; labelKey: string }[] = [
    { value: "left", labelKey: "messaging.compose.imageEdit.alignLeft" },
    { value: "center", labelKey: "messaging.compose.imageEdit.alignCenter" },
    { value: "right", labelKey: "messaging.compose.imageEdit.alignRight" },
  ];

  return (
    <View style={styles.container} testID="image-edit-panel">
      <View style={styles.header}>
        <Text style={styles.title}>
          {t("messaging.compose.imageEdit.title")}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="image-edit-close"
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.group}>
          <Text style={styles.groupLabel}>
            {t("messaging.compose.imageEdit.size")}
          </Text>
          <View style={styles.buttonRow}>
            {sizes.map((size) => (
              <TouchableOpacity
                key={size.value}
                style={[
                  styles.btn,
                  currentSize === size.value && styles.btnActive,
                ]}
                onPress={() => onSizePress(size.value)}
                testID={`image-size-${size.value}`}
              >
                <Text
                  style={[
                    styles.btnLabel,
                    currentSize === size.value && styles.btnLabelActive,
                  ]}
                >
                  {size.value}%
                </Text>
                <Text
                  style={[
                    styles.btnSub,
                    currentSize === size.value && styles.btnLabelActive,
                  ]}
                >
                  {t(size.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.group}>
          <Text style={styles.groupLabel}>
            {t("messaging.compose.imageEdit.align")}
          </Text>
          <View style={styles.buttonRow}>
            {alignments.map((align) => (
              <TouchableOpacity
                key={align.value}
                style={[
                  styles.alignBtn,
                  currentAlign === align.value && styles.btnActive,
                ]}
                onPress={() => onAlignPress(align.value)}
                testID={`image-align-${align.value}`}
              >
                <Text
                  style={[
                    styles.alignSymbol,
                    currentAlign === align.value && styles.btnLabelActive,
                  ]}
                >
                  {ALIGN_SYMBOLS[align.value]}
                </Text>
                <Text
                  style={[
                    styles.btnSub,
                    currentAlign === align.value && styles.btnLabelActive,
                  ]}
                >
                  {t(align.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          testID="image-delete-btn"
        >
          <Ionicons name="trash-outline" size={18} color={colors.notification} />
          <Text style={styles.deleteBtnLabel}>
            {t("messaging.compose.imageEdit.delete")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "flex-start",
    gap: 12,
  },
  group: {
    gap: 6,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 6,
  },
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    minWidth: 56,
  },
  btnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btnLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  btnSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  btnLabelActive: {
    color: colors.white,
  },
  alignBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    minWidth: 52,
    gap: 2,
  },
  alignSymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  separator: {
    width: 1,
    backgroundColor: colors.warmBorder,
    alignSelf: "stretch",
    marginHorizontal: 4,
  },
  deleteBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.notification}40`,
    backgroundColor: `${colors.notification}0A`,
    gap: 4,
  },
  deleteBtnLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.notification,
  },
});
