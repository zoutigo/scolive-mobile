import { AppShell } from "../../../src/components/navigation/AppShell";
import { PromotionsAdminScreen } from "../../../src/components/promotions/PromotionsAdminScreen";

export default function PromotionsRoute() {
  return (
    <AppShell showHeader={false}>
      <PromotionsAdminScreen />
    </AppShell>
  );
}
