import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";

const STEPS = [
  {
    icon: "create-outline" as const,
    titleKey: "resources.onboarding.step1Title",
    bodyKey: "resources.onboarding.step1Body",
  },
  {
    icon: "document-text-outline" as const,
    titleKey: "resources.onboarding.step2Title",
    bodyKey: "resources.onboarding.step2Body",
  },
  {
    icon: "checkmark-done-outline" as const,
    titleKey: "resources.onboarding.step3Title",
    bodyKey: "resources.onboarding.step3Body",
  },
];

export function ResourceCreationOnboardingModal(props: {
  visible: boolean;
  dontShowAgain: boolean;
  onToggleDontShowAgain: (value: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
      testID="resources-onboarding-modal"
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("resources.onboarding.title")}</Text>

          {STEPS.map((step) => (
            <View style={styles.step} key={step.titleKey}>
              <Ionicons name={step.icon} size={22} color={colors.primary} />
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{t(step.titleKey)}</Text>
                <Text style={styles.stepBody}>{t(step.bodyKey)}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => props.onToggleDontShowAgain(!props.dontShowAgain)}
            testID="resources-onboarding-dont-show-again"
          >
            <Ionicons
              name={props.dontShowAgain ? "checkbox" : "square-outline"}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.checkboxLabel}>
              {t("resources.onboarding.dontShowAgain")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={props.onClose}
            testID="resources-onboarding-start"
          >
            <Text style={styles.startBtnText}>
              {t("resources.onboarding.start")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  step: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepText: { flex: 1, gap: 2 },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  stepBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  startBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
