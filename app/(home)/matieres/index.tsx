import { AppShell } from "../../../src/components/navigation/AppShell";
import { SubjectsAdminScreen } from "../../../src/components/subjects/SubjectsAdminScreen";

export default function SubjectsRoute() {
  return (
    <AppShell showHeader={false}>
      <SubjectsAdminScreen />
    </AppShell>
  );
}
