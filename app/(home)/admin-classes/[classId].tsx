import { AppShell } from "../../../src/components/navigation/AppShell";
import { AdminClassDetailScreen } from "../../../src/components/classes/AdminClassDetailScreen";

export default function AdminClassDetailRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminClassDetailScreen />
    </AppShell>
  );
}
