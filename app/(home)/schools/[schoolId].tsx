import { AppShell } from "../../../src/components/navigation/AppShell";
import { SchoolDetailScreen } from "../../../src/components/schools/SchoolDetailScreen";

export default function SchoolDetailRoute() {
  return (
    <AppShell showHeader={false}>
      <SchoolDetailScreen />
    </AppShell>
  );
}
