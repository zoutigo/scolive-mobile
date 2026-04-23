import { AppShell } from "../../../src/components/navigation/AppShell";
import { TicketDetailScreen } from "../../../src/components/tickets/TicketDetailScreen";

export default function TicketDetailRoute() {
  return (
    <AppShell showHeader={false}>
      <TicketDetailScreen />
    </AppShell>
  );
}
