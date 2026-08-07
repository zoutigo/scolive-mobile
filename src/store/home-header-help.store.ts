import { create } from "zustand";

export interface HomeHeaderHelpAction {
  label: string;
  onPress: () => void;
  testID?: string;
  /** Onboarding tour target id wrapping the header menu button, if it should be spotlighted. */
  tourTargetId?: string;
}

interface HomeHeaderHelpState {
  helpAction: HomeHeaderHelpAction | null;
  setHelpAction: (action: HomeHeaderHelpAction | null) => void;
}

/**
 * Lets the active role home screen (TeacherHome, ParentHome, ...), rendered
 * deep inside AppShell's children, register a help entry for the shared
 * AppHeader menu — mirroring ModuleHeader's `helpAction` prop, which module
 * screens pass directly since they own their header instance.
 */
export const useHomeHeaderHelpStore = create<HomeHeaderHelpState>((set) => ({
  helpAction: null,
  setHelpAction: (action) => set({ helpAction: action }),
}));
