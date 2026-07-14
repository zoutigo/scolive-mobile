import { useCallback, useRef } from "react";
import type { LayoutChangeEvent, ScrollView, TextInput } from "react-native";

/**
 * Standard formulaires (voir CLAUDE.md) : au submit invalide, le premier champ
 * en erreur doit devenir visible (scroll) et, s'il s'agit d'un TextInput réel,
 * recevoir le focus. Sans ça, un champ requis hors de l'écran (au-dessus ou en
 * dessous du scroll courant) laisse l'utilisateur avec l'impression que le
 * bouton Submit ne fait rien.
 *
 * Ce hook ne s'accroche à aucun événement clavier/focus : il ne s'exécute
 * qu'après un submit invalide, donc il n'entre jamais en conflit avec
 * `adjustPan` (voir la règle "Comportement clavier Android").
 */
export function useScrollToFirstError<TFieldName extends string>() {
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Partial<Record<TFieldName, number>>>({});
  const fieldInputRefs = useRef<
    Partial<Record<TFieldName, React.RefObject<TextInput | null>>>
  >({});

  const registerFieldOffset = useCallback(
    (name: TFieldName) => (e: LayoutChangeEvent) => {
      fieldOffsets.current[name] = e.nativeEvent.layout.y;
    },
    [],
  );

  const registerFieldInputRef = useCallback(
    (name: TFieldName, ref: React.RefObject<TextInput | null>) => {
      fieldInputRefs.current[name] = ref;
    },
    [],
  );

  const scrollToField = useCallback((name: TFieldName) => {
    const offset = fieldOffsets.current[name];
    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, offset - 12),
        animated: true,
      });
    }
  }, []);

  const focusFirstInvalidField = useCallback(
    (
      fieldOrder: readonly TFieldName[],
      errors: Partial<Record<TFieldName, unknown>>,
    ) => {
      const firstInvalidField = fieldOrder.find((name) => errors[name]);
      if (!firstInvalidField) return;

      scrollToField(firstInvalidField);
      fieldInputRefs.current[firstInvalidField]?.current?.focus();
    },
    [scrollToField],
  );

  return {
    scrollViewRef,
    registerFieldOffset,
    registerFieldInputRef,
    scrollToField,
    focusFirstInvalidField,
  };
}
