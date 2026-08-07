import { AppShell } from "../../../src/components/navigation/AppShell";
import { SchoolSettingsScreen } from "../../../src/components/settings/SchoolSettingsScreen";

export default function SchoolSettingsRoute() {
  return (
    <AppShell showHeader={false}>
      <SchoolSettingsScreen />
    </AppShell>
  );
}
