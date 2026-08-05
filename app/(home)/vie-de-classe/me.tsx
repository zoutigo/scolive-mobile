import React from "react";
import { ClassLifeFeedScreen } from "../../../src/components/feed/ClassLifeFeedScreen";
import { AppShell } from "../../../src/components/navigation/AppShell";

export default function ClassLifeFeedMeRoute() {
  return (
    <AppShell showHeader={false}>
      <ClassLifeFeedScreen />
    </AppShell>
  );
}
