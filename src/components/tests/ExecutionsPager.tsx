import React, { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";

type Props = {
  ids: string[];
  initialIndex: number;
  renderPage: (id: string, isActive: boolean) => React.ReactNode;
};

/** Pagination horizontale "swipe gauche/droite" entre fiches de détail filtrées,
 * sans dépendance externe (ScrollView pagingEnabled natif RN). */
export function ExecutionsPager({ ids, initialIndex, renderPage }: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);
  const hasScrolledInitial = useRef(false);

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) {
      setIndex(newIndex);
    }
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleMomentumEnd}
      onContentSizeChange={() => {
        if (!hasScrolledInitial.current && initialIndex > 0) {
          hasScrolledInitial.current = true;
          scrollRef.current?.scrollTo({
            x: initialIndex * width,
            animated: false,
          });
        }
      }}
      testID="executions-pager"
    >
      {ids.map((id, i) => (
        <View key={id} style={{ width }}>
          {renderPage(id, i === index)}
        </View>
      ))}
    </ScrollView>
  );
}
