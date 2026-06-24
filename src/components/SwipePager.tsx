import React, { useEffect, useRef, useState } from "react";
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
  onIndexChange?: (index: number, id: string) => void;
  /** Nombre de pages voisines (de chaque côté) montées en plus de la page
   * active. `Infinity` (défaut) monte toutes les pages, comme avant. Réduire
   * cette valeur évite de monter/charger des pages lointaines (ex: listes
   * paginées volumineuses). */
  renderWindow?: number;
  testID?: string;
};

/** Pagination horizontale "swipe gauche/droite" générique entre fiches de
 * détail, sans dépendance externe (ScrollView pagingEnabled natif RN). */
export function SwipePager({
  ids,
  initialIndex,
  renderPage,
  onIndexChange,
  renderWindow = Infinity,
  testID = "swipe-pager",
}: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);
  const hasScrolledInitial = useRef(false);

  useEffect(() => {
    if (ids[index] !== undefined) {
      onIndexChange?.(index, ids[index]);
    }
  }, [index, ids, onIndexChange]);

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
      testID={testID}
    >
      {ids.map((id, i) => (
        <View key={id} style={{ width }}>
          {Math.abs(i - index) <= renderWindow ? renderPage(id, i === index) : null}
        </View>
      ))}
    </ScrollView>
  );
}
