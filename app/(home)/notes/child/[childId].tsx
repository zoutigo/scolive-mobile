import { StudentNotesScreen } from "../../../../src/components/notes/StudentNotesScreen";
import { AppShell } from "../../../../src/components/navigation/AppShell";

export default function NotesChildRoute() {
  return (
    <AppShell showHeader={false}>
      <StudentNotesScreen />
    </AppShell>
  );
}
