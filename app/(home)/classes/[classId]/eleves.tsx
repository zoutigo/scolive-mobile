import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherClassAttendanceScreen } from "../../../../src/components/attendance/TeacherClassAttendanceScreen";

export default function TeacherClassAttendanceRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherClassAttendanceScreen />
    </AppShell>
  );
}
