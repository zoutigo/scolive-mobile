import { AppShell } from "../../../src/components/navigation/AppShell";
import { AdminTimetableClassesScreen } from "../../../src/components/timetable/AdminTimetableClassesScreen";

export default function AdminTimetableIndexRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminTimetableClassesScreen />
    </AppShell>
  );
}
