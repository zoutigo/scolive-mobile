import React, { useEffect, useRef } from "react";
import { View, type NativeMethods, type ViewProps } from "react-native";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import { useOnboardingScrollHandle } from "./OnboardingScrollView";

const MEASURE_POLL_INTERVAL_MS = 150;
const MEASURE_POLL_MAX_ATTEMPTS = 20; // ~3s ceiling
// Safe-area insets can settle (shifting header height, and everything below
// it) well after the first couple of reads already agree with each other.
// Keep polling for at least this many attempts before trusting a "stable"
// streak, instead of stopping on the first two identical reads.
const MEASURE_POLL_MIN_ATTEMPTS = 6;
// Minimum breathing room kept between the highlighted target and the edge
// of the visible viewport once auto-scrolled into view.
const SCROLL_INTO_VIEW_MARGIN = 16;

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
  const scrollHandle = useOnboardingScrollHandle();

  useEffect(() => {
    if (!isActiveTarget) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let hasAutoScrolled = false;
    let lastLayout: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null = null;

    // If the screen wraps its scrollable container in `OnboardingScrollView`,
    // bring an off-screen target (above or below the visible viewport, e.g.
    // a section further down a long list) into view once, instead of
    // leaving the user to notice and scroll manually to see the highlight.
    const scrollIntoViewIfNeeded = (targetY: number, targetHeight: number) => {
      if (hasAutoScrolled || !scrollHandle) return;
      const scrollView = scrollHandle.scrollRef.current;
      if (!scrollView) return;

      (scrollView as unknown as NativeMethods).measureInWindow(
        (
          _vx: number,
          viewportY: number,
          _vw: number,
          viewportHeight: number,
        ) => {
          if (cancelled || viewportHeight <= 0) return;

          const viewportTop = viewportY + SCROLL_INTO_VIEW_MARGIN;
          const viewportBottom =
            viewportY + viewportHeight - SCROLL_INTO_VIEW_MARGIN;

          let delta = 0;
          if (targetY + targetHeight > viewportBottom) {
            delta = targetY + targetHeight - viewportBottom;
          } else if (targetY < viewportTop) {
            delta = targetY - viewportTop;
          }

          if (Math.abs(delta) < 1) return;

          hasAutoScrolled = true;
          const currentOffset = scrollHandle.offsetRef.current ?? 0;
          scrollView.scrollTo({
            y: Math.max(0, currentOffset + delta),
            animated: true,
          });
        },
      );
    };

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

        if (attempt >= MEASURE_POLL_MIN_ATTEMPTS) {
          scrollIntoViewIfNeeded(y, height);
        }

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

    // InteractionManager.runAfterInteractions is deprecated in favor of
    // requestIdleCallback (React Native provides it as a global polyfill).
    const idleHandle = requestIdleCallback(() => {
      pollMeasure(0);
    });

    return () => {
      cancelled = true;
      cancelIdleCallback(idleHandle);
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [isActiveTarget, setTargetLayout]);

  return (
    <View ref={viewRef} collapsable={false} {...viewProps}>
      {children}
    </View>
  );
}
