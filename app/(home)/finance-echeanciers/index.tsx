import { AppShell } from "../../../src/components/navigation/AppShell";
import { FinanceSchedulesAdminScreen } from "../../../src/components/finance/FinanceSchedulesAdminScreen";

export default function FinanceSchedulesRoute() {
  return (
    <AppShell showHeader={false}>
      <FinanceSchedulesAdminScreen />
    </AppShell>
  );
}
