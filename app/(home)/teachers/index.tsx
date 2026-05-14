import { AppShell } from "../../../src/components/navigation/AppShell";
import { TeachersAdminScreen } from "../../../src/components/teachers/TeachersAdminScreen";

export default function TeachersRoute() {
  return (
    <AppShell showHeader={false}>
      <TeachersAdminScreen />
    </AppShell>
  );
}
