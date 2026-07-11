import { AppShell } from "../../../src/components/navigation/AppShell";
import { SchoolsAdminScreen } from "../../../src/components/schools/SchoolsAdminScreen";

export default function SchoolsRoute() {
  return (
    <AppShell showHeader={false}>
      <SchoolsAdminScreen />
    </AppShell>
  );
}
