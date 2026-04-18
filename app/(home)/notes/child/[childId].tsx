import { ChildNotesScreen } from "../../../../src/components/notes/ChildNotesScreen";
import { AppShell } from "../../../../src/components/navigation/AppShell";

export default function NotesChildRoute() {
  return (
    <AppShell showHeader={false}>
      <ChildNotesScreen />
    </AppShell>
  );
}
