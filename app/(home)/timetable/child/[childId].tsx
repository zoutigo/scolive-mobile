import { ChildTimetableScreen } from "../../../../src/components/timetable/ChildTimetableScreen";
import { AppShell } from "../../../../src/components/navigation/AppShell";

export default function TimetableChildRoute() {
  return (
    <AppShell showHeader={false}>
      <ChildTimetableScreen />
    </AppShell>
  );
}
