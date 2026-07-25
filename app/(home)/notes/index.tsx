import { AppShell } from "../../../src/components/navigation/AppShell";
import { NotesClassesScreen } from "../../../src/components/notes/NotesClassesScreen";
import { ClassNotesManagerScreen } from "../../../src/components/notes/ClassNotesManagerScreen";
import { useAuthStore } from "../../../src/store/auth.store";
import { getViewType } from "../../../src/components/navigation/nav-config";

export default function NotesIndexRoute() {
  const { user } = useAuthStore();
  const viewType = user ? getViewType(user) : "unknown";

  return (
    <AppShell showHeader={false}>
      {viewType === "school" ? (
        <ClassNotesManagerScreen />
      ) : (
        <NotesClassesScreen />
      )}
    </AppShell>
  );
}
