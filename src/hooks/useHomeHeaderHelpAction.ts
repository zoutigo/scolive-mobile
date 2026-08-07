import { useEffect, useRef } from "react";
import {
  useHomeHeaderHelpStore,
  type HomeHeaderHelpAction,
} from "../store/home-header-help.store";

/**
 * Registers this screen's help entry in the shared AppHeader menu while
 * mounted, and clears it on unmount. `onPress` is read from a ref so callers
 * don't need to memoize it.
 */
export function useHomeHeaderHelpAction(
  action: Omit<HomeHeaderHelpAction, "onPress">,
  onPress: () => void,
) {
  const setHelpAction = useHomeHeaderHelpStore((state) => state.setHelpAction);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    setHelpAction({
      label: action.label,
      testID: action.testID,
      tourTargetId: action.tourTargetId,
      onPress: () => onPressRef.current(),
    });
    return () => setHelpAction(null);
  }, [setHelpAction, action.label, action.testID, action.tourTargetId]);
}
