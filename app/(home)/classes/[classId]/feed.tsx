import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherClassPlaceholderScreen } from "../../../../src/components/navigation/TeacherClassPlaceholderScreen";

export default function TeacherClassFeedRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherClassPlaceholderScreen
        moduleTitle="Fil de classe"
        moduleDescription="La route contextuelle de classe est prête. Le flux métier du fil de classe enseignant sera branché dans la phase dédiée, sans casser la navigation actuelle."
        testIDPrefix="teacher-class-feed"
      />
    </AppShell>
  );
}
