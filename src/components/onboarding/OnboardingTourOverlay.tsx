import React, { useEffect, useRef, useState } from "react";
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
const TOOLTIP_MAX_HEIGHT = 110;
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
  const [tooltipHeight, setTooltipHeight] = useState(TOOLTIP_MAX_HEIGHT);
  const rootRef = useRef<View>(null);
  const [overlayOrigin, setOverlayOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setWindowSize(window);
    });
    return () => subscription.remove();
  }, []);

  // `measureInWindow` on the target (OnboardingTarget) and on this overlay's
  // own root can disagree on what "window" origin means (status bar /
  // edge-to-edge handling). Measuring our own root and rebasing the target
  // coordinates against it cancels out any such bias, whatever it is.
  useEffect(() => {
    if (!activeTourId || !targetLayout) return;
    const raf = requestAnimationFrame(() => {
      rootRef.current?.measureInWindow((x, y) => {
        setOverlayOrigin({ x, y });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTourId, !!targetLayout]);

  useEffect(() => {
    setTooltipHeight(TOOLTIP_MAX_HEIGHT);
  }, [stepIndex]);

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

  // Rebase the target's window coordinates against this overlay's own
  // measured origin (see the effect above) rather than trusting them as-is.
  const targetX = targetLayout.x - overlayOrigin.x;
  const targetY = targetLayout.y - overlayOrigin.y;

  const spaceBelow =
    screenHeight - (targetY + targetLayout.height) - TOOLTIP_MARGIN;
  const spaceAbove = targetY - TOOLTIP_MARGIN;
  const placeBelow = spaceBelow >= spaceAbove;

  // Center the tooltip in the free area (above or below the target) instead
  // of pinning it right against the target's edge, so it reads as sitting
  // "elsewhere on screen" and never crowds the element being tapped.
  const tooltipTop = placeBelow
    ? targetY +
      targetLayout.height +
      TOOLTIP_MARGIN +
      Math.max(0, (spaceBelow - tooltipHeight) / 2)
    : Math.max(TOOLTIP_MARGIN, (spaceAbove - tooltipHeight) / 2);
  const tooltipBottom = tooltipTop + tooltipHeight;
  const tooltipBandTop = tooltipTop - TOOLTIP_MARGIN / 2;
  const tooltipBandBottom = tooltipBottom + TOOLTIP_MARGIN / 2;

  // The mask panel that would otherwise sit directly behind the tooltip is
  // split in two so that band stays undimmed: the tooltip's own translucent
  // background then reveals real screen content behind it, not the dark
  // mask, which is what makes it read as "lighter".
  const targetTop = targetY;
  const targetBottom = targetY + targetLayout.height;

  // Above/below the target, the mask is split around the tooltip's band so
  // that band is left undimmed (see comment above).
  const topPanels: { top: number; height: number }[] = placeBelow
    ? [{ top: 0, height: Math.max(targetTop, 0) }]
    : [
        { top: 0, height: Math.max(Math.min(tooltipBandTop, targetTop), 0) },
        {
          top: Math.max(tooltipBandBottom, 0),
          height: Math.max(targetTop - Math.max(tooltipBandBottom, 0), 0),
        },
      ];
  const bottomPanels: { top: number; height?: number }[] = placeBelow
    ? [
        {
          top: targetBottom,
          height: Math.max(
            Math.min(tooltipBandTop, screenHeight) - targetBottom,
            0,
          ),
        },
        { top: Math.max(tooltipBandBottom, targetBottom) },
      ]
    : [{ top: targetBottom }];

  return (
    <View
      ref={rootRef}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="onboarding-tour-overlay"
    >
      {topPanels
        .filter((panel) => panel.height > 0)
        .map((panel, index) => (
          <View
            key={`top-${index}`}
            pointerEvents="auto"
            style={[
              styles.mask,
              { top: panel.top, left: 0, right: 0, height: panel.height },
            ]}
            testID={`onboarding-tour-mask-top-${index}`}
          />
        ))}
      {bottomPanels
        .filter((panel) => panel.height === undefined || panel.height > 0)
        .map((panel, index) => (
          <View
            key={`bottom-${index}`}
            pointerEvents="auto"
            style={[
              styles.mask,
              {
                top: panel.top,
                left: 0,
                right: 0,
                ...(panel.height === undefined
                  ? { bottom: 0 }
                  : { height: panel.height }),
              },
            ]}
            testID={`onboarding-tour-mask-bottom-${index}`}
          />
        ))}
      <View
        pointerEvents="auto"
        style={[
          styles.mask,
          {
            top: targetY,
            left: 0,
            width: Math.max(targetX, 0),
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
            top: targetY,
            left: targetX + targetLayout.width,
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
            top: targetY - 4,
            left: targetX - 4,
            width: targetLayout.width + 8,
            height: targetLayout.height + 8,
          },
        ]}
        testID="onboarding-tour-highlight"
      />

      <View
        pointerEvents="auto"
        onLayout={(event) => {
          const measuredHeight = event.nativeEvent.layout.height;
          if (measuredHeight > 0 && measuredHeight !== tooltipHeight) {
            setTooltipHeight(measuredHeight);
          }
        }}
        style={[
          styles.tooltip,
          {
            top: tooltipTop,
            left: TOOLTIP_WIDTH_MARGIN,
            right: TOOLTIP_WIDTH_MARGIN,
          },
        ]}
        testID="onboarding-tour-tooltip"
      >
        <View style={styles.header}>
          <Text style={styles.stepCounter}>
            {stepIndex + 1}/{steps.length}
          </Text>
          <Text
            style={styles.title}
            numberOfLines={1}
            testID="onboarding-tour-title"
          >
            {t(step.titleKey)}
          </Text>
          <TouchableOpacity
            onPress={skip}
            style={styles.skipButton}
            testID="onboarding-tour-skip"
          >
            <Text style={styles.skipText}>
              {t("onboardingTour.common.skip")}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.body} testID="onboarding-tour-body">
          {t(step.bodyKey)}
        </Text>
        {advanceOnTargetPress ? (
          <Text style={styles.hint} testID="onboarding-tour-hint">
            {t("onboardingTour.common.tapTarget")}
          </Text>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={next}
              style={styles.nextButton}
              testID="onboarding-tour-next"
            >
              <Text style={styles.nextText}>
                {isLastStep ? finishLabel : t("onboardingTour.common.next")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: "rgba(36, 124, 114, 0.98)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    padding: 10,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.75)",
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255, 255, 255, 0.92)",
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.white,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  skipButton: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
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
