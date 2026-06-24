import React from "react";
import { SwipePager } from "../SwipePager";

type Props = {
  ids: string[];
  initialIndex: number;
  renderPage: (id: string, isActive: boolean) => React.ReactNode;
};

/** Pagination horizontale "swipe gauche/droite" entre fiches de détail filtrées. */
export function ExecutionsPager({ ids, initialIndex, renderPage }: Props) {
  return (
    <SwipePager
      ids={ids}
      initialIndex={initialIndex}
      renderPage={renderPage}
      testID="executions-pager"
    />
  );
}
