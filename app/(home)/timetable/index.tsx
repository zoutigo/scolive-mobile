import { AppShell } from "../../../src/components/navigation/AppShell";
import { TimetableClassesScreen } from "../../../src/components/timetable/TimetableClassesScreen";

export default function TimetableIndexRoute() {
  return (
    <AppShell showHeader={false}>
      <TimetableClassesScreen />
    </AppShell>
  );
}
