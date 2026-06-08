import { AppShell } from "../../../src/components/navigation/AppShell";
import { AdminClassesScreen } from "../../../src/components/classes/AdminClassesScreen";

export default function AdminClassesRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminClassesScreen />
    </AppShell>
  );
}
