import { AppShell } from "../../../../src/components/navigation/AppShell";
import { TeacherClassHealthScreen } from "../../../../src/components/health/TeacherClassHealthScreen";

export default function TeacherClassHealthRoute() {
  return (
    <AppShell showHeader={false}>
      <TeacherClassHealthScreen />
    </AppShell>
  );
}
