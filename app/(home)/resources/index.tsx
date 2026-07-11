import { AppShell } from "../../../src/components/navigation/AppShell";
import { ResourcesScreen } from "../../../src/components/resources/ResourcesScreen";

export default function ResourcesRoute() {
  return (
    <AppShell showHeader={false}>
      <ResourcesScreen />
    </AppShell>
  );
}
