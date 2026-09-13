import { AppShell } from "../../../src/components/navigation/AppShell";
import { AdminHealthStudentScreen } from "../../../src/components/health/AdminHealthStudentScreen";

export default function AdminHealthStudentScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminHealthStudentScreen />
    </AppShell>
  );
}
