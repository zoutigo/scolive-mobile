import { AppShell } from "../../../../src/components/navigation/AppShell";
import { ClassNotesManagerScreen } from "../../../../src/components/notes/ClassNotesManagerScreen";

export default function TeacherClassNotesRoute() {
  return (
    <AppShell showHeader={false}>
      <ClassNotesManagerScreen />
    </AppShell>
  );
}
