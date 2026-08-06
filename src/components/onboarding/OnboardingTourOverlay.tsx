import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import { useTranslation } from "../../i18n/useTranslation";
import { colors } from "../../theme";

const TOOLTIP_MARGIN = 12;
const TOOLTIP_MAX_HEIGHT = 130;
const TOOLTIP_WIDTH_MARGIN = 16;
const CONNECTOR_THICKNESS = 2;
const CONNECTOR_DOT_SIZE = 8;

export function OnboardingTourOverlay() {
  const { t } = useTranslation();
  const activeTourId = useOnboardingTourStore((state) => state.activeTourId);
  const steps = useOnboardingTourStore((state) => state.steps);
  const stepIndex = useOnboardingTourStore((state) => state.stepIndex);
  const targetLayout = useOnboardingTourStore((state) => state.targetLayout);
  const next = useOnboardingTourStore((state) => state.next);

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
  const targetTop = targetY;
  const targetBottom = targetY + targetLayout.height;

  // The tooltip card is opaque and renders on top of these mask panels, so
  // it already fully covers its own row — the mask itself can stay a
  // single full-width panel above/below the target with no gap carved out
  // for the tooltip. (An earlier version left that row undimmed on the
  // assumption the tooltip background was translucent; once the tooltip
  // became an opaque card, that gap just exposed a strip of undimmed real
  // content on either side of the card, out to the screen edges.)
  const topPanels: { top: number; height: number }[] = [
    { top: 0, height: Math.max(targetTop, 0) },
  ];
  const bottomPanels: { top: number; height?: number }[] = [
    { top: targetBottom },
  ];

  // A straight line from the tooltip's edge closest to the target to the
  // target's own closest edge, so the tooltip visually reads as pointing at
  // the exact control it is describing rather than floating unrelated to it.
  const tooltipAnchorX = windowSize.width / 2;
  const tooltipAnchorY = placeBelow ? tooltipTop : tooltipBottom;
  const targetAnchorX = targetX + targetLayout.width / 2;
  const targetAnchorY = placeBelow ? targetBottom : targetTop;
  const connectorDx = targetAnchorX - tooltipAnchorX;
  const connectorDy = targetAnchorY - tooltipAnchorY;
  const connectorLength = Math.sqrt(
    connectorDx * connectorDx + connectorDy * connectorDy,
  );
  const connectorAngle = (Math.atan2(connectorDy, connectorDx) * 180) / Math.PI;
  const connectorMidX = (tooltipAnchorX + targetAnchorX) / 2;
  const connectorMidY = (tooltipAnchorY + targetAnchorY) / 2;

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

      {/* Steps that don't opt into advanceOnTargetPress are purely
          informative: the only way to move the tour forward is the
          tooltip's own "Suivant" button, so the highlighted control itself
          must not be reachable, or the user could act on the real screen
          without going through the tour at all. */}
      {!advanceOnTargetPress ? (
        <View
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: targetY,
            left: targetX,
            width: targetLayout.width,
            height: targetLayout.height,
          }}
          testID="onboarding-tour-target-block"
        />
      ) : null}

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
        pointerEvents="none"
        style={[
          styles.connector,
          {
            left: connectorMidX - connectorLength / 2,
            top: connectorMidY - CONNECTOR_THICKNESS / 2,
            width: connectorLength,
            transform: [{ rotate: `${connectorAngle}deg` }],
          },
        ]}
        testID="onboarding-tour-connector"
      />
      <View
        pointerEvents="none"
        style={[
          styles.connectorDot,
          {
            left: targetAnchorX - CONNECTOR_DOT_SIZE / 2,
            top: targetAnchorY - CONNECTOR_DOT_SIZE / 2,
          },
        ]}
        testID="onboarding-tour-connector-dot"
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
        {/* Elevation on Android draws an unclipped rectangular shadow behind
            the view, regardless of `overflow: hidden`/`borderRadius` on the
            same node — it can bleed past the rounded corners as a mismatched
            patch. Keeping the shadow on this outer node and the rounded
            clipping + colors on a separate inner node avoids that. */}
        <View style={styles.tooltipInner}>
          <View style={styles.headerBand}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="help-circle"
                size={16}
                color={colors.accentTeal}
              />
            </View>
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
          </View>
          <View style={styles.body}>
            <Text style={styles.bodyText} testID="onboarding-tour-body">
              {t(step.bodyKey)}
            </Text>
            {advanceOnTargetPress ? (
              <Text style={styles.hint} testID="onboarding-tour-hint">
                {t("onboardingTour.common.tapTarget")}
              </Text>
            ) : (
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
  connector: {
    position: "absolute",
    height: CONNECTOR_THICKNESS,
    backgroundColor: colors.accentTeal,
  },
  connectorDot: {
    position: "absolute",
    width: CONNECTOR_DOT_SIZE,
    height: CONNECTOR_DOT_SIZE,
    borderRadius: CONNECTOR_DOT_SIZE / 2,
    backgroundColor: colors.accentTeal,
    borderWidth: 2,
    borderColor: colors.white,
  },
  tooltip: {
    position: "absolute",
    // Elevation needs an opaque background to render its shadow on Android;
    // the rounded clipping itself lives on `tooltipInner` (see comment at
    // the call site).
    backgroundColor: "#EAF6F4",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  tooltipInner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFE3DE",
    overflow: "hidden",
  },
  headerBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#D5EEEA",
    borderBottomWidth: 1,
    borderBottomColor: "#BFE3DE",
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentTeal,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
    textAlign: "justify",
  },
  hint: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.accentTealDark,
  },
  nextButton: {
    alignSelf: "stretch",
    backgroundColor: colors.accentTeal,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
});
