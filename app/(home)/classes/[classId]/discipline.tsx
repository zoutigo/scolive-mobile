import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherClassPlaceholderScreen } from "../../../../src/components/navigation/TeacherClassPlaceholderScreen";

export default function TeacherClassDisciplineRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherClassPlaceholderScreen
        moduleTitle="Discipline"
        moduleDescription="La route contextuelle de discipline par classe est maintenant réservée. Le module métier enseignant sera branché dans la phase dédiée."
        testIDPrefix="teacher-class-discipline"
      />
    </AppShell>
  );
}
