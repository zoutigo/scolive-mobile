import { AppShell } from "../../../src/components/navigation/AppShell";
import { AdminTestsScreen } from "../../../src/components/tests-admin/AdminTestsScreen";

export default function AdminTestsIndexRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminTestsScreen />
    </AppShell>
  );
}
