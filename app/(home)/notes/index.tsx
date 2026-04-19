import { NotesClassesScreen } from "../../../src/components/notes/NotesClassesScreen";
import { AppShell } from "../../../src/components/navigation/AppShell";

export default function NotesIndexRoute() {
  return (
    <AppShell showHeader={false}>
      <NotesClassesScreen />
    </AppShell>
  );
}
