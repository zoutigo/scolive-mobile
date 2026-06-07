import { AppShell } from "../../../src/components/navigation/AppShell";
import { NotesClassesScreen } from "../../../src/components/notes/NotesClassesScreen";
import { SchoolAdminNotesScreen } from "../../../src/components/notes/SchoolAdminNotesScreen";
import { useAuthStore } from "../../../src/store/auth.store";
import { getViewType } from "../../../src/components/navigation/nav-config";

export default function NotesIndexRoute() {
  const { user } = useAuthStore();
  const viewType = user ? getViewType(user) : "unknown";

  return (
    <AppShell showHeader={false}>
      {viewType === "school" ? (
        <SchoolAdminNotesScreen />
      ) : (
        <NotesClassesScreen />
      )}
    </AppShell>
  );
}
