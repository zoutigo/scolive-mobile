import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherClassDisciplineScreen } from "../../../../src/components/discipline/TeacherClassDisciplineScreen";

export default function TeacherClassDisciplineRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherClassDisciplineScreen />
    </AppShell>
  );
}
