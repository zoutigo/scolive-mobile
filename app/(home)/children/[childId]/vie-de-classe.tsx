import React from "react";
import { ChildClassFeedScreen } from "../../../../src/components/feed/ChildClassFeedScreen";
import { AppShell } from "../../../../src/components/navigation/AppShell";

export default function ChildClassFeedRoute() {
  return (
    <AppShell showHeader={false}>
      <ChildClassFeedScreen />
    </AppShell>
  );
}
