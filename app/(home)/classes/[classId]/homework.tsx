import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherClassPlaceholderScreen } from "../../../../src/components/navigation/TeacherClassPlaceholderScreen";

export default function TeacherClassHomeworkRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherClassPlaceholderScreen
        moduleTitle="Devoirs"
        moduleDescription="La route contextuelle des devoirs par classe est en place. Le métier sera branché ensuite, sans changer le contrat de navigation."
        testIDPrefix="teacher-class-homework"
      />
    </AppShell>
  );
}
