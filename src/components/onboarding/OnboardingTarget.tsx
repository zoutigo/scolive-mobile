import React, { useEffect, useRef } from "react";
import { InteractionManager, View, type ViewProps } from "react-native";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";

const MEASURE_SETTLE_DELAYS_MS = [80, 250, 600];

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

    const measure = () => {
      viewRef.current?.measureInWindow((x, y, width, height) => {
        if (cancelled) return;
        if (width <= 0 || height <= 0) return;
        setTargetLayout({ x, y, width, height });
      });
    };

    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      const timers = MEASURE_SETTLE_DELAYS_MS.map((delay) =>
        setTimeout(measure, delay),
      );

      return () => timers.forEach(clearTimeout);
    });

    return () => {
      cancelled = true;
      interactionHandle.cancel();
    };
  }, [isActiveTarget, setTargetLayout]);

  return (
    <View ref={viewRef} collapsable={false} {...viewProps}>
      {children}
    </View>
  );
}
