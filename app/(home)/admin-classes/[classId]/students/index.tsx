import { AppShell } from "../../../../../src/components/navigation/AppShell";
import { ClassStudentsScreen } from "../../../../../src/components/classes/ClassStudentsScreen";

export default function ClassStudentsRoute() {
  return (
    <AppShell showHeader={false}>
      <ClassStudentsScreen />
    </AppShell>
  );
}
