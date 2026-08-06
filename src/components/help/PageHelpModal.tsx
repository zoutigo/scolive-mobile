import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

/** A titled sub-chapter within the modal body — see `sections` below. */
export type PageHelpSection = {
  title: string;
  body: string[];
};

export type PageHelpModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Flat paragraphs, no sub-chapters. Ignored when `sections` is provided. */
  body?: string[];
  /** Paragraphs grouped under titled sub-chapters, for longer help content. */
  sections?: PageHelpSection[];
  closeLabel: string;
  testID?: string;
};

export function PageHelpModal({
  visible,
  onClose,
  title,
  body,
  sections,
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
              <View style={styles.headerBand}>
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
              <View style={styles.cardBody}>
                <ScrollView
                  style={styles.contentScroll}
                  testID={`${testID}-body`}
                >
                  {sections
                    ? sections.map((section, sectionIndex) => (
                        <View
                          key={sectionIndex}
                          style={styles.section}
                          testID={`${testID}-section-${sectionIndex}`}
                        >
                          <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionTitleBar} />
                            <Text style={styles.sectionTitle}>
                              {section.title}
                            </Text>
                          </View>
                          {section.body.map((paragraph, index) => (
                            <Text key={index} style={styles.bodyParagraph}>
                              {paragraph}
                            </Text>
                          ))}
                        </View>
                      ))
                    : (body ?? []).map((paragraph, index) => (
                        <Text key={index} style={styles.bodyParagraph}>
                          {paragraph}
                        </Text>
                      ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  testID={`${testID}-close`}
                >
                  <Text style={styles.closeLabel}>{closeLabel}</Text>
                </TouchableOpacity>
              </View>
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
    maxHeight: "80%",
    backgroundColor: "#EAF6F4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFE3DE",
    overflow: "hidden",
  },
  headerBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#D5EEEA",
    borderBottomWidth: 1,
    borderBottomColor: "#BFE3DE",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  contentScroll: {
    flexGrow: 0,
  },
  section: {
    gap: 6,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitleBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.accentTeal,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.accentTealDark,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bodyParagraph: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: "justify",
    marginBottom: 8,
  },
  closeBtn: {
    marginTop: 4,
    alignSelf: "stretch",
    borderRadius: 8,
    backgroundColor: colors.accentTeal,
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
