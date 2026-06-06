import { AppShell } from "../../../src/components/navigation/AppShell";
import { SchoolAdminDisciplineScreen } from "../../../src/components/discipline/SchoolAdminDisciplineScreen";

export default function AdminDisciplineRoute() {
  return (
    <AppShell showHeader={false}>
      <SchoolAdminDisciplineScreen />
    </AppShell>
  );
}
