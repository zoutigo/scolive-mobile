import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export type PageHelpModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string[];
  closeLabel: string;
  testID?: string;
};

export function PageHelpModal({
  visible,
  onClose,
  title,
  body,
  closeLabel,
  testID = "page-help-modal",
}: PageHelpModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name="help-circle"
                    size={20}
                    color={colors.accentTeal}
                  />
                </View>
                <Text style={styles.title} testID={`${testID}-title`}>
                  {title}
                </Text>
              </View>
              <View style={styles.content} testID={`${testID}-body`}>
                {body.map((paragraph, index) => (
                  <Text key={index} style={styles.bodyParagraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                testID={`${testID}-close`}
              >
                <Text style={styles.closeLabel}>{closeLabel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.accentTeal}1F`,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  content: {
    gap: 8,
  },
  bodyParagraph: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "justify",
  },
  closeBtn: {
    marginTop: 4,
    alignSelf: "stretch",
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  closeLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
