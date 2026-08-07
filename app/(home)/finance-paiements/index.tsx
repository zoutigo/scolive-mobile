import { AppShell } from "../../../src/components/navigation/AppShell";
import { FinancePaymentsAdminScreen } from "../../../src/components/finance/FinancePaymentsAdminScreen";

export default function FinancePaymentsRoute() {
  return (
    <AppShell showHeader={false}>
      <FinancePaymentsAdminScreen />
    </AppShell>
  );
}
