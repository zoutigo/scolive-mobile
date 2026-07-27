import { AppShell } from "../../../src/components/navigation/AppShell";
import { RoomDetailScreen } from "../../../src/components/rooms/RoomDetailScreen";

export default function RoomDetailRoute() {
  return (
    <AppShell showHeader={false}>
      <RoomDetailScreen />
    </AppShell>
  );
}
