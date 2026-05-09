import { createContext, useContext } from "react";

export interface DrawerContextValue {
  openDrawer: () => void;
  openDrawerForClass: (classId: string) => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}

export const DrawerContext = createContext<DrawerContextValue>({
  openDrawer: () => {},
  openDrawerForClass: () => {},
  closeDrawer: () => {},
  isDrawerOpen: false,
});

export const useDrawer = () => useContext(DrawerContext);
