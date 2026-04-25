import { AppShell } from "../../../src/components/navigation/AppShell";
import { CreateTicketScreen } from "../../../src/components/tickets/CreateTicketScreen";

export default function CreateTicketRoute() {
  return (
    <AppShell showHeader={false}>
      <CreateTicketScreen />
    </AppShell>
  );
}
