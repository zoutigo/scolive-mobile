import React, { createContext, useContext, useRef } from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

export type OnboardingScrollHandle = {
  scrollRef: React.RefObject<ScrollView | null>;
  offsetRef: React.RefObject<number>;
};

const OnboardingScrollContext = createContext<OnboardingScrollHandle | null>(
  null,
);

/** Used by `OnboardingTarget` to scroll its own screen when the active tour
 * step's target sits outside the currently visible viewport (e.g. a section
 * further down a list). Returns null when the screen doesn't wrap its
 * `ScrollView` with `OnboardingScrollView`, in which case no auto-scroll is
 * attempted. */
export function useOnboardingScrollHandle(): OnboardingScrollHandle | null {
  return useContext(OnboardingScrollContext);
}

/**
 * Drop-in replacement for `ScrollView` on any screen that renders
 * `OnboardingTarget`s: tracks its own scroll offset and exposes a ref to
 * itself via context, so a tour target that ends up below the fold (or
 * above it) can be scrolled into view automatically when its step becomes
 * active, instead of requiring the user to notice and scroll manually.
 */
export const OnboardingScrollView = React.forwardRef<
  ScrollView,
  ScrollViewProps
>(function OnboardingScrollView({ onScroll, ...rest }, forwardedRef) {
  const innerRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const handleRef = useRef<OnboardingScrollHandle>({
    scrollRef: innerRef,
    offsetRef,
  });

  return (
    <OnboardingScrollContext.Provider value={handleRef.current}>
      <ScrollView
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) {
            (
              forwardedRef as React.MutableRefObject<ScrollView | null>
            ).current = node;
          }
        }}
        scrollEventThrottle={rest.scrollEventThrottle ?? 16}
        onScroll={(event) => {
          offsetRef.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        {...rest}
      />
    </OnboardingScrollContext.Provider>
  );
});
