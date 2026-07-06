import { AppShell } from "../../../src/components/navigation/AppShell";
import { RoomsAdminScreen } from "../../../src/components/rooms/RoomsAdminScreen";

export default function RoomsRoute() {
  return (
    <AppShell showHeader={false}>
      <RoomsAdminScreen />
    </AppShell>
  );
}
