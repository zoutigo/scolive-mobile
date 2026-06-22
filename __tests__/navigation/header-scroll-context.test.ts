/**
 * Tests du mécanisme de masquage du header au scroll (AppHeader / ModuleHeader).
 * Règle : scroll vers le bas masque le header, un léger scroll vers le haut
 * (ou retour en haut de liste) le réaffiche immédiatement.
 *
 * useNativeDriver:true ne progresse pas l'Animated.Value côté JS dans
 * l'environnement de test — on vérifie donc l'intention (toValue passé à
 * Animated.timing) plutôt que la valeur animée finale.
 */
import { renderHook, act } from "@testing-library/react-native";
import { Animated } from "react-native";
import {
  useCreateHeaderScroll,
  HEADER_HIDE_DISTANCE,
} from "../../src/components/navigation/header-scroll-context";
import type { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

function scrollEvent(y: number): NativeSyntheticEvent<NativeScrollEvent> {
  return {
    nativeEvent: { contentOffset: { y } },
  } as unknown as NativeSyntheticEvent<NativeScrollEvent>;
}

function lastToValue(spy: jest.SpyInstance) {
  const calls = spy.mock.calls;
  const lastCall = calls[calls.length - 1];
  return (lastCall[1] as { toValue: number }).toValue;
}

describe("useCreateHeaderScroll", () => {
  let timingSpy: jest.SpyInstance;

  beforeEach(() => {
    timingSpy = jest.spyOn(Animated, "timing");
  });

  afterEach(() => {
    timingSpy.mockRestore();
  });

  it("démarre avec translateY à 0 (header visible)", () => {
    const { result } = renderHook(() => useCreateHeaderScroll());
    const translateY = result.current.translateY as unknown as {
      __getValue: () => number;
    };
    expect(translateY.__getValue()).toBe(0);
  });

  it("masque le header (toValue = HEADER_HIDE_DISTANCE) en scrollant vers le bas", () => {
    const { result } = renderHook(() => useCreateHeaderScroll());
    act(() => {
      result.current.onScroll(scrollEvent(50));
      result.current.onScroll(scrollEvent(150));
    });
    expect(lastToValue(timingSpy)).toBe(HEADER_HIDE_DISTANCE);
  });

  it("réaffiche le header (toValue = 0) dès qu'on scrolle vers le haut, même légèrement", () => {
    const { result } = renderHook(() => useCreateHeaderScroll());
    act(() => {
      result.current.onScroll(scrollEvent(50));
      result.current.onScroll(scrollEvent(150));
    });
    expect(lastToValue(timingSpy)).toBe(HEADER_HIDE_DISTANCE);

    act(() => {
      result.current.onScroll(scrollEvent(140));
    });
    expect(lastToValue(timingSpy)).toBe(0);
  });

  it("reste visible (toValue = 0) quand on revient en haut de la liste (offsetY <= 0)", () => {
    const { result } = renderHook(() => useCreateHeaderScroll());
    act(() => {
      result.current.onScroll(scrollEvent(50));
      result.current.onScroll(scrollEvent(150));
      result.current.onScroll(scrollEvent(0));
    });
    expect(lastToValue(timingSpy)).toBe(0);
  });

  it("ne déclenche aucune animation tant qu'on ne dépasse pas le seuil initial (offsetY croissant, premier appel)", () => {
    const { result } = renderHook(() => useCreateHeaderScroll());
    act(() => {
      result.current.onScroll(scrollEvent(50));
    });
    // Premier appel : delta = 50 - 0 > 0 → tentative de masquage dès le premier mouvement vers le bas
    expect(lastToValue(timingSpy)).toBe(HEADER_HIDE_DISTANCE);
  });

  it("continue de viser HEADER_HIDE_DISTANCE tant qu'on scrolle vers le bas", () => {
    const { result } = renderHook(() => useCreateHeaderScroll());
    act(() => {
      result.current.onScroll(scrollEvent(50));
      result.current.onScroll(scrollEvent(150));
      result.current.onScroll(scrollEvent(250));
    });
    expect(lastToValue(timingSpy)).toBe(HEADER_HIDE_DISTANCE);
  });
});
