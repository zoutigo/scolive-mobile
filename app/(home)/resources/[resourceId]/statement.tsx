import { useLocalSearchParams } from "expo-router";
import { AppShell } from "../../../../src/components/navigation/AppShell";
import { ResourceDetailScreen } from "../../../../src/components/resources/ResourceDetailScreen";

export default function ResourceStatementRoute() {
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  return (
    <AppShell showHeader={false}>
      <ResourceDetailScreen resourceId={resourceId} part="statement" />
    </AppShell>
  );
}
