import { AppShell } from "../../../src/components/navigation/AppShell";
import { TicketListScreen } from "../../../src/components/tickets/TicketListScreen";

export default function TicketsRoute() {
  return (
    <AppShell showHeader={false}>
      <TicketListScreen />
    </AppShell>
  );
}
