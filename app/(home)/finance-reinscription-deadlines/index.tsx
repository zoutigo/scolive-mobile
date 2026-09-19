import { AppShell } from "../../../src/components/navigation/AppShell";
import { FinanceReinscriptionDeadlinesAdminScreen } from "../../../src/components/finance/FinanceReinscriptionDeadlinesAdminScreen";

export default function FinanceReinscriptionDeadlinesRoute() {
  return (
    <AppShell showHeader={false}>
      <FinanceReinscriptionDeadlinesAdminScreen />
    </AppShell>
  );
}
