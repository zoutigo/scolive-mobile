import React from "react";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { SlotEditScreen } from "../../../src/components/timetable/SlotEditScreen";

export default function AgendaSlotEditRoute() {
  return (
    <AppShell showHeader={false}>
      <SlotEditScreen />
    </AppShell>
  );
}
