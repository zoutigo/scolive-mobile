import { ClassNotesManagerScreen } from "../../../../src/components/notes/ClassNotesManagerScreen";
import { AppShell } from "../../../../src/components/navigation/AppShell";

export default function NotesClassRoute() {
  return (
    <AppShell showHeader={false}>
      <ClassNotesManagerScreen />
    </AppShell>
  );
}
