import { createContext, useContext, useRef } from "react";
import {
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

export const HEADER_HIDE_DISTANCE = 90;

export interface HeaderScrollContextValue {
  /** 0 = header fully visible, HEADER_HIDE_DISTANCE = header fully hidden */
  translateY: Animated.Value;
  /** Attach to any ScrollView/FlatList via onScroll to drive the shared header. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const noopAnimatedValue = new Animated.Value(0);

export const HeaderScrollContext = createContext<HeaderScrollContextValue>({
  translateY: noopAnimatedValue,
  onScroll: () => {},
});

export const useHeaderScroll = () => useContext(HeaderScrollContext);

/**
 * Builds a fresh HeaderScrollContextValue for one AppShell instance.
 * Scroll down past HEADER_HIDE_DISTANCE hides the header; scrolling up a
 * small amount immediately shows it again (no need to reach the top).
 */
export function useCreateHeaderScroll(): HeaderScrollContextValue {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const onScroll = useRef((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const delta = offsetY - lastOffset.current;
    lastOffset.current = offsetY;

    if (offsetY <= 0) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (delta > 0) {
      Animated.timing(translateY, {
        toValue: HEADER_HIDE_DISTANCE,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else if (delta < 0) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }).current;

  return { translateY, onScroll };
}
