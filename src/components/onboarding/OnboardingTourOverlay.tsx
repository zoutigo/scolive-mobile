import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import { useTranslation } from "../../i18n/useTranslation";
import { colors } from "../../theme";

const TOOLTIP_MARGIN = 12;
const TOOLTIP_MAX_HEIGHT = 160;
const TOOLTIP_WIDTH_MARGIN = 16;

export function OnboardingTourOverlay() {
  const { t } = useTranslation();
  const activeTourId = useOnboardingTourStore((state) => state.activeTourId);
  const steps = useOnboardingTourStore((state) => state.steps);
  const stepIndex = useOnboardingTourStore((state) => state.stepIndex);
  const targetLayout = useOnboardingTourStore((state) => state.targetLayout);
  const next = useOnboardingTourStore((state) => state.next);
  const skip = useOnboardingTourStore((state) => state.skip);

  const [windowSize, setWindowSize] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowSize(window);
    });
    return () => subscription.remove();
  }, []);

  if (!activeTourId || !targetLayout) {
    return null;
  }

  const step = steps[stepIndex];
  if (!step) {
    return null;
  }

  const isLastStep = stepIndex >= steps.length - 1;
  const advanceOnTargetPress = !!step.advanceOnTargetPress;
  const finishLabel =
    isLastStep && step.finishLabelKey
      ? t(step.finishLabelKey)
      : t("onboardingTour.common.finish");
  const { height: screenHeight } = windowSize;

  const spaceBelow =
    screenHeight - (targetLayout.y + targetLayout.height) - TOOLTIP_MARGIN;
  const placeBelow =
    spaceBelow >= TOOLTIP_MAX_HEIGHT || spaceBelow >= targetLayout.y;

  const tooltipStyle = placeBelow
    ? { top: targetLayout.y + targetLayout.height + TOOLTIP_MARGIN }
    : { bottom: screenHeight - targetLayout.y + TOOLTIP_MARGIN };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="onboarding-tour-overlay"
    >
      <View
        pointerEvents="auto"
        style={[
          styles.mask,
          { top: 0, left: 0, right: 0, height: Math.max(targetLayout.y, 0) },
        ]}
        testID="onboarding-tour-mask-top"
      />
      <View
        pointerEvents="auto"
        style={[
          styles.mask,
          {
            top: targetLayout.y + targetLayout.height,
            left: 0,
            right: 0,
            bottom: 0,
          },
        ]}
        testID="onboarding-tour-mask-bottom"
      />
      <View
        pointerEvents="auto"
        style={[
          styles.mask,
          {
            top: targetLayout.y,
            left: 0,
            width: Math.max(targetLayout.x, 0),
            height: targetLayout.height,
          },
        ]}
        testID="onboarding-tour-mask-left"
      />
      <View
        pointerEvents="auto"
        style={[
          styles.mask,
          {
            top: targetLayout.y,
            left: targetLayout.x + targetLayout.width,
            right: 0,
            height: targetLayout.height,
          },
        ]}
        testID="onboarding-tour-mask-right"
      />

      <View
        pointerEvents="none"
        style={[
          styles.highlightRing,
          {
            top: targetLayout.y - 4,
            left: targetLayout.x - 4,
            width: targetLayout.width + 8,
            height: targetLayout.height + 8,
          },
        ]}
        testID="onboarding-tour-highlight"
      />

      <View
        pointerEvents="auto"
        style={[
          styles.tooltip,
          tooltipStyle,
          { left: TOOLTIP_WIDTH_MARGIN, right: TOOLTIP_WIDTH_MARGIN },
        ]}
        testID="onboarding-tour-tooltip"
      >
        <Text style={styles.stepCounter}>
          {stepIndex + 1} / {steps.length}
        </Text>
        <Text style={styles.title} testID="onboarding-tour-title">
          {t(step.titleKey)}
        </Text>
        <Text style={styles.body} testID="onboarding-tour-body">
          {t(step.bodyKey)}
        </Text>
        {advanceOnTargetPress ? (
          <Text style={styles.hint} testID="onboarding-tour-hint">
            {t("onboardingTour.common.tapTarget")}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={skip}
            style={styles.skipButton}
            testID="onboarding-tour-skip"
          >
            <Text style={styles.skipText}>
              {t("onboardingTour.common.skip")}
            </Text>
          </TouchableOpacity>
          {advanceOnTargetPress ? null : (
            <TouchableOpacity
              onPress={next}
              style={styles.nextButton}
              testID="onboarding-tour-next"
            >
              <Text style={styles.nextText}>
                {isLastStep ? finishLabel : t("onboardingTour.common.next")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    position: "absolute",
    backgroundColor: "rgba(15, 23, 33, 0.65)",
  },
  highlightRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: colors.accentTeal,
    borderRadius: 6,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.accentTeal,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nextText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
});
