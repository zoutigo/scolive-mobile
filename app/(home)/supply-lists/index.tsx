import { AppShell } from "../../../src/components/navigation/AppShell";
import { SupplyListsAdminScreen } from "../../../src/components/supply-lists/SupplyListsAdminScreen";

export default function SupplyListsRoute() {
  return (
    <AppShell showHeader={false}>
      <SupplyListsAdminScreen />
    </AppShell>
  );
}
