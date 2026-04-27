import { AppShell } from "../../../src/components/navigation/AppShell";
import { TeacherAgendaScreen } from "../../../src/components/timetable/TeacherAgendaScreen";

export default function AgendaIndexRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherAgendaScreen />
    </AppShell>
  );
}
