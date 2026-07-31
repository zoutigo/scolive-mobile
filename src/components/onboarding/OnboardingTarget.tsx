import React, { useEffect, useRef } from "react";
import { InteractionManager, View, type ViewProps } from "react-native";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";

const MEASURE_POLL_INTERVAL_MS = 150;
const MEASURE_POLL_MAX_ATTEMPTS = 20; // ~3s ceiling
// Safe-area insets can settle (shifting header height, and everything below
// it) well after the first couple of reads already agree with each other.
// Keep polling for at least this many attempts before trusting a "stable"
// streak, instead of stopping on the first two identical reads.
const MEASURE_POLL_MIN_ATTEMPTS = 6;

interface OnboardingTargetProps extends ViewProps {
  id: string;
  children: React.ReactNode;
}

export function OnboardingTarget({
  id,
  children,
  ...viewProps
}: OnboardingTargetProps) {
  const viewRef = useRef<View>(null);
  const activeTourId = useOnboardingTourStore((state) => state.activeTourId);
  const steps = useOnboardingTourStore((state) => state.steps);
  const stepIndex = useOnboardingTourStore((state) => state.stepIndex);
  const setTargetLayout = useOnboardingTourStore(
    (state) => state.setTargetLayout,
  );

  const isActiveTarget = !!activeTourId && steps[stepIndex]?.targetKey === id;

  useEffect(() => {
    if (!isActiveTarget) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let lastLayout: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null = null;

    // Ancestor layout (header height, safe-area insets, loading→content swap)
    // can keep shifting this target on screen for a bit after mount, and
    // those shifts don't always trigger this view's own onLayout. Poll until
    // two consecutive reads agree (or we give up), instead of trusting a
    // single fixed delay.
    const pollMeasure = (attempt: number) => {
      if (cancelled) return;
      viewRef.current?.measureInWindow((x, y, width, height) => {
        if (cancelled) return;
        if (width <= 0 || height <= 0) return;

        const stable =
          lastLayout !== null &&
          lastLayout.x === x &&
          lastLayout.y === y &&
          lastLayout.width === width &&
          lastLayout.height === height;

        lastLayout = { x, y, width, height };
        setTargetLayout(lastLayout);

        const keepPolling =
          (!stable || attempt < MEASURE_POLL_MIN_ATTEMPTS) &&
          attempt < MEASURE_POLL_MAX_ATTEMPTS;

        if (keepPolling) {
          pollTimer = setTimeout(
            () => pollMeasure(attempt + 1),
            MEASURE_POLL_INTERVAL_MS,
          );
        }
      });
    };

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      pollMeasure(0);
    });

    return () => {
      cancelled = true;
      interactionHandle.cancel();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [isActiveTarget, setTargetLayout]);

  return (
    <View ref={viewRef} collapsable={false} {...viewProps}>
      {children}
    </View>
  );
}
