import { AppShell } from "../../../../src/components/navigation/AppShell";
import { AdminCaseDetailScreen } from "../../../../src/components/tests-admin/AdminCaseDetailScreen";

export default function AdminCaseDetailRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminCaseDetailScreen />
    </AppShell>
  );
}
