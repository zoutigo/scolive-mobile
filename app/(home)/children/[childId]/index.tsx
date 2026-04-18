import React from "react";
import { ChildHomeScreen } from "../../../../src/components/home/ChildHomeScreen";
import { AppShell } from "../../../../src/components/navigation/AppShell";

export default function ChildHomeRoute() {
  return (
    <AppShell showHeader={false}>
      <ChildHomeScreen />
    </AppShell>
  );
}
