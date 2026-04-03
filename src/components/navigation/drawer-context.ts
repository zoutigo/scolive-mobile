import { createContext, useContext } from "react";

export interface DrawerContextValue {
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}

export const DrawerContext = createContext<DrawerContextValue>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});

export const useDrawer = () => useContext(DrawerContext);
