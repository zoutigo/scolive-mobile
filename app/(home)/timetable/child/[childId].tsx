import { StudentTimetableScreen } from "../../../../src/components/timetable/StudentTimetableScreen";
import { AppShell } from "../../../../src/components/navigation/AppShell";

export default function TimetableChildRoute() {
  return (
    <AppShell showHeader={false}>
      <StudentTimetableScreen />
    </AppShell>
  );
}
